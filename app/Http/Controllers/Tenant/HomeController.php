<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Models\Unit;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;

        $tenant = Tenant::withTrashed()->with('units')->find($tenantId);
        $isMovedOut = $tenant && $tenant->status === 'moved_out';

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'my-unit',
            'tenant' => $tenant,
            'invoices' => Invoice::where('tenant_id', $tenantId)->latest()->get(),
            'maintenance' => MaintenanceRequest::where('tenant_id', $tenantId)->latest()->get(),
            'isMovedOut' => $isMovedOut,
            'availableUnits' => $isMovedOut ? Unit::publiclyVisible()->orderBy('floor')->orderBy('number')->get() : [],
        ]);
    }
}
