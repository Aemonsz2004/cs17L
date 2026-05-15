<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'maintenance',
            'maintenance' => MaintenanceRequest::with([
                'tenantRecord' => fn ($query) => $query->withTrashed(),
            ])->latest()->get(),
            'archivedMaintenance' => MaintenanceRequest::onlyTrashed()
                ->with(['tenantRecord' => fn ($query) => $query->withTrashed()])
                ->latest('deleted_at')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:10'],
            'tenant' => ['required', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'type' => ['required', 'in:Electrical,Plumbing,Air Conditioning,Structural,General'],
            'priority' => ['nullable', 'in:high,medium,low'],
            'status' => ['nullable', 'in:open,inprogress,resolved'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
            'resolved_date' => ['nullable', 'date'],
            'notes' => ['required', 'string'],
        ]);

        $data['priority'] = $data['priority'] ?? 'medium';
        $data['status'] = $data['status'] ?? 'open';

        MaintenanceRequest::create($data);

        return redirect()->route('admin.maintenance.index')->with('success', 'Request created.');
    }

    public function update(Request $request, MaintenanceRequest $maintenance): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'unit' => ['sometimes', 'string', 'max:10'],
            'tenant' => ['sometimes', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'type' => ['sometimes', 'in:Electrical,Plumbing,Air Conditioning,Structural,General'],
            'priority' => ['sometimes', 'in:high,medium,low'],
            'status' => ['sometimes', 'in:open,inprogress,resolved'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
            'resolved_date' => ['nullable', 'date'],
            'notes' => ['sometimes', 'string'],
        ]);

        if (($data['status'] ?? null) === 'resolved' && empty($data['resolved_date'])) {
            return redirect()->back()->withErrors([
                'resolved_date' => 'Resolved date is required when marking a request as resolved.',
            ]);
        }

        $previousStatus = $maintenance->status;
        $maintenance->update($data);

        if (($data['status'] ?? null) === 'inprogress' && $previousStatus !== 'inprogress') {
            TenantNotificationService::notifyMaintenanceInProgress($maintenance->fresh());
        }

        if (($data['status'] ?? null) === 'resolved' && $previousStatus !== 'resolved') {
            TenantNotificationService::notifyMaintenanceResolved($maintenance->fresh());
        }

        return redirect()->route('admin.maintenance.index')->with('success', 'Request updated.');
    }

    public function destroy(MaintenanceRequest $maintenance): RedirectResponse
    {
        $maintenance->delete();

        return redirect()->route('admin.maintenance.index')->with('success', 'Request archived.');
    }

    public function restore(int $maintenanceId): RedirectResponse
    {
        $maintenance = MaintenanceRequest::withTrashed()->findOrFail($maintenanceId);

        if (! $maintenance->trashed()) {
            return redirect()->route('admin.maintenance.index')->with('success', 'Request is already active.');
        }

        $maintenance->restore();

        return redirect()->route('admin.maintenance.index')->with('success', 'Request restored.');
    }
}
