<?php

namespace App\Listeners;

use App\Events\PaymentVerifiedEvent;
use App\Support\ApplicationWorkflowService;

class AutoConvertTenantOnPaymentVerified
{
    public function __construct(private readonly ApplicationWorkflowService $workflow) {}

    public function handle(PaymentVerifiedEvent $event): void
    {
        $this->workflow->autoConvertAfterPaymentVerified($event->applicationId, $event->providerEventId);
    }
}
