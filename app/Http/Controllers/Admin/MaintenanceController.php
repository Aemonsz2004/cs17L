<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceRequest;
use App\Http\Requests\UpdateMaintenanceRequest;
use App\Models\MaintenanceRequest;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
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

    public function store(StoreMaintenanceRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $data['priority'] = $data['priority'] ?? 'medium';
        $data['status'] = $data['status'] ?? 'open';

        MaintenanceRequest::create($data);

        return redirect()->route('admin.maintenance.index')->with('success', 'Request created.');
    }

    public function update(UpdateMaintenanceRequest $request, MaintenanceRequest $maintenance): RedirectResponse
    {
        $data = $request->validated();

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
