<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $method = $request->input('method');

        $data = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'method' => ['required', 'in:GCash,Bank Transfer,Cash'],
            'reference' => [
                $method === 'Bank Transfer' ? 'required' : 'nullable',
                'string',
                'max:120',
                'min:3',
            ],
        ]);

        $invoice = Invoice::where('id', $data['invoice_id'])
            ->where('tenant_id', $this->tenantUser(Auth::user())->tenant_id)
            ->whereIn('status', ['due', 'overdue'])
            ->firstOrFail();

        $invoice->update([
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'paid_date' => null,
            'confirmed_at' => null,
        ]);

        TenantNotificationService::notifyPaymentSubmitted(
            $invoice,
            $data['method'],
            $data['reference'] ?? null,
        );

        $successMessage = 'Payment submitted. Please wait for admin confirmation.';

        if (! empty($data['reference'])) {
            $successMessage .= ' Ref: ' . $data['reference'];
        }

        return redirect()->route('tenant.pay-rent')->with('success', $successMessage);
    }

    private function tenantUser(mixed $user): User
    {
        abort_unless($user instanceof User && $user->isTenant(), 403);

        return $user;
    }
}
