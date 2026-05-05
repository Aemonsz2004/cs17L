<?php

namespace App\Support;

use App\Models\Lease;
use App\Models\RentalApplication;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Carbon;

class TenantService
{
    public function createFromApplication(RentalApplication $application, string $paymentMethod, array $leaseData = []): Tenant
    {
        $application->loadMissing(['unit', 'user']);

        $unit = Unit::whereKey($application->unit_id)->lockForUpdate()->firstOrFail();
        $user = User::whereKey($application->user_id)->lockForUpdate()->firstOrFail();

        if ($user->tenant_id !== null) {
            return Tenant::whereKey($user->tenant_id)->firstOrFail();
        }

        $existingTenant = Tenant::where('user_id', $user->id)->orWhere('email', $user->email)->first();
        if ($existingTenant) {
            $user->update(['tenant_id' => $existingTenant->id]);

            if ($unit->tenant_id === null) {
                $unit->update([
                    'tenant_id' => $existingTenant->id,
                    'status' => 'occupied',
                    'reserved_until' => null,
                ]);
            }

            return $existingTenant;
        }

        $startDate = isset($leaseData['start_date'])
            ? Carbon::parse($leaseData['start_date'])->startOfDay()
            : now()->startOfDay();

        $endDate = isset($leaseData['end_date'])
            ? Carbon::parse($leaseData['end_date'])->startOfDay()
            : $startDate->copy()->addYear()->subDay();

        $tenant = Tenant::create([
            'user_id' => $user->id,
            'name' => $application->full_name,
            'initials' => $this->initials($application->full_name),
            'contact' => $application->occupation,
            'phone' => $application->emergency_contact,
            'email' => $user->email,
            'unit' => $unit->number,
            'floor' => $unit->floor,
            'type' => $unit->type,
            'rent' => $unit->base_rent,
            'deposit' => $unit->base_rent * 2,
            'lease_start' => $startDate->toDateString(),
            'lease_end' => $endDate->toDateString(),
            'payment_method' => $paymentMethod,
            'status' => 'active',
        ]);

        Lease::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'rent' => $unit->base_rent,
            'deposit' => $unit->base_rent * 2,
            'payment_method' => $paymentMethod,
            'status' => 'active',
            'terms' => $application->lease_terms,
            'acknowledged_at' => $application->lease_acknowledged_at,
        ]);

        $user->update([
            'tenant_id' => $tenant->id,
            'must_change_password' => false,
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        $unit->update([
            'tenant_id' => $tenant->id,
            'status' => 'occupied',
            'reserved_until' => null,
        ]);

        return $tenant;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';

        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }

            $initials .= strtoupper(substr($part, 0, 1));
            if (strlen($initials) >= 4) {
                break;
            }
        }

        return $initials !== '' ? substr($initials, 0, 4) : 'TEN';
    }
}
