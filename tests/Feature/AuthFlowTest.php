<?php

use App\Models\Tenant;
use App\Models\User;

it('handles login logout and role based redirects', function () {
    $tenant = Tenant::create([
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
    ]);

    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@test.local',
        'password' => 'password',
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $tenantUser = User::create([
        'name' => 'Tenant User',
        'email' => 'tenant@test.local',
        'password' => 'password',
        'role' => 'tenant',
        'tenant_id' => $tenant->id,
        'email_verified_at' => now(),
    ]);

    $this->get('/')->assertRedirect(route('login'));
    $this->get(route('login'))->assertOk();

    $this->post('/login', [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertRedirect(route('admin.dashboard'));

    $this->post(route('logout'))->assertRedirect(route('login'));

    $this->post('/login', [
        'email' => $tenantUser->email,
        'password' => 'password',
    ])->assertRedirect(route('tenant.otp.show'));

    $this->post(route('logout'))->assertRedirect(route('login'));
});

it('rejects invalid credentials', function () {
    User::create([
        'name' => 'Admin',
        'email' => 'admin@test.local',
        'password' => 'password',
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->from(route('login'))
        ->post('/login', [
            'email' => 'admin@test.local',
            'password' => 'wrong-password',
        ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');
});
