<?php

namespace App\Listeners;

use App\Events\TenantCreatedEvent;
use App\Models\RtmsNotification;

class NotifyAdminOnTenantCreated
{
    public function handle(TenantCreatedEvent $event): void
    {
        RtmsNotification::create([
            'variant' => 'teal',
            'message' => "Application #{$event->applicationId} was auto-converted to tenant #{$event->tenantId}.",
            'category' => 'lease',
            'tenant_id' => null,
            'unread' => true,
        ]);
    }
}
