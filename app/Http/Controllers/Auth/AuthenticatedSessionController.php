<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\TenantOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /** GET /login */
    public function create(): Response
    {
        return Inertia::render('Login');
    }

    /**
     * POST /login
     * Redirects admin -> /admin/dashboard.
     * Tenants are intercepted for password setup and OTP verification.
     */
    public function store(Request $request, TenantOtpService $tenantOtpService): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();
        $request->session()->forget('tenant_otp_verified');

        $user = Auth::user();

        if (! $user instanceof User) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($user->isAdmin()) {
            return redirect()->intended(route('admin.dashboard'));
        }

        if ($user->isApplicant()) {
            return redirect()->intended(route('applicant.dashboard'));
        }

        if ($user->must_change_password) {
            return redirect()
                ->route('tenant.password.create')
                ->with('success', 'Please set your new password to continue.');
        }

        try {
            $tenantOtpService->issue($user);
        } catch (\RuntimeException $exception) {
            return redirect()
                ->route('tenant.otp.show')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('tenant.otp.show')
            ->with('success', 'A 6-digit OTP was sent to your email.');
    }

    /** POST /logout */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
