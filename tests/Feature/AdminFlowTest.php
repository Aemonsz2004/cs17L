<?php

use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;

function makeTenant(array $overrides = []): Tenant
{
    return Tenant::create(array_merge([
        'name' => 'Tenant A',
        'initials' => 'TA',
        'contact' => 'Tenant Contact',
        'phone' => '09120000001',
        'email' => 'tenant-a@example.com',
        'unit' => '101',
        'floor' => '1F',
        'type' => 'Office',
        'rent' => 9000,
        'deposit' => 18000,
        'lease_start' => '2026-01-01',
        'lease_end' => '2026-12-31',
        'payment_method' => 'GCash',
        'status' => 'active',
    ], $overrides));
}

function makeAdmin(): User
{
    return User::create([
        'name' => 'Admin',
        'email' => 'admin@test.local',
        'password' => 'password',
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

function makeTenantUser(Tenant $tenant): User
{
    return User::create([
        'name' => 'Tenant User',
        'email' => 'tenant@test.local',
        'password' => 'password',
        'role' => 'tenant',
        'tenant_id' => $tenant->id,
        'email_verified_at' => now(),
    ]);
}

it('protects admin routes from tenant users', function () {
    $tenant = makeTenant();
    $tenantUser = makeTenantUser($tenant);

    $this->actingAs($tenantUser)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('tenant.home'));
});

it('allows admin to open main admin pages', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
    $this->actingAs($admin)->get(route('admin.reports'))->assertOk();
});

it('runs full admin tenant crud', function () {
    $admin = makeAdmin();

    Unit::create([
        'number' => '102',
        'floor' => '1F',
        'type' => 'Retail',
        'area' => 35,
        'base_rent' => 8000,
        'status' => 'vacant',
        'tenant_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.tenants.store'), [
            'name' => 'Tenant B',
            'initials' => 'TB',
            'contact' => 'Contact B',
            'phone' => '09120000002',
            'email' => 'tenant-b@example.com',
            'unit' => '102',
            'floor' => '1F',
            'type' => 'Retail',
            'rent' => 8000,
            'deposit' => 16000,
            'lease_start' => '2026-01-01',
            'lease_end' => '2026-12-31',
            'payment_method' => 'Cash',
        ])
        ->assertRedirect(route('admin.tenants.index'));

    $tenant = Tenant::where('email', 'tenant-b@example.com')->firstOrFail();

    $this->actingAs($admin)->get(route('admin.tenants.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.tenants.show', $tenant))->assertOk();

    $this->actingAs($admin)
        ->patch(route('admin.tenants.update', $tenant), [
            'phone' => '09120000099',
            'status' => 'expiring',
        ])
        ->assertRedirect(route('admin.tenants.index'));

    $tenant->refresh();
    expect($tenant->phone)->toBe('09120000099');
    expect($tenant->status)->toBe('expiring');

    $this->actingAs($admin)
        ->delete(route('admin.tenants.destroy', $tenant))
        ->assertRedirect(route('admin.tenants.index'));

    expect($tenant->fresh()->deleted_at)->not->toBeNull();
});

it('runs full admin unit crud', function () {
    $admin = makeAdmin();
    $tenant = makeTenant();

    $this->actingAs($admin)
        ->post(route('admin.units.store'), [
            'number' => '201',
            'floor' => '2F',
            'type' => 'Office',
            'area' => 40,
            'base_rent' => 12000,
            'status' => 'occupied',
            'tenant_id' => $tenant->id,
        ])
        ->assertRedirect(route('admin.units.index'));

    $unit = Unit::where('number', '201')->firstOrFail();

    $this->actingAs($admin)->get(route('admin.units.index'))->assertOk();

    $this->actingAs($admin)
        ->patch(route('admin.units.update', $unit), [
            'status' => 'vacant',
            'tenant_id' => null,
        ])
        ->assertRedirect(route('admin.units.index'));

    expect($unit->fresh()->status)->toBe('vacant');

    $this->actingAs($admin)
        ->delete(route('admin.units.destroy', $unit))
        ->assertRedirect(route('admin.units.index'));

    expect(Unit::find($unit->id))->toBeNull();
});

it('runs full admin billing flow including mark paid and overdue', function () {
    $admin = makeAdmin();
    $tenant = makeTenant();

    $this->actingAs($admin)
        ->post(route('admin.billing.store'), [
            'tenant_id' => $tenant->id,
            'period' => 'April 2026',
            'rent' => 9000,
            'utilities' => 500,
            'penalty' => 0,
            'due_date' => '2026-04-10',
        ])
        ->assertRedirect(route('admin.billing.index'));

    $invoice = Invoice::firstOrFail();

    $this->actingAs($admin)->get(route('admin.billing.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.billing.show', $invoice))->assertOk();

    $this->actingAs($admin)
        ->patch(route('admin.billing.mark-overdue', $invoice))
        ->assertRedirect(route('admin.billing.index'));

    expect($invoice->fresh()->status)->toBe('overdue');

    $this->actingAs($admin)
        ->patch(route('admin.billing.mark-paid', $invoice))
        ->assertRedirect(route('admin.billing.index'));

    expect($invoice->fresh()->status)->toBe('paid');
    expect($invoice->fresh()->paid_date)->not->toBeNull();
});

it('runs full admin maintenance flow', function () {
    $admin = makeAdmin();
    $tenant = makeTenant();

    $this->actingAs($admin)
        ->post(route('admin.maintenance.store'), [
            'title' => 'Leaking pipe',
            'unit' => '101',
            'tenant' => $tenant->name,
            'tenant_id' => $tenant->id,
            'type' => 'Plumbing',
            'priority' => 'high',
            'notes' => 'Urgent',
        ])
        ->assertRedirect(route('admin.maintenance.index'));

    $request = MaintenanceRequest::firstOrFail();

    $this->actingAs($admin)->get(route('admin.maintenance.index'))->assertOk();

    $this->actingAs($admin)
        ->patch(route('admin.maintenance.update', $request), [
            'status' => 'resolved',
            'assigned_to' => 'Tech A',
            'notes' => 'Resolved quickly',
        ])
        ->assertRedirect(route('admin.maintenance.index'));

    expect($request->fresh()->status)->toBe('resolved');

    $this->actingAs($admin)
        ->delete(route('admin.maintenance.destroy', $request))
        ->assertRedirect(route('admin.maintenance.index'));

    expect(MaintenanceRequest::find($request->id))->toBeNull();
});

it('runs admin notifications read operations', function () {
    $admin = makeAdmin();

    $n1 = RtmsNotification::create([
        'variant' => 'gray',
        'message' => 'System generated invoice batch.',
        'category' => 'system',
        'tenant_id' => null,
        'unread' => true,
    ]);

    RtmsNotification::create([
        'variant' => 'amber',
        'message' => 'Lease expiring soon.',
        'category' => 'lease',
        'tenant_id' => null,
        'unread' => true,
    ]);

    $this->actingAs($admin)->get(route('admin.notifications.index'))->assertOk();

    $this->actingAs($admin)
        ->patch(route('admin.notifications.read', $n1))
        ->assertRedirect(route('admin.notifications.index'));

    expect($n1->fresh()->unread)->toBeFalse();

    $this->actingAs($admin)
        ->post(route('admin.notifications.read-all'))
        ->assertRedirect(route('admin.notifications.index'));

    expect(RtmsNotification::admin()->where('unread', true)->count())->toBe(0);
});
