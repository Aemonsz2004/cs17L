<?php

namespace App\Mail;

use App\Models\RentalApplication;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Mail\Mailable;

class ApplicationApprovedMail extends Mailable
{
    public function __construct(
        public RentalApplication $application,
        public Tenant $tenant,
        public Unit $unit,
    ) {}

    public function build(): self
    {
        return $this->markdown('mail.application-approved')
            ->subject('Your Rental Application Has Been Approved!')
            ->to($this->tenant->email);
    }
}
