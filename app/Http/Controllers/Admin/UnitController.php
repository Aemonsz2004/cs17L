<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'units',
            'units' => Unit::with('tenant')->latest()->get(),
            'tenants' => Tenant::latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'number' => strtoupper(trim((string) $request->input('number'))),
        ]);

        $data = $request->validate([
            'number' => ['required', 'string', 'max:10', Rule::unique('units', 'number')],
            'floor' => ['required', 'in:GF,1F,2F,3F'],
            'type' => ['required', 'in:Office,Retail,Medical'],
            'area' => ['required', 'integer', 'min:1'],
            'base_rent' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', 'in:occupied,vacant,expiring,overdue'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
        ]);

        $data['status'] = $data['status'] ?? 'vacant';

        Unit::create($data);

        return redirect()->route('admin.units.index')->with('success', 'Unit created.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        if ($request->has('number')) {
            $request->merge([
                'number' => strtoupper(trim((string) $request->input('number'))),
            ]);
        }

        $data = $request->validate([
            'number' => ['sometimes', 'string', 'max:10', Rule::unique('units', 'number')->ignore($unit->id)],
            'floor' => ['sometimes', 'in:GF,1F,2F,3F'],
            'type' => ['sometimes', 'in:Office,Retail,Medical'],
            'area' => ['sometimes', 'integer', 'min:1'],
            'base_rent' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:occupied,vacant,expiring,overdue'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
        ]);

        $unit->update($data);

        return redirect()->route('admin.units.index')->with('success', 'Unit updated.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
            return redirect()->route('admin.units.index')->with('error', 'Only vacant units can be deleted.');
        }

        $unit->delete();

        return redirect()->route('admin.units.index')->with('success', 'Unit deleted.');
    }
}
