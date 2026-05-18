<?php

// app/Http/Middleware/AdminMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Only allow authenticated users whose role === 'admin'.
     * All other users are redirected to their appropriate dashboard.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if (! $request->user()->isAdmin()) {
            if ($request->user()->isApplicant()) {
                return redirect()
                    ->route('applicant.dashboard')
                    ->with('error', 'You do not have admin access.');
            }

            // Tenants get bounced to their own dashboard
            return redirect()
                ->route('tenant.home')
                ->with('error', 'You do not have admin access.');
        }

        return $next($request);
    }
}
