<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class TenantPasswordController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('tenant/SetPassword');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user && $user->isTenant(), 403);

        $validated = $request->validate([
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ]);

        $user->forceFill([
            'password' => $validated['password'],
            'must_change_password' => false,
            'otp_code' => null,
            'otp_expires_at' => null,
        ])->save();

        $request->session()->put('tenant_otp_verified', $user->id);

        return redirect()
            ->route('tenant.home')
            ->with('success', 'Password updated successfully.');
    }
}
