<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class LeaseService
{
    public function leaseResponseDeadline(): Carbon
    {
        return Carbon::now()->addHours((int) config('services.applications.lease_response_hours', 72));
    }

    public function paymentWindowDeadline(): Carbon
    {
        return Carbon::now()->addHours((int) config('services.applications.deposit_window_hours', 24));
    }

    public function defaultLeaseStart(): Carbon
    {
        return Carbon::now()->startOfDay();
    }

    public function defaultLeaseEnd(Carbon $startDate): Carbon
    {
        return $startDate->copy()->addYear()->subDay();
    }
}
