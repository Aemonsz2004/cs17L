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
}
