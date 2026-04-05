<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class TenantOtpService
{
    public function __construct(
        private readonly MailConfigurationGuard $mailConfigurationGuard,
    ) {
    }

    public function issue(User $user): void
    {
        $this->mailConfigurationGuard->assertConfigured();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'otp_code' => Hash::make($code),
            'otp_expires_at' => now()->addMinutes(10),
        ])->save();

        try {
            Mail::raw(
                "Your Pandarawan RTMS verification code is {$code}. It expires in 10 minutes.",
                static function ($message) use ($user): void {
                    $message
                        ->to($user->email)
                        ->subject('Pandarawan RTMS OTP Code');
                }
            );
        } catch (\Throwable $exception) {
            $user->forceFill([
                'otp_code' => null,
                'otp_expires_at' => null,
            ])->save();

            report($exception);

            throw new \RuntimeException($this->mailConfigurationGuard->toUserMessage($exception));
        }
    }
}
