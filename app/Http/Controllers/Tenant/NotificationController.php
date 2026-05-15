<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\RtmsNotification;
use App\Support\TenantNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $tenantId = Auth::user()->tenant_id;
        TenantNotificationService::syncUnpaidReminders($tenantId);

        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'notifications',
            'notifications' => RtmsNotification::forTenant($tenantId)->latest()->get(),
            'archivedNotifications' => RtmsNotification::forTenant($tenantId)
                ->onlyTrashed()
                ->latest('deleted_at')
                ->get(),
        ]);
    }

    public function markAllRead(): RedirectResponse
    {
        RtmsNotification::forTenant(Auth::user()->tenant_id)
            ->where('unread', true)
            ->update(['unread' => false]);

        return redirect()->route('tenant.notifications.index')->with('success', 'Notifications marked as read.');
    }

    public function markRead(RtmsNotification $notification): RedirectResponse
    {
        abort_unless($notification->tenant_id === Auth::user()->tenant_id, 403);

        $notification->update(['unread' => false]);

        return redirect()->route('tenant.notifications.index')->with('success', 'Notification marked as read.');
    }

    public function destroy(RtmsNotification $notification): RedirectResponse
    {
        abort_unless($notification->tenant_id === Auth::user()->tenant_id, 403);

        $notification->delete();

        return redirect()->route('tenant.notifications.index')->with('success', 'Notification archived.');
    }

    public function restore(int $notificationId): RedirectResponse
    {
        $tenantId = Auth::user()->tenant_id;
        $notification = RtmsNotification::withTrashed()
            ->where('tenant_id', $tenantId)
            ->findOrFail($notificationId);

        if (! $notification->trashed()) {
            return redirect()->route('tenant.notifications.index')->with('success', 'Notification is already active.');
        }

        $notification->restore();

        return redirect()->route('tenant.notifications.index')->with('success', 'Notification restored.');
    }
}
