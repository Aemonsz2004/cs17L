<?php

namespace App\Events;

use App\Models\RentalApplication;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Foundation\Events\Dispatchable;

class ApplicationApprovedEvent
{
    use Dispatchable;

    public function __construct(
        public readonly RentalApplication $application,
        public readonly Tenant $tenant,
        public readonly Unit $unit,
    ) {}
}
