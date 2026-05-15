<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RtmsNotification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'notifications',
            'notifications' => RtmsNotification::admin()->latest()->get(),
            'archivedNotifications' => RtmsNotification::admin()->onlyTrashed()->latest('deleted_at')->get(),
        ]);
    }

    public function markAllRead(): RedirectResponse
    {
        RtmsNotification::admin()->where('unread', true)->update(['unread' => false]);

        return redirect()->route('admin.notifications.index')->with('success', 'Notifications marked as read.');
    }

    public function markRead(RtmsNotification $notification): RedirectResponse
    {
        $notification->update(['unread' => false]);

        return redirect()->route('admin.notifications.index')->with('success', 'Notification marked as read.');
    }

    public function destroy(RtmsNotification $notification): RedirectResponse
    {
        $notification->delete();

        return redirect()->route('admin.notifications.index')->with('success', 'Notification archived.');
    }

    public function restore(int $notificationId): RedirectResponse
    {
        $notification = RtmsNotification::withTrashed()->findOrFail($notificationId);

        if (! $notification->trashed()) {
            return redirect()->route('admin.notifications.index')->with('success', 'Notification is already active.');
        }

        $notification->restore();

        return redirect()->route('admin.notifications.index')->with('success', 'Notification restored.');
    }
}
