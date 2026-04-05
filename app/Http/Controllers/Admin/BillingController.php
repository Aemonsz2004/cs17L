<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Tenant;
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
            'invoices' => Invoice::latest()->get(),
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
            'method' => ['nullable', 'in:GCash,Bank Transfer,Cash'],
            'status' => ['nullable', 'in:paid,due,overdue'],
        ]);

        $data['utilities'] = $data['utilities'] ?? 0;
        $data['penalty'] = $data['penalty'] ?? 0;
        $data['status'] = $data['status'] ?? 'due';
        $data['invoice_no'] = Invoice::nextInvoiceNo();
        $data['total'] = $data['rent'] + $data['utilities'] + $data['penalty'];
        $data['paid_date'] = $data['status'] === 'paid' ? now()->toDateString() : null;

        Invoice::create($data);

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
        $invoice->update(['status' => 'overdue']);

        return redirect()->route('admin.billing.index')->with('success', 'Invoice marked overdue.');
    }
}
