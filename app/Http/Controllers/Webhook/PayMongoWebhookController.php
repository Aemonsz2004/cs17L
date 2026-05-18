<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPayMongoWebhook;
use App\Models\WebhookEvent;
use App\Support\ApplicationPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class PayMongoWebhookController extends Controller
{
    public function __invoke(Request $request, ApplicationPaymentService $paymentService): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature');
        $decodedPayload = $request->json()->all();

        try {
            $paymentService->verifyWebhookSignature(
                $payload,
                $signature
            );

            $providerEventId = (string) (data_get($decodedPayload, 'data.id')
                ?? data_get($decodedPayload, 'id')
                ?? ('evt_hash_'.sha1($payload)));

            $webhookEvent = DB::transaction(function () use ($providerEventId, $signature, $decodedPayload): WebhookEvent {
                $event = WebhookEvent::where('provider', 'paymongo')
                    ->where('event_id', $providerEventId)
                    ->lockForUpdate()
                    ->first();

                if ($event) {
                    return $event;
                }

                return WebhookEvent::create([
                    'provider' => 'paymongo',
                    'event_id' => $providerEventId,
                    'signature' => $signature,
                    'payload' => $decodedPayload,
                    'status' => 'pending',
                    'attempts' => 0,
                ]);
            });

            if ($webhookEvent->isProcessed()) {
                return response()->json([
                    'ok' => true,
                    'duplicate' => true,
                ]);
            }

            try {
                $webhookEvent->attempts++;
                $webhookEvent->save();

                $paymentService->handleWebhookPayload((array) $webhookEvent->payload, $webhookEvent->event_id);

                $webhookEvent->update([
                    'status' => 'processed',
                    'processed_at' => now(),
                    'last_error' => null,
                ]);
            } catch (Throwable $processingException) {
                $webhookEvent->update([
                    'status' => 'failed',
                    'last_error' => $processingException->getMessage(),
                ]);

                ProcessPayMongoWebhook::dispatch($webhookEvent->id);

                return response()->json([
                    'ok' => true,
                    'queued_retry' => true,
                    'message' => 'Webhook accepted; processing queued for retry.',
                ], 202);
            }
        } catch (\RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 400);
        }

        return response()->json(['ok' => true]);
    }
}
