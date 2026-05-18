<?php

namespace App\Http\Middleware;

use App\Models\RtmsNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared with every Inertia response.
     *
     * Available everywhere via usePage<SharedProps>().props
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [

            // Authenticated user — available as $page.props.auth.user
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'tenant_id' => $request->user()->tenant_id,
                ] : null,
            ],

            // Flash messages from redirect()->with('success', '...') or with('error', '...')
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'tenant_credentials' => fn () => $request->session()->get('tenant_credentials'),
            ],

            // Unread notification count — drives the red dot on the bell icon
            'unread_count' => function () use ($request) {
                if (! $request->user()) {
                    return 0;
                }

                if ($request->user()->isAdmin()) {
                    return RtmsNotification::admin()
                        ->where('unread', true)
                        ->count();
                }

                if ($request->user()->tenant_id) {
                    return RtmsNotification::forTenant($request->user()->tenant_id)
                        ->where('unread', true)
                        ->count();
                }

                return 0;
            },
        ]);
    }
}
