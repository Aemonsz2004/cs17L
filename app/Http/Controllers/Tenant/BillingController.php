<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;
        TenantNotificationService::syncUnpaidReminders($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'billing',
            'invoices' => Invoice::where('tenant_id', $tenantId)->latest()->get(),
            'archivedInvoices' => Invoice::onlyTrashed()
                ->where('tenant_id', $tenantId)
                ->latest('deleted_at')
                ->get(),
        ]);
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->tenant_id === auth()->user()->tenant_id, 403);

        $invoice->delete();

        return redirect()->route('tenant.billing')->with('success', 'Invoice archived.');
    }

    public function restore(int $invoiceId): RedirectResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $invoice = Invoice::withTrashed()
            ->where('tenant_id', $tenantId)
            ->findOrFail($invoiceId);

        if (! $invoice->trashed()) {
            return redirect()->route('tenant.billing')->with('success', 'Invoice is already active.');
        }

        $invoice->restore();

        return redirect()->route('tenant.billing')->with('success', 'Invoice restored.');
    }
}
