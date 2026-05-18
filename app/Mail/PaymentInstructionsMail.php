<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Mail\Mailable;

class PaymentInstructionsMail extends Mailable
{
    public function __construct(
        public Invoice $depositInvoice,
        public string $paymentLink,
    ) {}

    public function build(): self
    {
        return $this->markdown('mail.payment-instructions')
            ->subject('Payment Instructions for Your Rental Application')
            ->to($this->depositInvoice->tenant->email);
    }
}
