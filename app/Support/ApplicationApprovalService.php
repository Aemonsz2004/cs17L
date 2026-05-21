<?php

namespace App\Support;

use App\Models\RentalApplication;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;

class ApplicationApprovalService
{
    public function __construct(
        private readonly ApplicationWorkflowService $workflowService,
    ) {}

    public function approve(RentalApplication $application, Unit $unit, ?int $adminId = null): void
    {
        DB::transaction(function () use ($application, $unit, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            $unit = Unit::whereKey($unit->id)->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw new \RuntimeException('Selected unit is no longer available.');
            }

            if ($application->status !== RentalApplication::STATUS_PENDING) {
                throw new \RuntimeException('Only pending applications can be approved.');
            }

            $this->workflowService->approve($application, $adminId);
        });
    }
}
