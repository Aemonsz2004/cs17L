<?php

namespace App\Support;

use App\Events\ApplicationApprovedEvent;
use App\Models\Invoice;
use App\Models\RentalApplication;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;

class ApplicationApprovalService
{
    public function __construct(
        private readonly ApplicationWorkflowService $workflowService,
        private readonly TenantService $tenantService,
        private readonly LeaseService $leaseService,
    ) {}

    public function approve(RentalApplication $application, Unit $unit, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $unit, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            $unit = Unit::whereKey($unit->id)->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw new \RuntimeException('Selected unit is no longer available.');
            }

            if ($application->status !== RentalApplication::STATUS_PENDING_REVIEW) {
                throw new \RuntimeException('Only pending applications can be approved.');
            }

            $this->workflowService->approve($application, $adminId);

            $application->refresh();

            $tenant = $this->tenantService->createFromApplication(
                $application,
                $unit->lease_payment_method ?? 'Cash'
            );

            $tenant->activeLease()->update(['status' => 'pending']);

            $depositAmount = $unit->getDepositAmount();

            Invoice::create([
                'invoice_no' => Invoice::nextInvoiceNo(),
                'tenant_id' => $tenant->id,
                'lease_id' => $tenant->activeLease()->first()?->id,
                'period' => 'Deposit',
                'rent' => 0,
                'utilities' => 0,
                'penalty' => 0,
                'total' => $depositAmount,
                'due_date' => now()->addDays(7),
                'method' => 'PayMongo',
                'status' => 'due',
            ]);

            $unit->update([
                'status' => 'reserved',
            ]);

            ApplicationApprovedEvent::dispatch($application, $tenant, $unit);
        });
    }
}
