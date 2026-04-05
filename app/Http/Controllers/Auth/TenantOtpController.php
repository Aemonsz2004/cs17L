<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\TenantOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TenantOtpController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->isTenant(), 403);

        return Inertia::render('tenant/OtpChallenge', [
            'email' => $user->email,
            'expiresAt' => optional($user->otp_expires_at)?->toIso8601String(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user && $user->isTenant(), 403);

        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        if (! $user->otp_code || ! $user->otp_expires_at || now()->gt($user->otp_expires_at)) {
            $user->forceFill([
                'otp_code' => null,
                'otp_expires_at' => null,
            ])->save();

            throw ValidationException::withMessages([
                'otp' => 'Your OTP has expired. Request a new code.',
            ]);
        }

        if (! Hash::check($validated['otp'], $user->otp_code)) {
            throw ValidationException::withMessages([
                'otp' => 'Invalid OTP. Please check the code and try again.',
            ]);
        }

        $user->forceFill([
            'otp_code' => null,
            'otp_expires_at' => null,
        ])->save();

        $request->session()->put('tenant_otp_verified', $user->id);

        return redirect()
            ->route('tenant.home')
            ->with('success', 'OTP verified. Welcome back.');
    }

    public function resend(Request $request, TenantOtpService $tenantOtpService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user && $user->isTenant(), 403);

        try {
            $tenantOtpService->issue($user);
        } catch (\RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'A new OTP code was sent to your email.');
    }
}
