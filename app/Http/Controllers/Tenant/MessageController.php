<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\RtmsNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('tenant/TenantApp', [
            'initialPage' => 'messages',
            'messages' => Message::where('tenant_id', auth()->user()->tenant_id)
                ->orderBy('created_at')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string'],
        ]);

        Message::create([
            'tenant_id' => $request->user()->tenant_id,
            'from' => 'tenant',
            'text' => $data['text'],
            'read' => false,
        ]);

        RtmsNotification::create([
            'variant' => 'amber',
            'category' => 'system',
            'message' => 'New tenant message received. Open Messages for details.',
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()->route('tenant.messages')->with('success', 'Message sent.');
    }
}
