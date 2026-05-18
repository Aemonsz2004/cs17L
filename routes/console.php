<?php

use App\Support\ApplicationWorkflowService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('applications:expire', function (ApplicationWorkflowService $workflow): void {
    $expired = $workflow->expirePendingOnboarding();
    $this->info("Expired {$expired} application(s).");
})->purpose('Expire stale application reservations and lease/deposit windows');

Schedule::command('applications:expire')->everyFifteenMinutes();
