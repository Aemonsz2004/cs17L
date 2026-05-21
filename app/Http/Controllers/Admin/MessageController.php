<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\RtmsNotification;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'initialPage' => 'messages',
            'messages' => Message::with([
                'tenant:id,name',
                'tenant.units',
            ])->latest()->get(),
        ]);
    }

    public function reply(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'text' => ['required', 'string'],
        ]);

        Message::create([
            'tenant_id' => $data['tenant_id'],
            'from' => 'admin',
            'text' => $data['text'],
            'read' => false,
        ]);

        $tenant = Tenant::find($data['tenant_id']);

        RtmsNotification::create([
            'variant' => 'teal',
            'category' => 'system',
            'message' => sprintf('New message from admin for %s.', $tenant?->name ?? 'your account'),
            'tenant_id' => $data['tenant_id'],
            'unread' => true,
        ]);

        return redirect()->route('admin.messages.index')->with('success', 'Reply sent.');
    }

    public function markRead(Message $message): RedirectResponse
    {
        $message->update(['read' => true]);

        return redirect()->route('admin.messages.index');
    }
}
