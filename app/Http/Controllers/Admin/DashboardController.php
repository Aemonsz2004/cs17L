<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Models\Unit;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'dashboard',
            'tenants' => Tenant::latest()->get(),
            'invoices' => Invoice::with('tenant:id,name,unit')->latest()->get(),
            'maintenance' => MaintenanceRequest::latest()->get(),
            'units_count' => Unit::count(),
        ]);
    }
}
