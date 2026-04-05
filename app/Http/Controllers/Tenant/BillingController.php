<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Support\TenantNotificationService;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;
        TenantNotificationService::syncUnpaidReminders($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'billing',
            'invoices' => Invoice::where('tenant_id', $tenantId)->latest()->get(),
        ]);
    }
}
