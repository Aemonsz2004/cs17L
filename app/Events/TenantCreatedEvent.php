<?php

namespace App\Events;

class TenantCreatedEvent
{
    public function __construct(
        public readonly int $applicationId,
        public readonly int $tenantId,
        public readonly int $userId,
    ) {}
}
