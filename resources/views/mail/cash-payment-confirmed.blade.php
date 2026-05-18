@component('mail::message')
# Payment Confirmed

Hi {{ $invoice->tenant->name }},

Your cash payment has been confirmed and recorded in our system.

## Payment Details

- **Invoice No:** {{ $invoice->invoice_no }}
- **Amount Paid:** P{{ number_format($invoice->total) }}
- **Receipt No:** {{ $invoice->receipt_number }}
- **Payment Date:** {{ $invoice->payment_received_at->format('F d, Y') }}
- **Status:** Confirmed

## What's Next?

@if($invoice->period === 'Deposit')
Your security deposit has been confirmed. Your lease is now active and you can access your unit.

Your first month's rent payment will be due on the date specified in your lease agreement.
@else
Your rent payment has been confirmed. Thank you for staying current with your payments!
@endif

Log in to your dashboard to view your lease details and upcoming payment schedules:

@component('mail::button', ['url' => route('tenant.home')])
View Your Account
@endcomponent

If you have any questions or need to report any issues, please don't hesitate to contact our office.

Thanks,<br>
{{ config('app.name') }} Management
@endcomponent
