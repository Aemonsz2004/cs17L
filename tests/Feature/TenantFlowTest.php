<?php

use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Message;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\User;

function makeTenantFixture(string $suffix = 'a'): array
{
    $tenant = Tenant::create([
        'name' => 'Tenant '.strtoupper($suffix),
        'initials' => strtoupper($suffix).'T',
        'contact' => 'Contact '.strtoupper($suffix),
        'phone' => '0912000000'.($suffix === 'a' ? '1' : '2'),
        'email' => 'tenant-'.$suffix.'@example.com',
        'unit' => $suffix === 'a' ? '101' : '102',
        'floor' => '1F',
        'type' => 'Office',
        'rent' => 9000,
        'deposit' => 18000,
        'lease_start' => '2026-01-01',
        'lease_end' => '2026-12-31',
        'payment_method' => 'GCash',
        'status' => 'active',
    ]);

    $user = User::create([
        'name' => 'Tenant User '.strtoupper($suffix),
        'email' => 'tenant-'.$suffix.'@test.local',
        'password' => 'password',
        'role' => 'tenant',
        'tenant_id' => $tenant->id,
        'email_verified_at' => now(),
    ]);

    return [$tenant, $user];
}

function makeAdminFixture(): User
{
    return User::create([
        'name' => 'Admin',
        'email' => 'admin@test.local',
        'password' => 'password',
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

it('protects tenant routes from admin users', function () {
    $admin = makeAdminFixture();

    $this->actingAs($admin)
        ->get(route('tenant.home'))
        ->assertRedirect(route('admin.dashboard'));
});

it('opens core tenant pages', function () {
    [, $tenantUser] = makeTenantFixture();

    $session = ['tenant_otp_verified' => $tenantUser->id];

    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.home'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.lease'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.billing'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.pay-rent'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.maintenance'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.messages'))->assertOk();
    $this->actingAs($tenantUser)->withSession($session)->get(route('tenant.notifications.index'))->assertOk();
});

it('allows tenant to submit payment for own invoice', function () {
    [$tenant, $tenantUser] = makeTenantFixture();

    $invoice = Invoice::create([
        'invoice_no' => 'INV-001',
        'tenant_id' => $tenant->id,
        'period' => 'April 2026',
        'rent' => 9000,
        'utilities' => 500,
        'penalty' => 0,
        'total' => 9500,
        'due_date' => '2026-04-10',
        'paid_date' => null,
        'method' => null,
        'status' => 'due',
    ]);

    $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->post(route('tenant.pay-rent.submit'), [
            'invoice_id' => $invoice->id,
            'method' => 'GCash',
            'reference' => 'GCASH-REF-001',
        ])
        ->assertRedirect(route('tenant.pay-rent'));

    $invoice->refresh();
    expect($invoice->status)->toBe('pending');
    expect($invoice->method)->toBe('GCash');
    expect($invoice->paid_date)->toBeNull();

    expect(RtmsNotification::admin()->where('category', 'payment')->count())->toBe(1);
    expect(RtmsNotification::forTenant($tenant->id)->where('category', 'payment')->count())->toBe(1);
});

it('blocks tenant from paying another tenants invoice', function () {
    [$tenantA, $tenantUserA] = makeTenantFixture('a');
    [$tenantB] = makeTenantFixture('b');

    $invoiceB = Invoice::create([
        'invoice_no' => 'INV-002',
        'tenant_id' => $tenantB->id,
        'period' => 'April 2026',
        'rent' => 9000,
        'utilities' => 500,
        'penalty' => 0,
        'total' => 9500,
        'due_date' => '2026-04-10',
        'paid_date' => null,
        'method' => null,
        'status' => 'due',
    ]);

    $this->actingAs($tenantUserA)
        ->withSession(['tenant_otp_verified' => $tenantUserA->id])
        ->post(route('tenant.pay-rent.submit'), [
            'invoice_id' => $invoiceB->id,
            'method' => 'GCash',
            'reference' => 'GCASH-REF-002',
        ])
        ->assertNotFound();

    expect($invoiceB->fresh()->status)->toBe('due');
});

it('allows tenant to create maintenance request', function () {
    [$tenant, $tenantUser] = makeTenantFixture();

    $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->post(route('tenant.maintenance.store'), [
            'title' => 'Broken AC',
            'type' => 'Air Conditioning',
            'priority' => 'high',
            'notes' => 'Needs urgent repair',
        ])
        ->assertRedirect(route('tenant.maintenance'));

    $request = MaintenanceRequest::firstOrFail();
    expect($request->tenant_id)->toBe($tenant->id);
    expect($request->status)->toBe('open');
});

it('allows tenant to send message', function () {
    [$tenant, $tenantUser] = makeTenantFixture();

    $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->post(route('tenant.messages.store'), [
            'text' => 'Please confirm schedule',
        ])
        ->assertRedirect(route('tenant.messages'));

    $message = Message::firstOrFail();
    expect($message->tenant_id)->toBe($tenant->id);
    expect($message->from)->toBe('tenant');
});

it('allows tenant to mark only their notifications as read', function () {
    [$tenantA, $tenantUserA] = makeTenantFixture('a');
    [$tenantB] = makeTenantFixture('b');

    RtmsNotification::create([
        'variant' => 'amber',
        'message' => 'Tenant A due soon',
        'category' => 'payment',
        'tenant_id' => $tenantA->id,
        'unread' => true,
    ]);

    RtmsNotification::create([
        'variant' => 'amber',
        'message' => 'Tenant B due soon',
        'category' => 'payment',
        'tenant_id' => $tenantB->id,
        'unread' => true,
    ]);

    $this->actingAs($tenantUserA)
        ->withSession(['tenant_otp_verified' => $tenantUserA->id])
        ->post(route('tenant.notifications.read-all'))
        ->assertRedirect(route('tenant.notifications.index'));

    expect(RtmsNotification::forTenant($tenantA->id)->where('unread', true)->count())->toBe(0);
    expect(RtmsNotification::forTenant($tenantB->id)->where('unread', true)->count())->toBe(1);
});

it('supports demo paymongo intent lifecycle for tenant checkout simulation', function () {
    [$tenant, $tenantUser] = makeTenantFixture();

    $invoice = Invoice::create([
        'invoice_no' => 'INV-100',
        'tenant_id' => $tenant->id,
        'period' => 'May 2026',
        'rent' => 9000,
        'utilities' => 500,
        'penalty' => 0,
        'total' => 9500,
        'due_date' => '2026-05-10',
        'paid_date' => null,
        'method' => null,
        'status' => 'due',
    ]);

    $create = $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->postJson(route('tenant.paymongo.demo.intents.create'), [
            'invoice_id' => $invoice->id,
            'channel' => 'gcash',
        ])
        ->assertOk()
        ->json();

    $intentId = $create['data']['id'];

    $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->getJson(route('tenant.paymongo.demo.intents.show', ['intentId' => $intentId]))
        ->assertOk()
        ->assertJsonPath('data.attributes.status', 'awaiting_payment_method');

    $this->actingAs($tenantUser)
        ->withSession(['tenant_otp_verified' => $tenantUser->id])
        ->postJson(route('tenant.paymongo.demo.intents.confirm', ['intentId' => $intentId]))
        ->assertOk()
        ->assertJsonPath('data.attributes.status', 'succeeded');
});
