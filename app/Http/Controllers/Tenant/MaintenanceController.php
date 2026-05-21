<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\RtmsNotification;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;
        $tenant = auth()->user()->tenant;

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'maintenance',
            'tenantUnit' => $tenant?->units()->value('number') ?? null,
            'maintenance' => MaintenanceRequest::where('tenant_id', $tenantId)
                ->latest()
                ->get(),
            'archivedMaintenance' => MaintenanceRequest::onlyTrashed()
                ->where('tenant_id', $tenantId)
                ->latest('deleted_at')
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
        $unitNumber = $tenant?->units()->value('number') ?? 'N/A';

        $created = MaintenanceRequest::create([
            'title' => $data['title'],
            'unit' => $unitNumber,
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
            'message' => sprintf('New maintenance request from %s (%s): %s', $created->tenant, $unitNumber, $created->title),
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()->route('tenant.maintenance')->with('success', 'Maintenance request submitted.');
    }

    public function markDone(MaintenanceRequest $maintenance): RedirectResponse
    {
        abort_unless($maintenance->tenant_id === auth()->user()->tenant_id, 403);

        $maintenance->update([
            'status' => 'resolved',
            'resolved_date' => now()->toDateString(),
        ]);

        TenantNotificationService::notifyMaintenanceResolved($maintenance->fresh());

        return redirect()->route('tenant.maintenance')->with('success', 'Request marked as done.');
    }

    public function destroy(MaintenanceRequest $maintenance): RedirectResponse
    {
        abort_unless($maintenance->tenant_id === auth()->user()->tenant_id, 403);

        $maintenance->delete();

        return redirect()->route('tenant.maintenance')->with('success', 'Maintenance request archived.');
    }

    public function restore(int $maintenanceId): RedirectResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $maintenance = MaintenanceRequest::withTrashed()
            ->where('tenant_id', $tenantId)
            ->findOrFail($maintenanceId);

        if (! $maintenance->trashed()) {
            return redirect()->route('tenant.maintenance')->with('success', 'Maintenance request is already active.');
        }

        $maintenance->restore();

        return redirect()->route('tenant.maintenance')->with('success', 'Maintenance request restored.');
    }
}
