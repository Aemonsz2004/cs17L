<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\Lease;
use App\Models\RentalApplication;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\UnitHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApplicationWorkflowService
{
    public function approve(RentalApplication $application, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->status !== RentalApplication::STATUS_PENDING) {
                throw new \RuntimeException('Only pending applications can be approved.');
            }

            $unit = Unit::whereKey($application->unit_id)->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw new \RuntimeException('Selected unit is no longer available.');
            }

            $application->update([
                'status' => RentalApplication::STATUS_APPROVED,
                'admin_id' => $adminId,
            ]);

            $unit->update([
                'status' => 'reserved',
            ]);
        });
    }

    public function reject(RentalApplication $application, string $reason, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $reason, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if (! in_array($application->status, [RentalApplication::STATUS_PENDING, RentalApplication::STATUS_APPROVED], true)) {
                throw new \RuntimeException('Application cannot be rejected in its current state.');
            }

            $application->update([
                'status' => RentalApplication::STATUS_REJECTED,
                'rejection_reason' => $reason,
                'admin_id' => $adminId,
            ]);

            if ($application->unit && $application->unit->status === 'reserved') {
                $application->unit->update(['status' => 'vacant', 'tenant_id' => null]);
            }
        });
    }

    public function confirmPayment(RentalApplication $application, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->status !== RentalApplication::STATUS_APPROVED) {
                throw new \RuntimeException('Only approved applications can be marked as paid.');
            }

            $application->update([
                'status' => RentalApplication::STATUS_PAID,
                'admin_id' => $adminId ?? $application->admin_id,
            ]);
        });
    }

    public function confirmMoveIn(RentalApplication $application, int $leaseDuration, ?string $paymentMethod = null, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $leaseDuration, $paymentMethod, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->status !== RentalApplication::STATUS_PAID) {
                throw new \RuntimeException('Only applications with confirmed payment can be confirmed for move-in.');
            }

            $unit = Unit::whereKey($application->unit_id)->lockForUpdate()->firstOrFail();

            if ($unit->status !== 'reserved') {
                throw new \RuntimeException('Unit is not reserved.');
            }

            $paymentMethod = $paymentMethod ?? $application->payment_method ?? 'GCash';

            $user = User::whereKey($application->user_id)->lockForUpdate()->firstOrFail();

            $startDate = $application->preferred_move_in ?? now()->startOfDay();
            $endDate = (clone $startDate)->addMonths($leaseDuration)->subDay();

            Tenant::withTrashed()->where('user_id', $user->id)->forceDelete();

            $tenant = Tenant::create([
                'user_id' => $user->id,
                'name' => $application->full_name,
                'initials' => $this->initials($application->full_name),
                'contact' => $application->occupation,
                'phone' => $application->emergency_contact,
                'email' => $user->email,
                'floor' => $unit->floor,
                'type' => $unit->type,
                'rent' => $unit->base_rent,
                'deposit' => $unit->getDepositAmount(),
                'lease_start' => $startDate->toDateString(),
                'lease_end' => $endDate->toDateString(),
                'payment_method' => $paymentMethod,
                'status' => 'active',
            ]);

            $lease = Lease::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $unit->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'rent' => $unit->base_rent,
                'deposit' => $unit->getDepositAmount(),
                'payment_method' => $paymentMethod,
                'status' => Lease::STATUS_ACTIVE,
            ]);

            $user->update([
                'tenant_id' => $tenant->id,
                'role' => 'tenant',
            ]);

            $unit->update([
                'tenant_id' => $tenant->id,
                'status' => 'occupied',
            ]);

            $application->update([
                'status' => RentalApplication::STATUS_CONVERTED,
                'converted_at' => now(),
                'move_in_confirmed_at' => now(),
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $user->id,
                'admin_id' => $adminId ?? $application->admin_id,
            ]);

            UnitHistory::create([
                'unit_id' => $unit->id,
                'tenant_id' => $tenant->id,
                'lease_id' => $lease->id,
                'start_date' => $startDate->toDateString(),
            ]);

            $depositPayment = $application->payments()
                ->where('status', 'payment_paid')
                ->latest('id')
                ->first();

            if ($depositPayment) {
                Invoice::create([
                    'invoice_no' => Invoice::nextInvoiceNo(),
                    'tenant_id' => $tenant->id,
                    'lease_id' => $lease->id,
                    'period' => 'Security Deposit',
                    'rent' => 0,
                    'utilities' => 0,
                    'penalty' => 0,
                    'total' => $depositPayment->amount,
                    'due_date' => $startDate->toDateString(),
                    'paid_date' => $depositPayment->paid_at?->toDateString() ?? $startDate->toDateString(),
                    'method' => $depositPayment->payment_method ?? $paymentMethod,
                    'status' => 'paid',
                ]);
            }

            $firstRentDue = (clone $startDate)->addMonths(2);
            $periodLabel = $firstRentDue->format('F Y');

            Invoice::create([
                'invoice_no' => Invoice::nextInvoiceNo(),
                'tenant_id' => $tenant->id,
                'lease_id' => $lease->id,
                'period' => $periodLabel,
                'rent' => $unit->base_rent,
                'utilities' => 0,
                'penalty' => 0,
                'total' => $unit->base_rent,
                'due_date' => $firstRentDue->toDateString(),
                'method' => $paymentMethod,
                'status' => 'due',
            ]);
        });
    }

    public function autoConvertAfterPaymentVerified(int $applicationId, ?string $providerEventId = null): void
    {
        $application = RentalApplication::findOrFail($applicationId);

        if ($application->status === RentalApplication::STATUS_APPROVED) {
            $this->confirmPayment($application, null);
        }
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';

        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }
            $initials .= strtoupper(substr($part, 0, 1));
            if (strlen($initials) >= 4) {
                break;
            }
        }

        return $initials !== '' ? substr($initials, 0, 4) : 'TEN';
    }
}
