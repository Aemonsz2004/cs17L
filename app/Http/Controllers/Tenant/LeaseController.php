<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class LeaseController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;

        $tenant = Tenant::with(['units', 'leases', 'leases.unit'])->find($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'lease',
            'tenant' => $tenant,
            'leases' => $tenant?->leases ?? [],
            'invoices' => Invoice::where('tenant_id', $tenantId)->latest()->get(),
        ]);
    }
}
