<?php

namespace App\Listeners;

use App\Events\LeaseAcceptedEvent;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;

class NotifyAdminOnLeaseAccepted
{
    public function handle(LeaseAcceptedEvent $event): void
    {
        $application = RentalApplication::find($event->applicationId);

        RtmsNotification::create([
            'variant' => 'teal',
            'message' => 'Lease accepted by applicant' . ($application ? ": {$application->full_name}" : '.') . ' Payment window is now open.',
            'category' => 'lease',
            'tenant_id' => null,
            'unread' => true,
        ]);
    }
}
