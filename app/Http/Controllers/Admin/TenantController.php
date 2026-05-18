<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Lease;
use App\Models\MoveOutHistory;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\UnitHistory;
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
                'units',
            ])->latest()->get(),
            'archivedTenants' => Tenant::onlyTrashed()->with([
                'leases' => fn ($query) => $query->orderByDesc('start_date')->orderByDesc('id'),
                'units',
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
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'lease_start' => ['required', 'date'],
            'lease_end' => ['required', 'date', 'after_or_equal:lease_start'],
            'payment_method' => ['required', 'in:GCash,Cash'],
            'status' => ['nullable', 'in:active,pending_payment'],
        ]);

        $data['status'] = $data['status'] ?? 'active';
        $temporaryPassword = $this->generateTemporaryPassword();

        $credentials = DB::transaction(function () use ($data, $temporaryPassword): array {
            $unit = Unit::whereKey($data['unit_id'])->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw ValidationException::withMessages([
                    'unit_id' => 'Selected unit is no longer available.',
                ]);
            }

            $tenant = Tenant::create([
                'user_id' => null,
                'name' => $data['name'],
                'initials' => $data['initials'],
                'contact' => $data['contact'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'floor' => $unit->floor,
                'type' => $unit->type,
                'rent' => $unit->base_rent,
                'deposit' => $unit->base_rent * 2,
                'lease_start' => $data['lease_start'],
                'lease_end' => $data['lease_end'],
                'payment_method' => $data['payment_method'],
                'status' => $data['status'],
            ]);

            $lease = Lease::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $unit->id,
                'start_date' => $data['lease_start'],
                'end_date' => $data['lease_end'],
                'rent' => $unit->base_rent,
                'deposit' => $unit->base_rent * 2,
                'payment_method' => $data['payment_method'],
                'status' => 'active',
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
                'status' => 'occupied',
            ]);

            UnitHistory::create([
                'unit_id' => $unit->id,
                'tenant_id' => $tenant->id,
                'lease_id' => $lease->id,
                'start_date' => $data['lease_start'],
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
            'email' => ['sometimes', 'email', 'max:255', 'unique:tenants,email,'.$tenant->id],
            'unit_id' => ['sometimes', 'integer', 'exists:units,id'],
            'lease_start' => ['sometimes', 'date'],
            'lease_end' => ['sometimes', 'date'],
            'payment_method' => ['sometimes', 'in:GCash,Cash'],
            'status' => ['sometimes', 'in:active,pending_payment,moved_out,terminated'],
        ]);

        DB::transaction(function () use ($tenant, $data): void {
            $currentUnits = $tenant->units()->pluck('units.id');
            $nextUnitId = $data['unit_id'] ?? null;

            $unitChange = $nextUnitId !== null && ! $currentUnits->contains($nextUnitId);

            if ($unitChange) {
                $nextUnit = Unit::whereKey($nextUnitId)->lockForUpdate()->firstOrFail();

                if ($nextUnit->status !== 'vacant' || $nextUnit->tenant_id !== null) {
                    throw ValidationException::withMessages([
                        'unit_id' => 'Selected unit is no longer available.',
                    ]);
                }

                $currentLease = Lease::where('tenant_id', $tenant->id)
                    ->where('status', 'active')
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if ($currentLease) {
                    $currentLease->update([
                        'status' => 'ended',
                        'ended_at' => now(),
                    ]);

                    UnitHistory::where('unit_id', $currentLease->unit_id)
                        ->whereNull('end_date')
                        ->update(['end_date' => $currentLease->end_date]);
                }

                $nextUnit->update([
                    'tenant_id' => $tenant->id,
                    'status' => 'occupied',
                ]);

                $newLease = Lease::create([
                    'tenant_id' => $tenant->id,
                    'unit_id' => $nextUnit->id,
                    'start_date' => $data['lease_start'] ?? $tenant->lease_start,
                    'end_date' => $data['lease_end'] ?? $tenant->lease_end,
                    'rent' => $data['rent'] ?? $tenant->rent,
                    'deposit' => $data['deposit'] ?? $tenant->deposit,
                    'payment_method' => $data['payment_method'] ?? $tenant->payment_method,
                    'status' => 'active',
                ]);

                UnitHistory::create([
                    'unit_id' => $nextUnit->id,
                    'tenant_id' => $tenant->id,
                    'lease_id' => $newLease->id,
                    'start_date' => $newLease->start_date,
                ]);

                $tenant->update($data);

                $tenant->units()
                    ->where('units.id', '!=', $nextUnit->id)
                    ->update([
                        'tenant_id' => null,
                        'status' => 'vacant',
                    ]);

                return;
            }

            $tenant->update($data);

            $currentLease = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
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

                    UnitHistory::where('unit_id', $currentLease->unit_id)
                        ->whereNull('end_date')
                        ->update(['end_date' => $currentLease->end_date]);

                    $tenantUnit = $tenant->units()->first();

                    if ($tenantUnit) {
                        $newLease = Lease::create([
                            'tenant_id' => $tenant->id,
                            'unit_id' => $tenantUnit->id,
                            'start_date' => $data['lease_start'] ?? $tenant->lease_start,
                            'end_date' => $data['lease_end'] ?? $tenant->lease_end,
                            'rent' => $data['rent'] ?? $tenant->rent,
                            'deposit' => $data['deposit'] ?? $tenant->deposit,
                            'payment_method' => $data['payment_method'] ?? $tenant->payment_method,
                            'status' => 'active',
                        ]);

                        UnitHistory::create([
                            'unit_id' => $tenantUnit->id,
                            'tenant_id' => $tenant->id,
                            'lease_id' => $newLease->id,
                            'start_date' => $newLease->start_date,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant updated.');
    }

    public static function notifyInvoiceOverdue(Invoice $invoice): void
    {
        RtmsNotification::create([
            'tenant_id' => $invoice->tenant_id,
            'variant' => 'red',
            'message' => "Your invoice #{$invoice->invoice_no} is now overdue.",
            'category' => 'payment',
            'unread' => true,
        ]);
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

            $currentLease = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->latest('end_date')
                ->lockForUpdate()
                ->first();

            $currentLeaseEnd = $currentLease !== null
                ? substr((string) $currentLease->end_date, 0, 10)
                : null;

            if ($currentLeaseEnd !== null && $data['lease_start'] <= $currentLeaseEnd) {
                throw ValidationException::withMessages([
                    'lease_start' => 'Renewal start date must be after the current lease end date ('.$currentLeaseEnd.').',
                ]);
            }

            $unit = $tenant->units()->lockForUpdate()->first();

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

            $oldLeases = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->get();

            foreach ($oldLeases as $oldLease) {
                $oldLease->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);

                UnitHistory::where('unit_id', $oldLease->unit_id)
                    ->whereNull('end_date')
                    ->update(['end_date' => $oldLease->end_date]);
            }

            $newLease = Lease::create([
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

            UnitHistory::create([
                'unit_id' => $unit->id,
                'tenant_id' => $tenant->id,
                'lease_id' => $newLease->id,
                'start_date' => $data['lease_start'],
            ]);
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Lease renewed successfully.');
    }

    public function moveOut(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'damages' => ['nullable', 'string', 'max:1000'],
            'balance_due' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['balance_due'] = $data['balance_due'] ?? 0;

        DB::transaction(function () use ($tenant, $data): void {
            $activeLeases = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->get();

            foreach ($activeLeases as $lease) {
                $lease->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);

                $unit = Unit::whereKey($lease->unit_id)->lockForUpdate()->first();
                if ($unit) {
                    $unit->update([
                        'tenant_id' => null,
                        'status' => 'vacant',
                    ]);
                }

                UnitHistory::where('unit_id', $lease->unit_id)
                    ->whereNull('end_date')
                    ->update(['end_date' => $lease->end_date]);

                MoveOutHistory::create([
                    'tenant_id' => $tenant->id,
                    'unit_id' => $lease->unit_id,
                    'lease_id' => $lease->id,
                    'date' => today(),
                    'reason' => $data['reason'],
                    'notes' => $data['notes'],
                    'damages' => $data['damages'],
                    'balance_due' => $data['balance_due'],
                ]);
            }

            $tenant->update(['status' => 'moved_out']);
            $tenant->delete();
        });

        return redirect()->route('admin.tenants.index')->with('success', 'Tenant moved out successfully. Lease ended, units freed, and history recorded.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        DB::transaction(function () use ($tenant): void {
            $activeLeases = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->get();

            foreach ($activeLeases as $lease) {
                $lease->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);

                UnitHistory::where('unit_id', $lease->unit_id)
                    ->whereNull('end_date')
                    ->update(['end_date' => $lease->end_date]);
            }

            Unit::where('tenant_id', $tenant->id)
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

            $unit = $tenant->units()->lockForUpdate()->first();

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

        $pool = $upper.$lower.$digits.$symbols;

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
