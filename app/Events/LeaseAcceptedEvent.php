<?php

namespace App\Events;

class LeaseAcceptedEvent
{
    public function __construct(
        public readonly int $applicationId,
        public readonly int $userId,
    ) {
    }
}
