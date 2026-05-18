<?php

namespace App\Support;

use App\Events\PaymentVerifiedEvent;
use App\Models\Invoice;
use App\Models\Unit;
use App\Models\UnitHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CashPaymentService
{
    public function submitPaymentProof(Invoice $invoice, User $tenant): void
    {
        if ($invoice->status !== 'due') {
            throw new \RuntimeException('This invoice is not due.');
        }

        if ($invoice->method !== 'Cash') {
            throw new \RuntimeException('This invoice is not marked for cash payment.');
        }

        $invoice->update([
            'status' => 'pending',
        ]);
    }

    public function confirmCashPayment(
        Invoice $invoice,
        string $receiptNumber,
        ?int $adminId = null,
    ): void {
        DB::transaction(function () use ($invoice, $receiptNumber, $adminId): void {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($invoice->status !== 'due' && $invoice->status !== 'pending') {
                throw new \RuntimeException('This invoice cannot be marked as paid.');
            }

            if ($invoice->method !== 'Cash') {
                throw new \RuntimeException('This invoice is not a cash payment.');
            }

            $invoice->update([
                'status' => 'paid',
                'receipt_number' => $receiptNumber,
                'recorded_by_admin_id' => $adminId,
                'payment_received_at' => now(),
                'paid_date' => today(),
            ]);

            $tenant = $invoice->tenant()->lockForUpdate()->firstOrFail();

            if ($invoice->period === 'Deposit') {
                $tenant->update(['status' => 'active']);

                if ($tenant->activeLease) {
                    $lease = $tenant->activeLease()->first();
                    $lease->update(['status' => 'active']);

                    if ($lease->unit_id) {
                        Unit::whereKey($lease->unit_id)->update(['status' => 'occupied']);

                        UnitHistory::create([
                            'unit_id' => $lease->unit_id,
                            'tenant_id' => $tenant->id,
                            'lease_id' => $lease->id,
                            'start_date' => now()->toDateString(),
                        ]);
                    }
                }

                User::whereKey($tenant->user_id)
                    ->where('role', 'applicant')
                    ->update(['role' => 'tenant']);
            } else {
                $currentMonthHasUnpaidInvoices = Invoice::where('tenant_id', $tenant->id)
                    ->where('status', 'due')
                    ->where('period', '!=', 'Deposit')
                    ->exists();

                if (! $currentMonthHasUnpaidInvoices) {
                    $tenant->update(['status' => 'active']);

                    if ($tenant->activeLease) {
                        $tenant->activeLease()->update(['status' => 'active']);

                        if ($tenant->activeLease->unit_id) {
                            Unit::whereKey($tenant->activeLease->unit_id)->update(['status' => 'occupied']);
                        }
                    }
                }

                User::whereKey($tenant->user_id)
                    ->where('role', 'applicant')
                    ->update(['role' => 'tenant']);
            }

            PaymentVerifiedEvent::dispatch($invoice);
        });
    }
}
