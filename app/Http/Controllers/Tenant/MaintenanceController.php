<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\RtmsNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'maintenance',
            'maintenance' => MaintenanceRequest::where('tenant_id', $tenantId)
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:Electrical,Plumbing,Air Conditioning,Structural,General'],
            'priority' => ['nullable', 'in:high,medium,low'],
            'notes' => ['required', 'string'],
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        $created = MaintenanceRequest::create([
            'title' => $data['title'],
            'unit' => $tenant?->unit ?? 'N/A',
            'tenant' => $tenant?->name ?? $user->name,
            'tenant_id' => $user->tenant_id,
            'type' => $data['type'],
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'open',
            'notes' => $data['notes'],
        ]);

        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'maintenance',
            'message' => sprintf('New maintenance request from %s (%s): %s', $created->tenant, $created->unit, $created->title),
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()->route('tenant.maintenance')->with('success', 'Maintenance request submitted.');
    }
}
