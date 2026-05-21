<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveApplicationRequest;
use App\Http\Requests\ConfirmMoveInRequest;
use App\Http\Requests\RejectApplicationRequest;
use App\Models\RentalApplication;
use App\Models\Unit;
use App\Support\ApplicationApprovalService;
use App\Support\ApplicationWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationReviewController extends Controller
{
    public function index(): Response
    {
        $applications = RentalApplication::with([
            'user:id,name,email',
            'unit:id,number,floor,type,area,base_rent,status,reserved_until',
        ])
            ->latest()
            ->get();

        $archivedApplications = RentalApplication::onlyTrashed()
            ->with([
                'user:id,name,email',
                'unit:id,number,floor,type,area,base_rent,status,reserved_until',
            ])
            ->latest('deleted_at')
            ->get();

        return Inertia::render('welcome', [
            'initialPage' => 'applications',
            'applications' => $applications,
            'archivedApplications' => $archivedApplications,
            'units' => Unit::where('status', 'vacant')->orderBy('floor')->orderBy('number')->get(),
        ]);
    }

    public function approve(ApproveApplicationRequest $request, RentalApplication $application, ApplicationApprovalService $approvalService): RedirectResponse
    {
        $data = $request->validated();

        $unit = Unit::findOrFail($data['unit_id']);

        try {
            $approvalService->approve($application, $unit, Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')
            ->with('success', 'Application approved. Unit reserved.');
    }

    public function confirmPayment(RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->confirmPayment($application, Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')
            ->with('success', 'Payment confirmed. Awaiting move-in confirmation.');
    }

    public function reject(RejectApplicationRequest $request, RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validated();

        try {
            $workflow->reject($application, $data['rejection_reason'], Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')->with('success', 'Application rejected.');
    }

    public function confirmMoveIn(ConfirmMoveInRequest $request, RentalApplication $application, ApplicationWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validated();

        try {
            $workflow->confirmMoveIn($application, (int) $data['lease_duration'], $data['payment_method'] ?? null, Auth::id());
        } catch (\RuntimeException $exception) {
            return redirect()->route('admin.applications.index')->with('error', $exception->getMessage());
        }

        return redirect()->route('admin.applications.index')
            ->with('success', 'Move-in confirmed. Tenant created and unit occupied.');
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
