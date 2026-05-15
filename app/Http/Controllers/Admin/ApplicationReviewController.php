<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RentalApplication;
use App\Support\ApplicationWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationReviewController extends Controller
{
    public function index(): Response
    {
        $applications = RentalApplication::with([
            'user:id,name,email',
            'unit:id,number,floor,type,area,base_rent,status,reserved_until',
            'latestPayment' => function ($query): void {
                $query->select([
                    'application_payments.id',
                    'application_payments.rental_application_id',
                    'application_payments.provider_reference',
                    'application_payments.payment_method',
                    'application_payments.status',
                    'application_payments.checkout_url',
                    'application_payments.verified_at',
                    'application_payments.expires_at',
                ]);
            },
        ])
            ->latest()
            ->get();

        $archivedApplications = RentalApplication::onlyTrashed()
            ->with([
                'user:id,name,email',
                'unit:id,number,floor,type,area,base_rent,status,reserved_until',
                'latestPayment' => function ($query): void {
                    $query->select([
                        'application_payments.id',
                        'application_payments.rental_application_id',
                        'application_payments.provider_reference',
                        'application_payments.payment_method',
                        'application_payments.status',
                        'application_payments.checkout_url',
                        'application_payments.verified_at',
                        'application_payments.expires_at',
                    ]);
                },
            ])
            ->latest('deleted_at')
            ->get();

        return Inertia::render('welcome', [
            'initialPage' => 'applications',
            'applications' => $applications,
            'archivedApplications' => $archivedApplications,
        ]);
    }

    public function approve(RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->approve($application, Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')->with('success', 'Application approved and unit is now RESERVED. Send lease terms next.');
    }

    public function reject(Request $request, RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $workflow->reject($application, $data['rejection_reason'], Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')->with('success', 'Application rejected and applicant can re-apply.');
    }

    public function sendLease(Request $request, RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'lease_terms' => ['required', 'string', 'min:20'],
            'lease_attachment' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $leaseAttachmentPath = $application->lease_attachment_path;

        if ($request->hasFile('lease_attachment')) {
            if ($leaseAttachmentPath) {
                Storage::disk('public')->delete($leaseAttachmentPath);
            }

            $leaseAttachmentPath = $request->file('lease_attachment')->store('applications/lease_attachments', 'public');
        }

        try {
            $workflow->sendLease($application, $data['lease_terms'], Auth::id(), $leaseAttachmentPath);
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')->with('success', 'Lease terms sent to applicant for acknowledgment.');
    }

    public function confirmDeposit(RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->confirmDeposit($application, Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')->with('success', 'Admin override applied. Auto-conversion has been triggered.');
    }

    public function convertToTenant(Request $request, RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'payment_method' => ['nullable', 'in:GCash,Cash'],
        ]);

        $data['admin_id'] = Auth::id();

        try {
            $credentials = $workflow->convertToTenant($application, $data);
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('admin.applications.index')
            ->with('success', 'Manual conversion override completed.')
            ->with('tenant_credentials', $credentials);
    }

    public function destroy(RentalApplication $application): RedirectResponse
    {
        $application->delete();

        return redirect()->route('admin.applications.index')->with('success', 'Application archived.');
    }

    public function restore(int $applicationId): RedirectResponse
    {
        $application = RentalApplication::withTrashed()->findOrFail($applicationId);

        if (! $application->trashed()) {
            return redirect()->route('admin.applications.index')->with('success', 'Application is already active.');
        }

        $application->restore();

        return redirect()->route('admin.applications.index')->with('success', 'Application restored.');
    }
}
