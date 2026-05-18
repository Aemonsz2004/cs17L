<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Mail\Mailable;

class TenantWelcomeMail extends Mailable
{
    public function __construct(public Tenant $tenant, public string $password) {}

    public function build(): self
    {
        return $this->markdown('mail.tenant.welcome')
            ->subject('Welcome to '.config('app.name').' - Your Account is Ready');
    }
}
