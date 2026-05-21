<?php

namespace App\Http\Controllers\Applicant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function dashboard(): Response
    {
        $user = $this->applicantUser();

        $application = RentalApplication::with('unit')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        return Inertia::render('applicant/Dashboard', [
            'application' => $application,
        ]);
    }

    public function create(): Response
    {
        $user = $this->applicantUser();

        $latest = RentalApplication::where('user_id', $user->id)->latest()->first();

        if ($latest && $latest->status !== 'rejected') {
            return Inertia::render('applicant/ApplicationForm', [
                'blocked' => true,
                'latestStatus' => $latest->status,
                'units' => [],
            ]);
        }

        $units = Unit::where('status', 'vacant')
            ->whereNull('tenant_id')
            ->orderBy('floor')
            ->orderBy('number')
            ->get(['id', 'number', 'floor', 'type', 'area', 'base_rent']);

        return Inertia::render('applicant/ApplicationForm', [
            'blocked' => false,
            'latestStatus' => $latest?->status,
            'units' => $units,
        ]);
    }

    public function store(StoreApplicationRequest $request): RedirectResponse
    {
        $user = $this->applicantUser();

        $data = $request->validated();

        $active = RentalApplication::where('user_id', $user->id)
            ->whereIn('status', [
                'pending',
                'approved',
            ])
            ->exists();

        if ($active) {
            return redirect()
                ->route('applicant.dashboard')
                ->with('error', 'You already have an active application in progress.');
        }

        $unitAlreadyClaimed = RentalApplication::where('unit_id', (int) $data['unit_id'])
            ->whereIn('status', [
                'pending',
                'approved',
            ])
            ->exists();

        if ($unitAlreadyClaimed) {
            throw ValidationException::withMessages([
                'unit_id' => 'This unit currently has an active application under review.',
            ]);
        }

        $governmentIdPath = $request->file('government_id')->store('applications/government_ids', 'public');
        $incomeProofPath = $request->file('income_proof')->store('applications/income_proofs', 'public');

        RentalApplication::create([
            'user_id' => $user->id,
            'unit_id' => (int) $data['unit_id'],
            'full_name' => $data['full_name'],
            'occupation' => $data['occupation'],
            'monthly_income' => (int) $data['monthly_income'],
            'emergency_contact' => $data['emergency_contact'],
            'government_id_path' => $governmentIdPath,
            'income_proof_path' => $incomeProofPath,
            'preferred_move_in' => $data['preferred_move_in'] ?? null,
            'lease_duration' => isset($data['lease_duration']) ? (int) $data['lease_duration'] : null,
            'status' => 'pending',
        ]);

        RtmsNotification::create([
            'variant' => 'amber',
            'message' => 'New rental application submitted. Please review the pending queue.',
            'category' => 'lease',
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()
            ->route('applicant.dashboard')
            ->with('success', 'Application submitted. Admin has been notified.');
    }

    private function applicantUser(): User
    {
        $user = Auth::user();

        abort_unless($user instanceof User && $user->isApplicant(), 403);

        return $user;
    }
}
