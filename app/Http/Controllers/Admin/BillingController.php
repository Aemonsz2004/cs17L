<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Lease;
use App\Models\Tenant;
use App\Models\Unit;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'billing',
            'invoices' => Invoice::with([
                'tenant' => fn ($query) => $query->withTrashed(),
            ])->latest()->get(),
            'archivedInvoices' => Invoice::onlyTrashed()
                ->with(['tenant' => fn ($query) => $query->withTrashed()])
                ->latest('deleted_at')
                ->get(),
            'tenants' => Tenant::latest()->get(),
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'billing',
            'invoice' => $invoice,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'period' => ['required', 'string', 'max:50'],
            'rent' => ['required', 'integer', 'min:0'],
            'utilities' => ['nullable', 'integer', 'min:0'],
            'penalty' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['required', 'date'],
            'method' => ['nullable', 'in:GCash,Cash'],
            'status' => ['nullable', 'in:paid,due,overdue'],
        ]);

        $data['utilities'] = $data['utilities'] ?? 0;
        $data['penalty'] = $data['penalty'] ?? 0;
        $data['status'] = $data['status'] ?? 'due';
        $data['invoice_no'] = Invoice::nextInvoiceNo();
        $tenant = Tenant::find($data['tenant_id']);
        $unitRent = $tenant?->unit
            ? Unit::where('number', $tenant->unit)->value('base_rent')
            : null;

        if ($unitRent !== null) {
            $data['rent'] = (int) $unitRent;
        }
        $data['total'] = $data['rent'] + $data['utilities'] + $data['penalty'];
        $data['paid_date'] = $data['status'] === 'paid' ? now()->toDateString() : null;
        $data['lease_id'] = Lease::where('tenant_id', $data['tenant_id'])
            ->whereIn('status', ['active', 'expiring', 'overdue'])
            ->latest('id')
            ->value('id');

        $invoice = Invoice::create($data);
        TenantNotificationService::notifyInvoiceCreated($invoice);

        return redirect()->route('admin.billing.index')->with('success', 'Invoice created.');
    }

    public function markPaid(Invoice $invoice): RedirectResponse
    {
        $invoice->update([
            'status' => 'paid',
            'paid_date' => now()->toDateString(),
        ]);

        TenantNotificationService::notifyPaymentConfirmed($invoice);

        return redirect()->route('admin.billing.index')->with('success', 'Invoice marked paid.');
    }

    public function markOverdue(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return redirect()->route('admin.billing.index')
                ->with('error', 'Action not allowed: paid invoices cannot be marked overdue.');
        }

        if ($invoice->status !== 'overdue') {
            $invoice->update(['status' => 'overdue']);
            TenantNotificationService::notifyInvoiceOverdue($invoice->fresh());
        }

        return redirect()->route('admin.billing.index')->with('success', 'Invoice marked overdue.');
    }

    public function confirmBankTransfer(Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->method === 'Bank Transfer', 400);
        abort_unless($invoice->status === 'due', 400);

        $invoice->update([
            'status' => 'paid',
            'paid_date' => now()->toDateString(),
            'confirmed_at' => now(),
        ]);

        TenantNotificationService::notifyPaymentConfirmed($invoice);

        return redirect()->route('admin.billing.index')
            ->with('success', sprintf('Bank Transfer confirmed for Invoice %s.', $invoice->invoice_no));
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        $invoice->delete();

        return redirect()->route('admin.billing.index')->with('success', 'Invoice archived.');
    }

    public function restore(int $invoiceId): RedirectResponse
    {
        $invoice = Invoice::withTrashed()->findOrFail($invoiceId);

        if (! $invoice->trashed()) {
            return redirect()->route('admin.billing.index')->with('success', 'Invoice is already active.');
        }

        $invoice->restore();

        return redirect()->route('admin.billing.index')->with('success', 'Invoice restored.');
    }
}
