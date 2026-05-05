<?php

namespace App\Support;

use App\Models\ApplicationLog;
use App\Models\RentalApplication;

class ApplicationAuditService
{
    public function logStatusTransition(
        RentalApplication $application,
        ?string $fromStatus,
        ?string $toStatus,
        ?int $actorUserId = null,
        ?string $reason = null,
        array $context = []
    ): void {
        ApplicationLog::create([
            'rental_application_id' => $application->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'actor_user_id' => $actorUserId,
            'reason' => $reason,
            'context' => $context,
            'created_at' => now(),
        ]);
    }

    public function logContext(
        RentalApplication $application,
        ?int $actorUserId,
        string $reason,
        array $context = []
    ): void {
        $this->logStatusTransition($application, $application->status, $application->status, $actorUserId, $reason, $context);
    }
}
