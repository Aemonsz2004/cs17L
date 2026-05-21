<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'units',
            'units' => Unit::with([
                'tenant' => fn ($query) => $query->withTrashed(),
                'unitHistories.tenant',
            ])->latest()->get(),
            'archivedUnits' => Unit::onlyTrashed()
                ->with([
                    'tenant' => fn ($query) => $query->withTrashed(),
                    'unitHistories.tenant',
                ])
                ->latest('deleted_at')
                ->get(),
            'tenants' => Tenant::latest()->get(),
        ]);
    }

    public function store(StoreUnitRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('gallery')) {
            $data['gallery'] = collect($request->file('gallery'))
                ->map(fn ($file) => Storage::url($file->store('units/gallery', 'public')))
                ->values()
                ->all();
        } elseif (array_key_exists('gallery', $data)) {
            unset($data['gallery']);
        }

        $data['status'] = $data['status'] ?? 'vacant';

        Unit::create($data);

        return redirect()->route('admin.units.index')->with('success', 'Unit created.');
    }

    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('gallery')) {
            $data['gallery'] = collect($request->file('gallery'))
                ->map(fn ($file) => Storage::url($file->store('units/gallery', 'public')))
                ->values()
                ->all();
        }

        $unit->update($data);

        return redirect()->route('admin.units.index')->with('success', 'Unit updated.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
            return redirect()->route('admin.units.index')->with('error', 'Only vacant units can be deleted.');
        }

        $unit->delete();

        return redirect()->route('admin.units.index')->with('success', 'Unit archived.');
    }

    public function restore(int $unitId): RedirectResponse
    {
        $unit = Unit::withTrashed()->findOrFail($unitId);

        if (! $unit->trashed()) {
            return redirect()->route('admin.units.index')->with('success', 'Unit is already active.');
        }

        $unit->restore();

        return redirect()->route('admin.units.index')->with('success', 'Unit restored.');
    }
}
