<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'tenants',
            'tenants' => Tenant::latest()->get(),
            'invoices' => Invoice::latest()->get(),
            'units' => Unit::orderBy('floor')->orderBy('number')->get(),
        ]);
    }

    public function show(Tenant $tenant): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'tenants',
            'tenant' => $tenant,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'initials' => ['required', 'string', 'max:4'],
            'contact' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', 'unique:tenants,email', 'unique:users,email'],
            'unit' => ['required', 'string', 'max:10', 'exists:units,number'],
            'floor' => ['required', 'in:GF,1F,2F,3F'],
            'type' => ['required', 'in:Office,Retail,Medical'],
            'rent' => ['required', 'integer', 'min:0'],
            'deposit' => ['required', 'integer', 'min:0'],
            'lease_start' => ['required', 'date'],
            'lease_end' => ['required', 'date', 'after_or_equal:lease_start'],
            'payment_method' => ['required', 'in:GCash,Bank Transfer,Cash'],
            'status' => ['nullable', 'in:active,expiring,overdue'],
        ]);

        $data['status'] = $data['status'] ?? 'active';
        $temporaryPassword = $this->generateTemporaryPassword();

        $credentials = DB::transaction(function () use ($data, $temporaryPassword): array {
            $unit = Unit::where('number', $data['unit'])->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw ValidationException::withMessages([
                    'unit' => 'Selected unit is no longer available.',
                ]);
            }

            $data['floor'] = $unit->floor;
            $data['type'] = $unit->type;
            $data['rent'] = $unit->base_rent;
            $data['deposit'] = $data['deposit'] > 0 ? $data['deposit'] : ($unit->base_rent * 2);

            $tenant = Tenant::create($data);

            User::create([
                'name' => $tenant->name,
                'email' => $tenant->email,
                'password' => $temporaryPassword,
                'role' => 'tenant',
                'tenant_id' => $tenant->id,
                'must_change_password' => true,
            ]);

            $unit->update([
                'tenant_id' => $tenant->id,
                'status' => $tenant->status === 'active' ? 'occupied' : $tenant->status,
            ]);

            return [
                'name' => $tenant->name,
                'email' => $tenant->email,
                'temp_password' => $temporaryPassword,
            ];
        });

        return redirect()
            ->route('admin.tenants.index')
            ->with('success', 'Tenant account created successfully.')
            ->with('tenant_credentials', $credentials);
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'initials' => ['sometimes', 'string', 'max:4'],
            'contact' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:tenants,email,' . $tenant->id],
            'unit' => ['sometimes', 'string', 'max:10', 'exists:units,number'],
            'floor' => ['sometimes', 'in:GF,1F,2F,3F'],
            'type' => ['sometimes', 'in:Office,Retail,Medical'],
            'rent' => ['sometimes', 'integer', 'min:0'],
            'deposit' => ['sometimes', 'integer', 'min:0'],
            'lease_start' => ['sometimes', 'date'],
            'lease_end' => ['sometimes', 'date'],
            'payment_method' => ['sometimes', 'in:GCash,Bank Transfer,Cash'],
            'status' => ['sometimes', 'in:active,expiring,overdue'],
        ]);

        DB::transaction(function () use ($tenant, $data): void {
            $previousUnitNumber = $tenant->unit;
            $nextUnitNumber = $data['unit'] ?? $tenant->unit;

            if ($nextUnitNumber !== $previousUnitNumber) {
                $nextUnit = Unit::where('number', $nextUnitNumber)->lockForUpdate()->firstOrFail();

                if ($nextUnit->tenant_id !== null || $nextUnit->status !== 'vacant') {
                    throw ValidationException::withMessages([
                        'unit' => 'Selected unit is no longer available.',
                    ]);
                }

                $data['floor'] = $nextUnit->floor;
                $data['type'] = $nextUnit->type;
                $data['rent'] = $data['rent'] ?? $nextUnit->base_rent;

                $tenant->update($data);

                Unit::where('number', $previousUnitNumber)
                    ->where('tenant_id', $tenant->id)
                    ->update([
                        'tenant_id' => null,
                        'status' => 'vacant',
                    ]);

                $nextUnit->update([
                    'tenant_id' => $tenant->id,
                    'status' => $tenant->status === 'active' ? 'occupied' : $tenant->status,
                ]);

                return;
            }

            $tenant->update($data);

            Unit::where('number', $tenant->unit)
                ->where('tenant_id', $tenant->id)
                ->update([
                    'status' => $tenant->status === 'active' ? 'occupied' : $tenant->status,
                ]);
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant updated.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        DB::transaction(function () use ($tenant): void {
            Unit::where('number', $tenant->unit)
                ->where('tenant_id', $tenant->id)
                ->update([
                    'tenant_id' => null,
                    'status' => 'vacant',
                ]);

            $tenant->delete();
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant deleted.');
    }

    private function generateTemporaryPassword(int $length = 10): string
    {
        $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $lower = 'abcdefghijkmnopqrstuvwxyz';
        $digits = '23456789';
        $symbols = '!@#$%^&*';

        $password = [
            $upper[random_int(0, strlen($upper) - 1)],
            $lower[random_int(0, strlen($lower) - 1)],
            $digits[random_int(0, strlen($digits) - 1)],
            $symbols[random_int(0, strlen($symbols) - 1)],
        ];

        $pool = $upper . $lower . $digits . $symbols;

        while (count($password) < $length) {
            $password[] = $pool[random_int(0, strlen($pool) - 1)];
        }

        for ($index = count($password) - 1; $index > 0; $index--) {
            $swap = random_int(0, $index);
            [$password[$index], $password[$swap]] = [$password[$swap], $password[$index]];
        }

        return implode('', $password);
    }
}
