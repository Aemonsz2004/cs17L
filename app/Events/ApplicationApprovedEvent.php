<?php

namespace App\Events;

use App\Models\RentalApplication;
use App\Models\Tenant;
use App\Models\Unit;

class ApplicationApprovedEvent
{
    public function __construct(
        public readonly RentalApplication $application,
        public readonly Tenant $tenant,
        public readonly Unit $unit,
    ) {}
}
