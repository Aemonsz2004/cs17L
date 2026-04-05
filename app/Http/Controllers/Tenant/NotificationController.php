<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\RtmsNotification;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;
        TenantNotificationService::syncUnpaidReminders($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'notifications',
            'notifications' => RtmsNotification::forTenant($tenantId)->latest()->get(),
        ]);
    }

    public function markAllRead(): RedirectResponse
    {
        RtmsNotification::forTenant(auth()->user()->tenant_id)
            ->where('unread', true)
            ->update(['unread' => false]);

        return redirect()->route('tenant.notifications.index')->with('success', 'Notifications marked as read.');
    }

    public function markRead(RtmsNotification $notification): RedirectResponse
    {
        abort_unless($notification->tenant_id === auth()->user()->tenant_id, 403);

        $notification->update(['unread' => false]);

        return redirect()->route('tenant.notifications.index')->with('success', 'Notification marked as read.');
    }
}
