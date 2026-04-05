<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Message;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenant = Tenant::create([
            'name' => 'J&R Trading Co.',
            'initials' => 'JR',
            'contact' => 'Roberto Cruz',
            'phone' => '09123456789',
            'email' => 'jrtrading@example.com',
            'unit' => '101',
            'floor' => '1F',
            'type' => 'Office',
            'rent' => 9000,
            'deposit' => 18000,
            'lease_start' => Carbon::parse('2022-01-15')->toDateString(),
            'lease_end' => Carbon::parse('2026-12-14')->toDateString(),
            'payment_method' => 'GCash',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'RTMS Admin',
            'email' => 'admin@rtms.test',
            'password' => 'password',
            'role' => 'admin',
            'tenant_id' => null,
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'J&R Tenant',
            'email' => 'tenant@rtms.test',
            'password' => 'password',
            'role' => 'tenant',
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
        ]);

        Unit::create([
            'number' => '101',
            'floor' => '1F',
            'type' => 'Office',
            'area' => 42,
            'base_rent' => 9000,
            'status' => 'occupied',
            'tenant_id' => $tenant->id,
        ]);

        Invoice::create([
            'invoice_no' => 'INV-001',
            'tenant_id' => $tenant->id,
            'period' => 'March 2026',
            'rent' => 9000,
            'utilities' => 500,
            'penalty' => 0,
            'total' => 9500,
            'due_date' => Carbon::parse('2026-03-10')->toDateString(),
            'paid_date' => Carbon::parse('2026-03-09')->toDateString(),
            'method' => 'GCash',
            'status' => 'paid',
        ]);

        Invoice::create([
            'invoice_no' => 'INV-002',
            'tenant_id' => $tenant->id,
            'period' => 'April 2026',
            'rent' => 9000,
            'utilities' => 500,
            'penalty' => 0,
            'total' => 9500,
            'due_date' => Carbon::parse('2026-04-10')->toDateString(),
            'paid_date' => null,
            'method' => null,
            'status' => 'due',
        ]);

        MaintenanceRequest::create([
            'title' => 'AC unit not cooling',
            'unit' => '101',
            'tenant' => 'J&R Trading Co.',
            'tenant_id' => $tenant->id,
            'type' => 'Air Conditioning',
            'priority' => 'medium',
            'status' => 'inprogress',
            'assigned_to' => 'Pedro (HVAC)',
            'resolved_date' => null,
            'notes' => 'Technician scheduled for inspection this week.',
        ]);

        RtmsNotification::create([
            'variant' => 'amber',
            'message' => 'Invoice INV-002 is due on Apr 10, 2026.',
            'category' => 'payment',
            'tenant_id' => $tenant->id,
            'unread' => true,
        ]);

        RtmsNotification::create([
            'variant' => 'gray',
            'message' => 'Monthly invoices have been generated for active tenants.',
            'category' => 'system',
            'tenant_id' => null,
            'unread' => true,
        ]);

        Message::create([
            'tenant_id' => $tenant->id,
            'from' => 'admin',
            'text' => 'Welcome to the portal. Let us know if you need help.',
            'read' => false,
        ]);

        Message::create([
            'tenant_id' => $tenant->id,
            'from' => 'tenant',
            'text' => 'Thank you, we will send our payment proof before due date.',
            'read' => true,
        ]);
    }
}
