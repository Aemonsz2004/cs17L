<?php

namespace App\Jobs;

use App\Models\WebhookEvent;
use App\Support\ApplicationPaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessPayMongoWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public array $backoff = [10, 30, 60, 120, 300];

    public function __construct(private readonly int $webhookEventId) {}

    public function handle(ApplicationPaymentService $paymentService): void
    {
        $event = WebhookEvent::whereKey($this->webhookEventId)->lockForUpdate()->first();

        if (! $event || $event->isProcessed()) {
            return;
        }

        $event->attempts++;
        $event->save();

        try {
            $paymentService->handleWebhookPayload((array) $event->payload, $event->event_id);

            $event->update([
                'status' => 'processed',
                'processed_at' => now(),
                'last_error' => null,
            ]);
        } catch (Throwable $exception) {
            $event->update([
                'status' => 'failed',
                'last_error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        if (! $exception) {
            return;
        }

        WebhookEvent::whereKey($this->webhookEventId)->update([
            'status' => 'failed',
            'last_error' => $exception->getMessage(),
        ]);
    }
}
