<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Lease;
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
            'tenants' => Tenant::with([
                'leases' => fn ($query) => $query->orderByDesc('start_date')->orderByDesc('id'),
            ])->latest()->get(),
            'archivedTenants' => Tenant::onlyTrashed()->with([
                'leases' => fn ($query) => $query->orderByDesc('start_date')->orderByDesc('id'),
            ])->latest('deleted_at')->get(),
            'invoices' => Invoice::withTrashed()->latest()->get(),
            'units' => Unit::orderBy('floor')->orderBy('number')->get(),
        ]);
    }

    public function show(Tenant $tenant): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'tenants',
            'tenant' => $tenant->load([
                'leases' => fn ($query) => $query->orderByDesc('start_date')->orderByDesc('id'),
            ]),
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
            'payment_method' => ['required', 'in:GCash,Cash'],
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

            Lease::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $unit->id,
                'start_date' => $data['lease_start'],
                'end_date' => $data['lease_end'],
                'rent' => $data['rent'],
                'deposit' => $data['deposit'],
                'payment_method' => $data['payment_method'],
                'status' => in_array($data['status'], ['active', 'expiring', 'overdue'], true) ? $data['status'] : 'active',
            ]);

            $tenantUser = User::create([
                'name' => $tenant->name,
                'email' => $tenant->email,
                'password' => $temporaryPassword,
                'role' => 'tenant',
                'tenant_id' => $tenant->id,
                'must_change_password' => true,
            ]);

            $tenant->update([
                'user_id' => $tenantUser->id,
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
            'payment_method' => ['sometimes', 'in:GCash,Cash'],
            'status' => ['sometimes', 'in:active,expiring,overdue'],
        ]);

        DB::transaction(function () use ($tenant, $data): void {
            $previousUnitNumber = $tenant->unit;
            $nextUnitNumber = $data['unit'] ?? $tenant->unit;

            if ($nextUnitNumber !== $previousUnitNumber) {
                $nextUnit = Unit::where('number', $nextUnitNumber)->lockForUpdate()->firstOrFail();
                $currentLease = Lease::where('tenant_id', $tenant->id)
                    ->whereIn('status', ['active', 'expiring', 'overdue'])
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if ($nextUnit->tenant_id !== null || $nextUnit->status !== 'vacant') {
                    throw ValidationException::withMessages([
                        'unit' => 'Selected unit is no longer available.',
                    ]);
                }

                $data['floor'] = $nextUnit->floor;
                $data['type'] = $nextUnit->type;
                $data['rent'] = $data['rent'] ?? $nextUnit->base_rent;

                $tenant->update($data);

                if ($currentLease) {
                    $currentLease->update([
                        'status' => 'ended',
                        'ended_at' => now(),
                    ]);
                }

                Lease::create([
                    'tenant_id' => $tenant->id,
                    'unit_id' => $nextUnit->id,
                    'start_date' => $data['lease_start'] ?? $tenant->lease_start,
                    'end_date' => $data['lease_end'] ?? $tenant->lease_end,
                    'rent' => $data['rent'] ?? $tenant->rent,
                    'deposit' => $data['deposit'] ?? $tenant->deposit,
                    'payment_method' => $data['payment_method'] ?? $tenant->payment_method,
                    'status' => in_array($tenant->status, ['active', 'expiring', 'overdue'], true) ? $tenant->status : 'active',
                ]);

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

            $currentLease = Lease::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'expiring', 'overdue'])
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if ($currentLease) {
                $leaseFieldsChanged = isset($data['lease_start'])
                    || isset($data['lease_end'])
                    || isset($data['rent'])
                    || isset($data['deposit'])
                    || isset($data['payment_method']);

                if ($leaseFieldsChanged) {
                    $currentLease->update([
                        'status' => 'ended',
                        'ended_at' => now(),
                    ]);

                    $currentUnit = Unit::where('number', $tenant->unit)->lockForUpdate()->first();

                    if ($currentUnit) {
                        Lease::create([
                            'tenant_id' => $tenant->id,
                            'unit_id' => $currentUnit->id,
                            'start_date' => $data['lease_start'] ?? $tenant->lease_start,
                            'end_date' => $data['lease_end'] ?? $tenant->lease_end,
                            'rent' => $data['rent'] ?? $tenant->rent,
                            'deposit' => $data['deposit'] ?? $tenant->deposit,
                            'payment_method' => $data['payment_method'] ?? $tenant->payment_method,
                            'status' => in_array($tenant->status, ['active', 'expiring', 'overdue'], true) ? $tenant->status : 'active',
                        ]);
                    }
                } else {
                    $currentLease->update([
                        'status' => in_array($tenant->status, ['active', 'expiring', 'overdue'], true) ? $tenant->status : 'active',
                    ]);
                }
            }

            Unit::where('number', $tenant->unit)
                ->where('tenant_id', $tenant->id)
                ->update([
                    'status' => $tenant->status === 'active' ? 'occupied' : $tenant->status,
                ]);
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant updated.');
    }

    public function renew(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'lease_start' => ['required', 'date'],
            'lease_end' => ['required', 'date', 'after_or_equal:lease_start'],
            'rent' => ['required', 'integer', 'min:0'],
            'deposit' => ['required', 'integer', 'min:0'],
            'payment_method' => ['required', 'in:GCash,Cash'],
            'terms' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($tenant, $data): void {
            // Guard 1: the renewal period must not overlap any existing lease period.
            $hasOverlap = Lease::where('tenant_id', $tenant->id)
                ->whereDate('start_date', '<=', $data['lease_end'])
                ->whereDate('end_date', '>=', $data['lease_start'])
                ->lockForUpdate()
                ->exists();

            if ($hasOverlap) {
                throw ValidationException::withMessages([
                    'lease_start' => 'Renewal dates overlap an existing lease record. Start the new lease after the current term ends.',
                ]);
            }

            // Guard 2: if an active lease exists, renewal must start after it ends.
            $currentLease = Lease::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'expiring', 'overdue'])
                ->latest('end_date')
                ->lockForUpdate()
                ->first();

            $currentLeaseEnd = $currentLease !== null
                ? substr((string) $currentLease->end_date, 0, 10)
                : null;

            if ($currentLeaseEnd !== null && $data['lease_start'] <= $currentLeaseEnd) {
                throw ValidationException::withMessages([
                    'lease_start' => 'Renewal start date must be after the current lease end date (' . $currentLeaseEnd . ').',
                ]);
            }

            $unit = Unit::where('number', $tenant->unit)->lockForUpdate()->first();

            if ($unit === null) {
                throw ValidationException::withMessages([
                    'unit' => 'Assigned unit record is missing.',
                ]);
            }

            if ($unit->tenant_id !== null && $unit->tenant_id !== $tenant->id) {
                throw ValidationException::withMessages([
                    'unit' => 'Assigned unit is no longer linked to this tenant.',
                ]);
            }

            Lease::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'expiring', 'overdue'])
                ->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);

            Lease::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $unit->id,
                'start_date' => $data['lease_start'],
                'end_date' => $data['lease_end'],
                'rent' => $data['rent'],
                'deposit' => $data['deposit'],
                'payment_method' => $data['payment_method'],
                'terms' => $data['terms'] ?? null,
                'status' => 'active',
            ]);

            $tenant->update([
                'floor' => $unit->floor,
                'type' => $unit->type,
                'rent' => $data['rent'],
                'deposit' => $data['deposit'],
                'lease_start' => $data['lease_start'],
                'lease_end' => $data['lease_end'],
                'payment_method' => $data['payment_method'],
                'status' => 'active',
            ]);

            $unit->update([
                'tenant_id' => $tenant->id,
                'status' => 'occupied',
            ]);
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Lease renewed successfully.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        DB::transaction(function () use ($tenant): void {
            Lease::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'expiring', 'overdue'])
                ->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);

            Unit::where('number', $tenant->unit)
                ->where('tenant_id', $tenant->id)
                ->update([
                    'tenant_id' => null,
                    'status' => 'vacant',
                ]);

            $tenant->delete();
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant archived.');
    }

    public function restore(int $tenantId): RedirectResponse
    {
        $tenant = Tenant::withTrashed()->findOrFail($tenantId);

        if (! $tenant->trashed()) {
            return redirect()->route('admin.tenants.index')->with('success', 'Tenant is already active.');
        }

        $unitReattached = false;

        DB::transaction(function () use ($tenant, &$unitReattached): void {
            $tenant->restore();

            $unit = Unit::where('number', $tenant->unit)->lockForUpdate()->first();

            if ($unit && $unit->tenant_id === null && $unit->status === 'vacant') {
                $unit->update([
                    'tenant_id' => $tenant->id,
                    'status' => $tenant->status === 'active' ? 'occupied' : $tenant->status,
                ]);
                $unitReattached = true;
            }
        });

        $message = $unitReattached
            ? 'Tenant restored and unit reassigned.'
            : 'Tenant restored. Unit is unavailable and was not reassigned.';

        return redirect()->route('admin.tenants.index')->with('success', $message);
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
