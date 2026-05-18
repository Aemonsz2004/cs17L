<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PayMongoDemoController extends Controller
{
    public function createIntent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'channel' => ['nullable', 'in:gcash'],
        ]);

        $invoice = Invoice::where('id', $data['invoice_id'])
            ->where('tenant_id', $this->tenantUser(Auth::user())->tenant_id)
            ->whereIn('status', ['due', 'overdue'])
            ->firstOrFail();

        $this->assertInvoiceMatchesUnit($invoice);

        $intentId = 'pi_demo_'.Str::lower(Str::random(16));

        $intent = [
            'id' => $intentId,
            'tenant_id' => $this->tenantUser(Auth::user())->tenant_id,
            'invoice_id' => $invoice->id,
            'amount' => (int) $invoice->total * 100,
            'currency' => 'PHP',
            'channel' => $data['channel'] ?? 'gcash',
            'status' => 'awaiting_payment_method',
            'created_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
            'checkout_url' => 'https://demo.paymongo.local/checkout/'.$intentId,
        ];

        Cache::put($this->cacheKey($intentId), $intent, now()->addMinutes(20));

        return response()->json([
            'data' => [
                'id' => $intentId,
                'type' => 'payment_intent',
                'attributes' => [
                    'amount' => $intent['amount'],
                    'currency' => $intent['currency'],
                    'status' => $intent['status'],
                    'payment_method_allowed' => [$intent['channel']],
                    'capture_type' => 'automatic',
                    'client_key' => 'pk_test_demo_'.Str::lower(Str::random(12)),
                    'next_action' => [
                        'type' => 'redirect',
                        'redirect' => [
                            'checkout_url' => $intent['checkout_url'],
                        ],
                    ],
                    'expires_at' => $intent['expires_at'],
                ],
            ],
        ]);
    }

    public function showIntent(string $intentId): JsonResponse
    {
        $intent = Cache::get($this->cacheKey($intentId));

        if (! $intent || (int) $intent['tenant_id'] !== (int) $this->tenantUser(Auth::user())->tenant_id) {
            abort(404);
        }

        return response()->json([
            'data' => [
                'id' => $intent['id'],
                'type' => 'payment_intent',
                'attributes' => [
                    'amount' => $intent['amount'],
                    'currency' => $intent['currency'],
                    'status' => $intent['status'],
                    'expires_at' => $intent['expires_at'],
                ],
            ],
        ]);
    }

    public function confirmIntent(string $intentId): JsonResponse
    {
        $intent = Cache::get($this->cacheKey($intentId));

        if (! $intent || (int) $intent['tenant_id'] !== (int) $this->tenantUser(Auth::user())->tenant_id) {
            abort(404);
        }

        $intent['status'] = 'succeeded';
        $intent['paid_at'] = now()->toIso8601String();
        $intent['source_id'] = 'src_demo_'.Str::lower(Str::random(14));

        Cache::put($this->cacheKey($intentId), $intent, now()->addMinutes(20));

        return response()->json([
            'data' => [
                'id' => $intent['id'],
                'type' => 'payment_intent',
                'attributes' => [
                    'status' => $intent['status'],
                    'paid_at' => $intent['paid_at'],
                    'source_id' => $intent['source_id'],
                ],
            ],
        ]);
    }

    private function cacheKey(string $intentId): string
    {
        return 'paymongo_demo:intent:'.$intentId;
    }

    private function tenantUser(mixed $user): User
    {
        abort_unless($user instanceof User && $user->isTenant(), 403);

        return $user;
    }

    private function assertInvoiceMatchesUnit(Invoice $invoice): void
    {
        $expectedTotal = (int) $invoice->rent + (int) $invoice->utilities + (int) $invoice->penalty;

        if ((int) $invoice->total !== $expectedTotal) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Invoice total mismatch. Please contact admin.',
            ]);
        }

        $invoice->loadMissing(['lease.unit']);
        $baseRent = $invoice->lease?->unit?->base_rent;

        if ($baseRent !== null && (int) $invoice->rent !== (int) $baseRent) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Rent amount does not match the unit rent. Please contact admin.',
            ]);
        }
    }
}
