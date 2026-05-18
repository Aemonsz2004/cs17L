<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TenantWelcomeMail;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GuestRegistrationController extends Controller
{
    public function create()
    {
        $units = Unit::where('status', 'vacant')->orderBy('number')->get();

        return Inertia::render('GuestRegister', ['units' => $units]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants,email|unique:users,email',
            'contact' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'unit_id' => 'required|exists:units,id',
            'payment_method' => 'required|in:GCash,Bank Transfer,Cash',
        ]);

        $unit = Unit::where('id', $data['unit_id'])
            ->where('status', 'vacant')
            ->lockForUpdate()
            ->first();

        if (! $unit) {
            throw ValidationException::withMessages(['unit_id' => 'The selected unit is no longer available.']);
        }

        // Calculate deposit (2 months rent)
        $deposit = $unit->base_rent * 2;

        // Create a pending tenant record (to hold payment intent later)
        $tenant = Tenant::create([
            'name' => $data['name'],
            'initials' => strtoupper(substr($data['name'], 0, 2)),
            'contact' => $data['contact'] ?? '',
            'phone' => $data['phone'],
            'email' => $data['email'],
            'floor' => $unit->floor,
            'type' => $unit->type,
            'rent' => $unit->base_rent,
            'deposit' => $deposit,
            'lease_start' => now()->toDateString(),
            'lease_end' => now()->addYear()->toDateString(), // or configurable
            'payment_method' => $data['payment_method'],
            'status' => 'pending_payment',
        ]);

        // Create a payment intent for the deposit
        $intentId = 'pi_demo_'.strtolower(Str::random(16));
        cache()->put("tenant_reg_{$intentId}", [
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'deposit' => $deposit,
        ], now()->addMinutes(20));

        return response()->json([
            'units' => Unit::where('status', 'vacant')->get(),
            'payment_intent' => [
                'id' => $intentId,
                'client_key' => 'pk_test_demo_'.strtolower(Str::random(12)),
            ],
        ]);

    }

    public function confirmPayment(Request $request)
    {
        $intentId = $request->input('intent_id');
        $cached = cache()->pull("tenant_reg_{$intentId}");
        if (! $cached) {
            return back()->with('error', 'Payment session expired. Please try again.');
        }

        $tenant = Tenant::findOrFail($cached['tenant_id']);
        $unit = Unit::findOrFail($cached['unit_id']);

        DB::transaction(function () use ($tenant, $unit) {
            // Mark tenant active
            $tenant->update(['status' => 'active']);

            // Assign unit
            $unit->update(['status' => 'occupied', 'tenant_id' => $tenant->id]);

            // Create user with temporary password
            $tempPassword = Str::random(10);
            User::create([
                'name' => $tenant->name,
                'email' => $tenant->email,
                'password' => bcrypt($tempPassword),
                'role' => 'tenant',
                'tenant_id' => $tenant->id,
                'must_change_password' => true,
            ]);

            // Send welcome mail (next section)
            Mail::to($tenant->email)->send(new TenantWelcomeMail($tenant, $tempPassword));

            // Admin notification
            RtmsNotification::create([
                'variant' => 'teal',
                'message' => "New tenant {$tenant->name} registered and paid deposit for unit {$unit->number}.",
                'category' => 'system',
                'tenant_id' => null, // admin-facing
                'unread' => true,
            ]);
        });

        return redirect()->route('login')->with('success', 'Account created! Please check your email for your temporary password.');
    }
}
