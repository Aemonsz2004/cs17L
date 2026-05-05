<?php

namespace App\Events;

class PaymentVerifiedEvent
{
    public function __construct(
        public readonly int $applicationId,
        public readonly int $paymentId,
        public readonly ?string $providerEventId = null,
    ) {
    }
}
