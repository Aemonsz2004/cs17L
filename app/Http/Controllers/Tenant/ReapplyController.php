<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ReapplyController extends Controller
{
    public function create(Unit $unit): Response|RedirectResponse
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            abort(403);
        }

        $tenant = Tenant::withTrashed()->find($user->tenant_id);

        if (! $tenant || $tenant->status !== 'moved_out') {
            abort(403, 'You are not eligible to re-apply.');
        }

        if ($unit->status !== 'vacant' || $unit->tenant_id !== null) {
            return redirect()->route('tenant.home')
                ->with('error', 'This unit is no longer available.');
        }

        return Inertia::render('tenant/ReapplyForm', [
            'unit' => [
                'id' => $unit->id,
                'number' => $unit->number,
                'floor' => $unit->floor,
                'type' => $unit->type,
                'area' => $unit->area,
                'base_rent' => $unit->base_rent,
            ],
            'tenant' => [
                'name' => $tenant->name,
                'email' => $tenant->email,
            ],
        ]);
    }

    public function store(Request $request, Unit $unit): RedirectResponse
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            abort(403);
        }

        $tenant = Tenant::withTrashed()->find($user->tenant_id);

        if (! $tenant || $tenant->status !== 'moved_out') {
            abort(403, 'You are not eligible to re-apply.');
        }

        if ($unit->status !== 'vacant' || $unit->tenant_id !== null) {
            throw ValidationException::withMessages([
                'unit' => 'This unit is no longer available.',
            ]);
        }

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'occupation' => ['required', 'string', 'max:255'],
            'monthly_income' => ['required', 'numeric', 'min:0'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'preferred_move_in' => ['nullable', 'date'],
            'lease_duration' => ['nullable', 'integer', 'in:3,6,12'],
        ]);

        $existingApplication = RentalApplication::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingApplication) {
            return redirect()
                ->route('applicant.dashboard')
                ->with('error', 'You already have an active application in progress.');
        }

        DB::transaction(function () use ($data, $unit, $user, $tenant): void {
            RentalApplication::create([
                'user_id' => $user->id,
                'unit_id' => $unit->id,
                'full_name' => $data['full_name'],
                'occupation' => $data['occupation'],
                'monthly_income' => (int) $data['monthly_income'],
                'emergency_contact' => $data['emergency_contact'],
                'government_id_path' => 'reapply/no-file',
                'income_proof_path' => 'reapply/no-file',
                'preferred_move_in' => $data['preferred_move_in'] ?? null,
                'lease_duration' => isset($data['lease_duration']) ? (int) $data['lease_duration'] : null,
                'status' => RentalApplication::STATUS_PENDING,
            ]);

            $user->update([
                'role' => 'applicant',
                'tenant_id' => null,
            ]);

            RtmsNotification::create([
                'variant' => 'amber',
                'message' => "Previous tenant {$tenant->name} has submitted a new application for Unit {$unit->number}.",
                'category' => 'lease',
                'tenant_id' => null,
                'unread' => true,
            ]);
        });

        return redirect()
            ->route('applicant.dashboard')
            ->with('success', 'Application submitted. Admin has been notified.');
    }
}
