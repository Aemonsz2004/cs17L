<?php

namespace App\Support;

use App\Events\PaymentVerifiedEvent;
use App\Models\ApplicationPayment;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ApplicationPaymentService
{
    public function __construct(private readonly ApplicationAuditService $audit) {}

    public function initiateDepositPayment(RentalApplication $application, string $paymentMethod, bool $forceRegenerate = false): ApplicationPayment
    {
        if ($application->status !== RentalApplication::STATUS_PAYMENT_PENDING) {
            throw new \RuntimeException('Payment checkout is only available during the payment-pending stage.');
        }

        $application->loadMissing('unit');

        if (! $application->unit) {
            throw new \RuntimeException('Application unit could not be found.');
        }

        if (! $forceRegenerate) {
            $existingPending = ApplicationPayment::where('rental_application_id', $application->id)
                ->whereIn('status', ['payment_pending'])
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->latest('id')
                ->first();

            if ($existingPending) {
                return $existingPending;
            }
        }

        $amount = (int) $application->unit->base_rent * 2;
        $expiresAt = Carbon::now()->addMinutes((int) config('services.paymongo.deposit_expires_minutes', 30));

        $checkoutPayload = $this->createCheckout($application, $paymentMethod, $amount, $expiresAt);

        return DB::transaction(function () use ($application, $paymentMethod, $checkoutPayload, $amount, $expiresAt): ApplicationPayment {
            $application->refresh();

            if ($application->status !== RentalApplication::STATUS_PAYMENT_PENDING) {
                throw new \RuntimeException('Application is no longer eligible for deposit payment.');
            }

            // Ensure only one active pending checkout per application.
            ApplicationPayment::where('rental_application_id', $application->id)
                ->where('status', 'payment_pending')
                ->update([
                    'status' => 'expired',
                    'expires_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

            $payment = ApplicationPayment::create([
                'rental_application_id' => $application->id,
                'user_id' => $application->user_id,
                'provider' => 'paymongo',
                'provider_reference' => $checkoutPayload['provider_reference'],
                'checkout_url' => $checkoutPayload['checkout_url'],
                'amount' => $amount,
                'currency' => 'PHP',
                'payment_method' => $paymentMethod,
                'status' => 'payment_pending',
                'metadata' => array_merge([
                    'unit_id' => $application->unit_id,
                ], $checkoutPayload['metadata']),
                'expires_at' => $expiresAt,
            ]);

            $application->update([
                'deposit_submitted_at' => now(),
            ]);

            $this->audit->logContext(
                $application,
                (int) $application->user_id,
                'Payment checkout created.',
                [
                    'payment_id' => $payment->id,
                    'provider_reference' => $payment->provider_reference,
                    'payment_method' => $paymentMethod,
                    'checkout_mode' => data_get($payment->metadata, 'checkout_mode'),
                ],
            );

            RtmsNotification::create([
                'variant' => 'amber',
                'message' => 'Deposit payment checkout created. Waiting for PayMongo webhook verification.',
                'category' => 'payment',
                'tenant_id' => null,
                'unread' => true,
            ]);

            return $payment;
        });
    }

    public function syncPendingCheckoutStatus(ApplicationPayment $payment): bool
    {
        if ($payment->status !== 'payment_pending') {
            return false;
        }

        $enabled = (bool) config('services.paymongo.enabled', false);
        $secretKey = (string) config('services.paymongo.secret_key', '');
        $checkoutMode = (string) data_get($payment->metadata, 'checkout_mode', '');

        if (! $enabled || $secretKey === '' || $checkoutMode !== 'paymongo_api') {
            return false;
        }

        $providerReference = trim((string) $payment->provider_reference);
        if ($providerReference === '') {
            return false;
        }

        $baseUrl = rtrim((string) config('services.paymongo.base_url', 'https://api.paymongo.com/v1'), '/');
        $timeoutSeconds = max(5, (int) config('services.paymongo.timeout_seconds', 20));

        try {
            $response = $this->payMongoHttpClient($secretKey, $timeoutSeconds)
                ->get($baseUrl.'/checkout_sessions/'.$providerReference);
        } catch (ConnectionException $exception) {
            if ($this->shouldRetryWithoutTlsVerification($exception)) {
                $response = $this->payMongoHttpClient($secretKey, $timeoutSeconds, true)
                    ->get($baseUrl.'/checkout_sessions/'.$providerReference);
            } else {
                throw new \RuntimeException('Failed to sync PayMongo checkout status: '.$exception->getMessage(), 0, $exception);
            }
        }

        if (! $response->successful()) {
            return false;
        }

        $sessionStatus = strtolower((string) data_get($response->json(), 'data.attributes.status', ''));
        $paymentIntentStatus = strtolower((string) data_get($response->json(), 'data.attributes.payment_intent.attributes.status', ''));
        $payments = data_get($response->json(), 'data.attributes.payments', []);
        $hasPaidPayment = collect(is_array($payments) ? $payments : [])
            ->contains(fn ($item) => strtolower((string) data_get($item, 'attributes.status', '')) === 'paid');
        $metadata = data_get($response->json(), 'data.attributes.metadata');
        $normalizedMetadata = is_array($metadata) ? $metadata : [];

        $eventType = null;

        if ($sessionStatus === 'paid' || $paymentIntentStatus === 'succeeded' || $hasPaidPayment) {
            $eventType = 'checkout_session.payment.paid';
        } elseif ($sessionStatus === 'expired') {
            $eventType = 'checkout_session.expired';
        } elseif ($sessionStatus === 'failed' || $paymentIntentStatus === 'payment_failed') {
            $eventType = 'checkout_session.payment.failed';
        }

        if (! $eventType) {
            return false;
        }

        $providerEventId = 'manual_sync_'.$providerReference.'_'.time();

        $this->handleWebhookPayload([
            'data' => [
                'id' => $providerEventId,
                'attributes' => [
                    'type' => $eventType,
                    'data' => [
                        'id' => $providerReference,
                        'attributes' => [
                            'checkout_session_id' => $providerReference,
                            'metadata' => $normalizedMetadata,
                        ],
                    ],
                ],
            ],
        ], $providerEventId);

        return true;
    }

    private function createCheckout(RentalApplication $application, string $paymentMethod, int $amountInPhp, Carbon $expiresAt): array
    {
        $localReference = 'pi_pm_'.Str::lower(Str::random(20));
        $checkoutTemplate = (string) config('services.paymongo.checkout_base_url', 'https://payments.paymongo.com/checkout/{reference}');
        $simulatedCheckoutUrl = str_contains($checkoutTemplate, '{reference}')
            ? str_replace('{reference}', $localReference, $checkoutTemplate)
            : rtrim($checkoutTemplate, '/').'/'.$localReference;

        $enabled = (bool) config('services.paymongo.enabled', false);
        $secretKey = (string) config('services.paymongo.secret_key', '');

        if (! $enabled || $secretKey === '') {
            return [
                'provider_reference' => $localReference,
                'checkout_url' => $simulatedCheckoutUrl,
                'metadata' => [
                    'checkout_mode' => 'simulated',
                    'provider_reference_local' => $localReference,
                ],
            ];
        }

        $baseUrl = rtrim((string) config('services.paymongo.base_url', 'https://api.paymongo.com/v1'), '/');
        $successUrl = (string) config('services.paymongo.success_url', rtrim((string) config('app.url', ''), '/').'/apply/dashboard');
        $cancelUrl = (string) config('services.paymongo.cancel_url', rtrim((string) config('app.url', ''), '/').'/apply/dashboard');
        $timeoutSeconds = max(5, (int) config('services.paymongo.timeout_seconds', 20));

        $amountInCentavos = $amountInPhp * 100;
        $description = sprintf('Security deposit for Unit %s', (string) optional($application->unit)->number);

        $payload = [
            'data' => [
                'attributes' => [
                    'billing' => [
                        'name' => (string) $application->full_name,
                        'email' => (string) optional($application->user)->email,
                    ],
                    'description' => $description,
                    'line_items' => [[
                        'name' => 'Security Deposit',
                        'description' => $description,
                        'amount' => $amountInCentavos,
                        'currency' => 'PHP',
                        'quantity' => 1,
                    ]],
                    'payment_method_types' => $this->mapPaymentMethodTypes($paymentMethod),
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                    'show_description' => true,
                    'show_line_items' => true,
                    'metadata' => [
                        'provider_reference' => $localReference,
                        'payment_reference' => $localReference,
                        'rental_application_id' => (string) $application->id,
                        'user_id' => (string) $application->user_id,
                    ],
                ],
            ],
        ];

        $unixExpiry = $expiresAt->timestamp;
        if ($unixExpiry > 0) {
            $payload['data']['attributes']['expires_at'] = $unixExpiry;
        }

        try {
            $response = $this->payMongoHttpClient($secretKey, $timeoutSeconds)
                ->post($baseUrl.'/checkout_sessions', $payload);
        } catch (ConnectionException $exception) {
            if ($this->shouldRetryWithoutTlsVerification($exception)) {
                logger()->warning('Retrying PayMongo request without TLS verification in local environment due to certificate error.', [
                    'error' => $exception->getMessage(),
                ]);

                $response = $this->payMongoHttpClient($secretKey, $timeoutSeconds, true)
                    ->post($baseUrl.'/checkout_sessions', $payload);
            } else {
                throw new \RuntimeException('Failed to connect to PayMongo API: '.$exception->getMessage(), 0, $exception);
            }
        }

        if (! $response->successful()) {
            $detail = (string) (data_get($response->json(), 'errors.0.detail')
                ?? data_get($response->json(), 'errors.0.code')
                ?? 'Unknown PayMongo API error');

            throw new \RuntimeException(sprintf(
                'Failed to create PayMongo checkout session (%d): %s',
                $response->status(),
                $detail
            ));
        }

        $checkoutSessionId = (string) data_get($response->json(), 'data.id', '');
        $checkoutUrl = (string) data_get($response->json(), 'data.attributes.checkout_url', '');

        if ($checkoutSessionId === '' || $checkoutUrl === '') {
            throw new \RuntimeException('PayMongo checkout session response is missing required fields.');
        }

        return [
            'provider_reference' => $checkoutSessionId,
            'checkout_url' => $checkoutUrl,
            'metadata' => [
                'checkout_mode' => 'paymongo_api',
                'provider_reference_local' => $localReference,
                'paymongo_checkout_session_id' => $checkoutSessionId,
            ],
        ];
    }

    private function mapPaymentMethodTypes(string $paymentMethod): array
    {
        return match ($paymentMethod) {
            'GCash' => ['gcash'],
            'Maya' => ['paymaya'],
            'Card' => ['card'],
            'Bank Transfer' => ['dob'],
            default => ['gcash'],
        };
    }

    private function payMongoHttpClient(string $secretKey, int $timeoutSeconds, bool $forceInsecure = false): PendingRequest
    {
        $request = Http::withBasicAuth($secretKey, '')
            ->acceptJson()
            ->asJson()
            ->timeout($timeoutSeconds);

        if ($forceInsecure) {
            return $request->withOptions(['verify' => false]);
        }

        $verifyTls = (bool) config('services.paymongo.verify_tls', true);
        if (! $verifyTls) {
            return $request->withOptions(['verify' => false]);
        }

        $caBundlePath = trim((string) config('services.paymongo.ca_bundle_path', ''));
        if ($caBundlePath === '') {
            return $request;
        }

        if (! is_file($caBundlePath)) {
            throw new \RuntimeException('PAYMONGO_CA_BUNDLE_PATH is set but file was not found: '.$caBundlePath);
        }

        return $request->withOptions(['verify' => $caBundlePath]);
    }

    private function shouldRetryWithoutTlsVerification(ConnectionException $exception): bool
    {
        if (! app()->environment('local')) {
            return false;
        }

        if (! (bool) config('services.paymongo.allow_insecure_local_fallback', false)) {
            return false;
        }

        $message = $exception->getMessage();

        return str_contains($message, 'cURL error 77')
            || str_contains($message, 'error setting certificate file')
            || str_contains($message, 'SSL certificate problem');
    }

    public function verifyWebhookSignature(string $payload, ?string $signatureHeader): void
    {
        $secret = (string) config('services.paymongo.webhook_secret', '');

        if ($secret === '') {
            return;
        }

        if (! $signatureHeader) {
            throw new \RuntimeException('Missing PayMongo signature header.');
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $piece) {
            [$key, $value] = array_pad(explode('=', trim($piece), 2), 2, null);
            if ($key && $value) {
                $parts[$key] = $value;
            }
        }

        $timestamp = $parts['t'] ?? null;
        $provided = $parts['v1'] ?? null;

        if (! $timestamp || ! $provided) {
            throw new \RuntimeException('Invalid PayMongo signature payload.');
        }

        if (! ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 300) {
            throw new \RuntimeException('PayMongo signature timestamp is stale.');
        }

        $computed = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        if (! hash_equals($computed, $provided)) {
            throw new \RuntimeException('Invalid PayMongo webhook signature.');
        }
    }

    public function handleWebhook(array $payload): void
    {
        $this->handleWebhookPayload($payload, null);
    }

    public function handleWebhookPayload(array $payload, ?string $providerEventId = null): void
    {
        $eventType = (string) (data_get($payload, 'data.attributes.type') ?? data_get($payload, 'type') ?? '');

        if ($eventType === '') {
            return;
        }

        $isPaidEvent = str_contains($eventType, 'payment.paid')
            || str_contains($eventType, 'payment_intent.succeeded')
            || str_contains($eventType, 'source.chargeable')
            || str_contains($eventType, 'checkout_session.payment.paid');

        $isFailedEvent = str_contains($eventType, 'payment.failed')
            || str_contains($eventType, 'payment_intent.payment_failed')
            || str_contains($eventType, 'checkout_session.payment.failed');

        $isExpiredEvent = str_contains($eventType, 'checkout_session.expired')
            || str_contains($eventType, 'source.expired');

        if (! $isPaidEvent && ! $isFailedEvent && ! $isExpiredEvent) {
            return;
        }

        $metadata = $this->extractMetadata($payload);
        $reference = $this->resolveReference($payload, $metadata);

        if (! $reference) {
            return;
        }

        DB::transaction(function () use ($reference, $payload, $metadata, $providerEventId, $isPaidEvent, $isFailedEvent, $isExpiredEvent): void {
            $payment = ApplicationPayment::where('provider_reference', $reference)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                $rentalApplicationId = Arr::get($metadata, 'rental_application_id');
                if (is_numeric($rentalApplicationId)) {
                    $payment = ApplicationPayment::where('rental_application_id', (int) $rentalApplicationId)
                        ->whereIn('status', ['payment_pending'])
                        ->latest('id')
                        ->lockForUpdate()
                        ->first();
                }
            }

            if (! $payment) {
                return;
            }

            if ($isPaidEvent && $payment->status === 'payment_paid') {
                return;
            }

            if ($isPaidEvent) {
                $paidAt = data_get($payload, 'data.attributes.data.attributes.paid_at');
                $paidAtParsed = is_string($paidAt) ? Carbon::parse($paidAt) : now();

                $payment->update([
                    'status' => 'payment_paid',
                    'paid_at' => $paidAtParsed,
                    'verified_at' => now(),
                    'webhook_payload' => $payload,
                ]);
            }

            if ($isFailedEvent || $isExpiredEvent) {
                $payment->update([
                    'status' => $isExpiredEvent ? 'expired' : 'failed',
                    'webhook_payload' => $payload,
                ]);
            }

            $application = RentalApplication::where('id', $payment->rental_application_id)
                ->lockForUpdate()
                ->first();

            if (! $application) {
                return;
            }

            if ($isPaidEvent && in_array($application->status, [RentalApplication::STATUS_PAYMENT_PENDING, RentalApplication::STATUS_PAYMENT_PAID], true)) {
                $application->update([
                    'payment_verified_at' => now(),
                    'payment_paid_at' => now(),
                    'deposit_confirmed_at' => now(),
                ]);

                $this->audit->logContext(
                    $application,
                    null,
                    'Payment verified via webhook.',
                    [
                        'payment_id' => $payment->id,
                        'provider_event_id' => $providerEventId,
                        'provider_reference' => $payment->provider_reference,
                    ],
                );

                event(new PaymentVerifiedEvent((int) $application->id, (int) $payment->id, $providerEventId));
            }

            if ($isFailedEvent || $isExpiredEvent) {
                $this->audit->logContext(
                    $application,
                    null,
                    'Payment failed/expired via webhook.',
                    [
                        'payment_id' => $payment->id,
                        'provider_event_id' => $providerEventId,
                        'provider_reference' => $payment->provider_reference,
                        'status' => $payment->status,
                    ],
                );
            }

            RtmsNotification::create([
                'variant' => $isPaidEvent ? 'teal' : 'red',
                'message' => $isPaidEvent
                    ? 'Payment verified via PayMongo webhook. Auto-conversion process started.'
                    : 'Payment marked as failed/expired by PayMongo webhook.',
                'category' => 'payment',
                'tenant_id' => null,
                'unread' => true,
            ]);
        });
    }

    private function extractMetadata(array $payload): array
    {
        $metadataCandidates = [
            data_get($payload, 'data.attributes.data.attributes.metadata'),
            data_get($payload, 'data.attributes.metadata'),
            data_get($payload, 'data.attributes.data.attributes.attributes.metadata'),
        ];

        $metadata = collect($metadataCandidates)->first(fn ($value) => is_array($value));

        return is_array($metadata) ? $metadata : [];
    }

    private function resolveReference(array $payload, array $metadata): ?string
    {
        $referenceCandidates = [
            data_get($payload, 'data.attributes.data.attributes.payment_intent_id'),
            data_get($payload, 'data.attributes.data.attributes.checkout_session_id'),
            data_get($payload, 'data.attributes.data.id'),
            Arr::get($metadata, 'provider_reference'),
            Arr::get($metadata, 'payment_reference'),
            Arr::get($metadata, 'paymongo_checkout_session_id'),
            data_get($payload, 'data.id'),
        ];

        $reference = collect($referenceCandidates)
            ->filter(fn ($value) => is_string($value) && $value !== '')
            ->first();

        return is_string($reference) ? $reference : null;
    }
}
