<?php

// app/Http/Middleware/TenantMiddleware.php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Only allow authenticated users whose role === 'tenant'.
     * Admins are redirected to the admin dashboard.
     *
     * Also enforces that the authenticated tenant can only
     * access routes scoped to their own tenant_id.
     *
     * Login security flow:
     * 1) Newly created tenant must set a new password first.
     * 2) After password setup, tenant must verify OTP per login session.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        if ($request->user()->isApplicant()) {
            return redirect()->route('applicant.dashboard');
        }

        if (! $request->user()->isTenant()) {
            abort(403, 'Access denied.');
        }

        $isPasswordRoute = $request->routeIs('tenant.password.create', 'tenant.password.store');
        $isOtpRoute = $request->routeIs('tenant.otp.show', 'tenant.otp.verify', 'tenant.otp.resend');

        if ($request->user()->must_change_password) {
            if (! $isPasswordRoute) {
                return redirect()->route('tenant.password.create');
            }

            return $next($request);
        }

        $isOtpVerified = (int) $request->session()->get('tenant_otp_verified') === (int) $request->user()->id;

        if (! $isOtpVerified && ! $isOtpRoute) {
            return redirect()->route('tenant.otp.show');
        }

        if ($isOtpVerified && $isOtpRoute) {
            return redirect()->route('tenant.home');
        }

        // Ownership check — if a route has a {tenant} parameter,
        // make sure the authenticated user owns that tenant record.
        if ($request->route('tenant')) {
            $routeTenantId = $request->route('tenant') instanceof Tenant
                ? $request->route('tenant')->id
                : (int) $request->route('tenant');

            if ($request->user()->tenant_id !== $routeTenantId) {
                abort(403, 'You can only access your own data.');
            }
        }

        return $next($request);
    }
}
