@component('mail::message')
# Payment Instructions

Hi {{ $depositInvoice->tenant->name }},

Your rental application has been approved! To complete the rental process, please submit your security deposit payment.

## Invoice Details

- **Invoice No:** {{ $depositInvoice->invoice_no }}
- **Amount Due:** P{{ number_format($depositInvoice->total) }}
- **Due Date:** {{ $depositInvoice->due_date->format('F d, Y') }}
- **Payment Method:** Online (PayMongo)

## How to Pay

You can pay your security deposit online using any of the following methods:
- **GCash**
- **Maya**
- **Credit/Debit Card**
- **Bank Transfer**

@component('mail::button', ['url' => $paymentLink])
Pay Now
@endcomponent

Or log in to your dashboard to view payment options:

@component('mail::button', ['url' => route('tenant.pay-rent')])
View Payment Details
@endcomponent

## Important Notes

- Payment must be completed within 7 days to confirm your reservation
- Your unit will remain reserved until payment is received
- You will receive a confirmation email once your payment is verified

If you have any issues or questions about the payment process, please contact our office immediately.

Thanks,<br>
{{ config('app.name') }} Management
@endcomponent
