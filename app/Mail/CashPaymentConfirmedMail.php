<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Mail\Mailable;

class CashPaymentConfirmedMail extends Mailable
{
    public function __construct(public Invoice $invoice) {}

    public function build(): self
    {
        return $this->markdown('mail.cash-payment-confirmed')
            ->subject('Your Cash Payment Has Been Confirmed')
            ->to($this->invoice->tenant->email);
    }
}
