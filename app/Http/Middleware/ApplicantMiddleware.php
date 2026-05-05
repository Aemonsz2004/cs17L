<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplicantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if (! $request->user()->isApplicant()) {
            if ($request->user()->isAdmin()) {
                return redirect()->route('admin.dashboard');
            }

            if ($request->user()->isTenant()) {
                return redirect()->route('tenant.home');
            }

            abort(403, 'Access denied.');
        }

        return $next($request);
    }
}
