<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\RtmsNotification;

class TenantNotificationService
{
    public static function syncUnpaidReminders(int $tenantId): void
    {
        $invoices = Invoice::where('tenant_id', $tenantId)
            ->whereIn('status', ['due', 'overdue'])
            ->get();

        foreach ($invoices as $invoice) {
            $isOverdue = $invoice->status === 'overdue';
            $variant = $isOverdue ? 'red' : 'amber';
            $label = $isOverdue ? 'overdue' : 'due';

            $message = sprintf(
                'Payment reminder: Invoice %s (%s) amounting to P%s is %s on %s.',
                $invoice->invoice_no,
                $invoice->period,
                number_format((int) $invoice->total),
                $label,
                optional($invoice->due_date)->toDateString()
            );

            RtmsNotification::firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'category' => 'payment',
                    'message' => $message,
                ],
                [
                    'variant' => $variant,
                    'unread' => true,
                ]
            );
        }
    }

    public static function notifyPaymentSubmitted(Invoice $invoice, string $method, ?string $reference = null): void
    {
        $referenceSuffix = $reference ? sprintf(' Reference: %s.', $reference) : '';

        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'payment',
            'message' => sprintf(
                'Payment submitted by tenant #%d for invoice %s via %s. Awaiting confirmation.%s',
                $invoice->tenant_id,
                $invoice->invoice_no,
                $method,
                $referenceSuffix,
            ),
            'tenant_id' => null,
            'unread' => true,
        ]);

        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'payment',
            'message' => sprintf(
                'Your payment submission for invoice %s has been sent to admin for confirmation.%s',
                $invoice->invoice_no,
                $referenceSuffix,
            ),
            'tenant_id' => $invoice->tenant_id,
            'unread' => true,
        ]);
    }

    public static function notifyPaymentConfirmed(Invoice $invoice): void
    {
        RtmsNotification::create([
            'variant' => 'teal',
            'category' => 'payment',
            'message' => sprintf(
                'Payment confirmed: Invoice %s has been marked as paid.',
                $invoice->invoice_no
            ),
            'tenant_id' => null,
            'unread' => true,
        ]);

        RtmsNotification::create([
            'variant' => 'teal',
            'category' => 'payment',
            'message' => sprintf(
                'Your payment for Invoice %s has been confirmed as paid.',
                $invoice->invoice_no
            ),
            'tenant_id' => $invoice->tenant_id,
            'unread' => true,
        ]);
    }

    public static function notifyInvoiceCreated(Invoice $invoice): void
    {
        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'payment',
            'message' => sprintf(
                'New invoice %s for %s is now due. Amount: P%s.',
                $invoice->invoice_no,
                $invoice->period,
                number_format((int) $invoice->total)
            ),
            'tenant_id' => $invoice->tenant_id,
            'unread' => true,
        ]);
    }

    public static function notifyInvoiceOverdue(Invoice $invoice): void
    {
        RtmsNotification::create([
            'variant' => 'red',
            'category' => 'payment',
            'message' => sprintf(
                'Invoice %s for %s is now overdue. Please settle immediately.',
                $invoice->invoice_no,
                $invoice->period
            ),
            'tenant_id' => $invoice->tenant_id,
            'unread' => true,
        ]);
    }

    public static function notifyMaintenanceInProgress(MaintenanceRequest $request): void
    {
        if ($request->tenant_id === null) {
            return;
        }

        $assignee = $request->assigned_to ? sprintf(' Assigned to: %s.', $request->assigned_to) : '';

        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'maintenance',
            'message' => sprintf(
                'Your maintenance request "%s" is now in progress.%s',
                $request->title,
                $assignee
            ),
            'tenant_id' => $request->tenant_id,
            'unread' => true,
        ]);
    }

    public static function notifyMaintenanceResolved(MaintenanceRequest $request): void
    {
        if ($request->tenant_id === null) {
            return;
        }

        $resolvedDate = optional($request->resolved_date)->toDateString();
        $dateSuffix = $resolvedDate ? sprintf(' Resolved on %s.', $resolvedDate) : '';

        RtmsNotification::create([
            'variant' => 'teal',
            'category' => 'maintenance',
            'message' => sprintf(
                'Your maintenance request "%s" has been resolved.%s',
                $request->title,
                $dateSuffix
            ),
            'tenant_id' => $request->tenant_id,
            'unread' => true,
        ]);
    }
}
