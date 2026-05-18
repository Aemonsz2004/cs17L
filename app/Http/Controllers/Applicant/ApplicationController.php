<?php

namespace App\Http\Controllers\Applicant;

use App\Http\Controllers\Controller;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use App\Models\Unit;
use App\Models\User;
use App\Support\ApplicationPaymentService;
use App\Support\ApplicationWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function dashboard(ApplicationPaymentService $paymentService): Response
    {
        $user = $this->applicantUser();

        $application = RentalApplication::with('unit')
            ->with('latestPayment')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if ($application
            && $application->status === RentalApplication::STATUS_PAYMENT_PENDING
            && $application->latestPayment
            && $application->latestPayment->status === 'payment_pending') {
            try {
                $paymentService->syncPendingCheckoutStatus($application->latestPayment);
                $application->refresh()->loadMissing('unit', 'latestPayment');
            } catch (\Throwable $exception) {
                logger()->warning('Unable to sync pending PayMongo checkout status from applicant dashboard.', [
                    'application_id' => $application->id,
                    'payment_id' => $application->latestPayment->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

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

    public function store(Request $request): RedirectResponse
    {
        $user = $this->applicantUser();

        $data = $request->validate([
            'unit_id' => [
                'required',
                Rule::exists('units', 'id')->where(fn ($query) => $query
                    ->where('status', 'vacant')
                    ->whereNull('tenant_id')),
            ],
            'full_name' => ['required', 'string', 'max:255'],
            'occupation' => ['required', 'string', 'max:255'],
            'monthly_income' => ['required', 'integer', 'min:0'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'government_id' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'income_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ]);

        $active = RentalApplication::where('user_id', $user->id)
            ->whereIn('status', [
                'pending_review',
                'approved',
                'lease_sent',
                'payment_pending',
                'payment_paid',
            ])
            ->exists();

        if ($active) {
            return redirect()
                ->route('applicant.dashboard')
                ->with('error', 'You already have an active application in progress.');
        }

        $unitAlreadyClaimed = RentalApplication::where('unit_id', (int) $data['unit_id'])
            ->whereIn('status', [
                'pending_review',
                'approved',
                'lease_sent',
                'payment_pending',
                'payment_paid',
            ])
            ->exists();

        if ($unitAlreadyClaimed) {
            return back()->withErrors([
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
            'status' => 'pending_review',
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

    public function acknowledgeLease(RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $user = $this->applicantUser();

        abort_unless((int) $application->user_id === (int) $user->id, 403);

        try {
            $workflow->acknowledgeLease($application);
        } catch (\RuntimeException $exception) {
            return redirect()
                ->route('applicant.dashboard')
                ->with('error', $exception->getMessage());
        }

        RtmsNotification::create([
            'variant' => 'teal',
            'message' => 'Applicant acknowledged lease terms and is ready for deposit payment.',
            'category' => 'lease',
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()
            ->route('applicant.dashboard')
            ->with('success', 'Lease acknowledged. Payment window is now open.');
    }

    public function submitDeposit(Request $request, RentalApplication $application, ApplicationPaymentService $paymentService): RedirectResponse
    {
        $user = $this->applicantUser();

        abort_unless((int) $application->user_id === (int) $user->id, 403);

        $data = $request->validate([
            'deposit_method' => ['nullable', 'in:GCash'],
            'retry' => ['nullable', 'boolean'],
        ]);

        $retry = (bool) ($data['retry'] ?? false);

        $paymentMethod = 'GCash';

        try {
            $payment = $paymentService->initiateDepositPayment($application, $paymentMethod, $retry);
        } catch (\RuntimeException $exception) {
            return redirect()
                ->route('applicant.dashboard')
                ->with('error', $exception->getMessage());
        }

        RtmsNotification::create([
            'variant' => 'amber',
            'message' => 'Deposit checkout initiated by applicant. Waiting for PayMongo webhook verification.',
            'category' => 'payment',
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()
            ->route('applicant.dashboard')
            ->with('success', $retry
                ? 'A fresh checkout was created. Please complete payment using the new PayMongo link.'
                : 'Deposit checkout created. Complete payment to trigger PayMongo webhook verification.')
            ->with('checkout_url', $payment->checkout_url)
            ->with('payment_reference', $payment->provider_reference);
    }

    private function applicantUser(): User
    {
        $user = Auth::user();

        abort_unless($user instanceof User && $user->isApplicant(), 403);

        return $user;
    }

    public function approve(Application $application)
    {
        DB::transaction(function () use ($application) {

            $application->update([
                'status' => 'approved',
            ]);

            $tenant = Tenant::create([
                'user_id' => $application->user_id,
                'unit_id' => $application->unit_id,
                'status' => 'pending_payment',
            ]);

            Unit::where('id', $application->unit_id)
                ->update([
                    'status' => 'reserved',
                ]);

            Lease::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $application->unit_id,
                'status' => 'pending',
                'start_date' => now(),
                'end_date' => now()->addYear(),
            ]);
        });
    }
}
