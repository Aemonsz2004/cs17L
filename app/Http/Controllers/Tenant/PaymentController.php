<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(): Response
    {
        $user = $this->tenantUser(Auth::user());
        $tenantId = $user->tenant_id;
        TenantNotificationService::syncUnpaidReminders($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'pay-rent',
            'unpaidInvoices' => Invoice::where('tenant_id', $tenantId)
                ->whereIn('status', ['due', 'overdue'])
                ->latest()
                ->get(),
        ]);
    }

    public function submit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'method' => ['required', 'in:GCash,Cash'],
            'reference' => [
                'required_if:method,GCash',
                'string',
                'max:120',
                'min:3',
            ],
        ]);

        $invoice = Invoice::where('id', $data['invoice_id'])
            ->where('tenant_id', $this->tenantUser(Auth::user())->tenant_id)
            ->whereIn('status', ['due', 'overdue'])
            ->firstOrFail();

        $this->assertInvoiceMatchesUnit($invoice);

        if ($data['method'] === 'GCash') {
            $invoice->update([
                'method' => 'GCash',
                'reference' => $data['reference'],
                'paid_date' => null,
                'confirmed_at' => null,
            ]);

            TenantNotificationService::notifyPaymentSubmitted(
                $invoice,
                'GCash',
                $data['reference'],
            );

            $successMessage = 'Payment submitted. Please wait for admin confirmation.';
            $successMessage .= ' Ref: '.$data['reference'];

            return redirect()->route('tenant.pay-rent')->with('success', $successMessage);
        }

        if ($data['method'] === 'Cash') {
            $invoice->update(['method' => 'Cash']);
            TenantNotificationService::notifyPaymentSubmitted(
                $invoice,
                'Cash',
                null,
            );

            return redirect()->route('tenant.pay-rent')
                ->with('success', 'Cash payment submitted. Please wait for admin confirmation.');
        }

        return redirect()->route('tenant.pay-rent')->with('error', 'Invalid payment method.');
    }

    private function tenantUser(mixed $user): User
    {
        abort_unless($user instanceof User && $user->isTenant(), 403);

        return $user;
    }

    private function assertInvoiceMatchesUnit(Invoice $invoice): void
    {
        $expectedTotal = (int) $invoice->rent + (int) $invoice->utilities + (int) $invoice->penalty;

        if ((int) $invoice->total !== $expectedTotal) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Invoice total mismatch. Please contact admin.',
            ]);
        }

        $invoice->loadMissing(['lease.unit']);
        $baseRent = $invoice->lease?->unit?->base_rent;

        if ($baseRent !== null && (int) $invoice->rent !== (int) $baseRent) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Rent amount does not match the unit rent. Please contact admin.',
            ]);
        }
    }
}
