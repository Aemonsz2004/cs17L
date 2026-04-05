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

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'lease',
            'tenant' => Tenant::find($tenantId),
            'invoices' => Invoice::where('tenant_id', $tenantId)->latest()->get(),
        ]);
    }
}
