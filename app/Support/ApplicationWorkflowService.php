<?php

namespace App\Support;

use App\Events\LeaseAcceptedEvent;
use App\Events\TenantCreatedEvent;
use App\Models\ApplicationPayment;
use App\Models\RentalApplication;
use App\Models\Unit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ApplicationWorkflowService
{
    private const TRANSITIONS = [
        RentalApplication::STATUS_PENDING_REVIEW => [
            RentalApplication::STATUS_APPROVED,
            RentalApplication::STATUS_REJECTED,
        ],
        RentalApplication::STATUS_APPROVED => [
            RentalApplication::STATUS_LEASE_SENT,
            RentalApplication::STATUS_REJECTED,
        ],
        RentalApplication::STATUS_LEASE_SENT => [
            RentalApplication::STATUS_PAYMENT_PENDING,
            RentalApplication::STATUS_REJECTED,
        ],
        RentalApplication::STATUS_PAYMENT_PENDING => [
            RentalApplication::STATUS_PAYMENT_PAID,
            RentalApplication::STATUS_REJECTED,
            RentalApplication::STATUS_CONVERTED,
        ],
        RentalApplication::STATUS_PAYMENT_PAID => [
            RentalApplication::STATUS_CONVERTED,
            RentalApplication::STATUS_REJECTED,
        ],
    ];

    public function __construct(
        private readonly TenantService $tenantService,
        private readonly LeaseService $leaseService,
        private readonly ApplicationAuditService $audit,
    ) {
    }

    public function approve(RentalApplication $application, ?int $adminId): void
    {
        if ($application->status !== RentalApplication::STATUS_PENDING_REVIEW) {
            throw new \RuntimeException('Only pending applications can be approved.');
        }

        DB::transaction(function () use ($application, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            $unit = Unit::whereKey($application->unit_id)->lockForUpdate()->firstOrFail();

            if ($unit->tenant_id !== null || $unit->status !== 'vacant') {
                throw new \RuntimeException('Selected unit is no longer available for reservation.');
            }

            $reservationExpiresAt = now()->addHours((int) config('services.applications.reservation_hours', 48));

            $this->transition(
                $application,
                RentalApplication::STATUS_APPROVED,
                $adminId,
                'Application approved.',
                [
                    'admin_id' => $adminId,
                    'rejection_reason' => null,
                    'reserved_at' => now(),
                    'reservation_expires_at' => $reservationExpiresAt,
                ],
            );

            $unit->update([
                'status' => 'reserved',
                'reserved_until' => $reservationExpiresAt,
            ]);
        });
    }

    public function reject(RentalApplication $application, string $reason, ?int $adminId): void
    {
        if (! in_array($application->status, [
            RentalApplication::STATUS_PENDING_REVIEW,
            RentalApplication::STATUS_APPROVED,
            RentalApplication::STATUS_LEASE_SENT,
            RentalApplication::STATUS_PAYMENT_PENDING,
            RentalApplication::STATUS_PAYMENT_PAID,
        ], true)) {
            throw new \RuntimeException('This application can no longer be rejected.');
        }

        DB::transaction(function () use ($application, $reason, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            $this->transition(
                $application,
                RentalApplication::STATUS_REJECTED,
                $adminId,
                $reason,
                [
                    'rejection_reason' => $reason,
                    'admin_id' => $adminId,
                ],
            );

            $this->releaseReservation((int) $application->unit_id);
        });
    }

    public function sendLease(RentalApplication $application, string $terms, ?int $adminId, ?string $leaseAttachmentPath = null): void
    {
        if ($application->status !== RentalApplication::STATUS_APPROVED) {
            throw new \RuntimeException('Lease can only be sent after approval.');
        }

        DB::transaction(function () use ($application, $terms, $adminId, $leaseAttachmentPath): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->reservation_expires_at && now()->greaterThan($application->reservation_expires_at)) {
                $this->transition(
                    $application,
                    RentalApplication::STATUS_REJECTED,
                    $adminId,
                    'Reservation window expired before lease was sent.',
                    [
                        'rejection_reason' => 'Reservation window expired before lease was sent.',
                        'admin_id' => $adminId,
                    ],
                );

                $this->releaseReservation((int) $application->unit_id);

                throw new \RuntimeException('Reservation expired before lease could be sent.');
            }

            $leaseExpiresAt = $this->leaseService->leaseResponseDeadline();

            $this->transition(
                $application,
                RentalApplication::STATUS_LEASE_SENT,
                $adminId,
                'Lease terms sent to applicant.',
                [
                    'lease_terms' => $terms,
                    'lease_attachment_path' => $leaseAttachmentPath,
                    'lease_sent_at' => now(),
                    'lease_expires_at' => $leaseExpiresAt,
                    'rejection_reason' => null,
                    'admin_id' => $adminId,
                ],
            );

            Unit::whereKey($application->unit_id)
                ->whereNull('tenant_id')
                ->update([
                    'status' => 'reserved',
                    'reserved_until' => $leaseExpiresAt,
                ]);
        });
    }

    public function acknowledgeLease(RentalApplication $application): void
    {
        if ($application->status !== RentalApplication::STATUS_LEASE_SENT) {
            throw new \RuntimeException('Lease cannot be acknowledged at this stage.');
        }

        DB::transaction(function () use ($application): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->lease_expires_at && now()->greaterThan($application->lease_expires_at)) {
                throw new \RuntimeException('Lease acknowledgment window already expired.');
            }

            $paymentWindow = $this->leaseService->paymentWindowDeadline();

            $this->transition(
                $application,
                RentalApplication::STATUS_PAYMENT_PENDING,
                (int) $application->user_id,
                'Applicant accepted lease terms.',
                [
                    'lease_acknowledged_at' => now(),
                    'payment_pending_at' => now(),
                    'reservation_expires_at' => $paymentWindow,
                ],
            );

            Unit::whereKey($application->unit_id)
                ->whereNull('tenant_id')
                ->update([
                    'status' => 'reserved',
                    'reserved_until' => $paymentWindow,
                ]);

            event(new LeaseAcceptedEvent((int) $application->id, (int) $application->user_id));
        });
    }

    public function confirmDeposit(RentalApplication $application, ?int $adminId): void
    {
        DB::transaction(function () use ($application, $adminId): void {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->status === RentalApplication::STATUS_CONVERTED) {
                return;
            }

            if (! in_array($application->status, [RentalApplication::STATUS_PAYMENT_PENDING, RentalApplication::STATUS_PAYMENT_PAID], true)) {
                throw new \RuntimeException('Application is not in a payment stage.');
            }

            if (! $application->payment_verified_at) {
                $application->payment_verified_at = now();
            }

            if ($application->status === RentalApplication::STATUS_PAYMENT_PENDING) {
                $this->transition(
                    $application,
                    RentalApplication::STATUS_PAYMENT_PAID,
                    $adminId,
                    'Admin override: payment manually confirmed.',
                    [
                        'payment_paid_at' => now(),
                        'deposit_confirmed_at' => now(),
                        'admin_id' => $adminId,
                    ],
                );
            }

            $this->autoConvertLocked($application, $adminId, 'admin_override');
        });
    }

    public function convertToTenant(RentalApplication $application, array $data): array
    {
        return DB::transaction(function () use ($application, $data): array {
            $application = RentalApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($application->status !== RentalApplication::STATUS_PAYMENT_PAID) {
                throw new \RuntimeException('Only payment-paid applications can be manually converted.');
            }

            return $this->autoConvertLocked($application, $data['admin_id'] ?? null, 'admin_manual_convert', $data);
        });
    }

    public function autoConvertAfterPaymentVerified(int $applicationId, ?string $reason = null): void
    {
        DB::transaction(function () use ($applicationId, $reason): void {
            $application = RentalApplication::whereKey($applicationId)->lockForUpdate()->first();

            if (! $application || $application->status === RentalApplication::STATUS_CONVERTED) {
                return;
            }

            if (! in_array($application->status, [RentalApplication::STATUS_PAYMENT_PENDING, RentalApplication::STATUS_PAYMENT_PAID], true)) {
                return;
            }

            if (! $application->payment_verified_at) {
                $application->payment_verified_at = now();
            }

            if ($application->status === RentalApplication::STATUS_PAYMENT_PENDING) {
                $this->transition(
                    $application,
                    RentalApplication::STATUS_PAYMENT_PAID,
                    null,
                    'Payment webhook verified.',
                    [
                        'payment_paid_at' => now(),
                        'deposit_confirmed_at' => now(),
                    ],
                );
            }

            $this->autoConvertLocked($application, null, $reason ?? 'webhook_auto_convert');
        });
    }

    public function expirePendingOnboarding(): int
    {
        $now = now();

        $applications = RentalApplication::with('latestPayment')
            ->whereIn('status', [
                RentalApplication::STATUS_APPROVED,
                RentalApplication::STATUS_LEASE_SENT,
                RentalApplication::STATUS_PAYMENT_PENDING,
            ])
            ->get();

        $expired = 0;

        foreach ($applications as $application) {
            DB::transaction(function () use ($application, $now, &$expired): void {
                $locked = RentalApplication::with('latestPayment')
                    ->whereKey($application->id)
                    ->lockForUpdate()
                    ->first();

                if (! $locked) {
                    return;
                }

                if (! in_array($locked->status, [
                    RentalApplication::STATUS_APPROVED,
                    RentalApplication::STATUS_LEASE_SENT,
                    RentalApplication::STATUS_PAYMENT_PENDING,
                ], true)) {
                    return;
                }

                $shouldExpire = false;
                $reason = 'Application expired due to incomplete workflow window.';

                if ($locked->status === RentalApplication::STATUS_LEASE_SENT
                    && $locked->lease_expires_at
                    && $now->greaterThan($locked->lease_expires_at)) {
                    $shouldExpire = true;
                    $reason = 'Lease response window expired.';
                }

                if (! $shouldExpire
                    && $locked->reservation_expires_at
                    && $now->greaterThan($locked->reservation_expires_at)) {
                    $shouldExpire = true;
                    $reason = 'Reservation/payment window expired.';
                }

                $latestPayment = $locked->latestPayment;
                if (! $shouldExpire
                    && $locked->status === RentalApplication::STATUS_PAYMENT_PENDING
                    && $latestPayment
                    && in_array($latestPayment->status, ['failed', 'expired'], true)) {
                    $shouldExpire = true;
                    $reason = 'Payment was marked as failed/expired.';
                }

                if (! $shouldExpire
                    && $locked->status === RentalApplication::STATUS_PAYMENT_PENDING
                    && $latestPayment
                    && $latestPayment->status === 'payment_pending'
                    && $latestPayment->expires_at
                    && $now->greaterThan($latestPayment->expires_at)) {
                    $latestPayment->update(['status' => 'expired']);
                    $shouldExpire = true;
                    $reason = 'Payment checkout expired before completion.';
                }

                if (! $shouldExpire) {
                    return;
                }

                $this->transition(
                    $locked,
                    RentalApplication::STATUS_REJECTED,
                    null,
                    $reason,
                    ['rejection_reason' => $reason],
                );

                $this->releaseReservation((int) $locked->unit_id);
                $expired++;
            });
        }

        return $expired;
    }

    private function autoConvertLocked(
        RentalApplication $application,
        ?int $actorId,
        string $reason,
        array $leaseData = []
    ): array {
        if ($application->status === RentalApplication::STATUS_CONVERTED) {
            return [
                'name' => $application->user?->name,
                'email' => $application->user?->email,
                'auto_converted' => true,
            ];
        }

        $latestPayment = ApplicationPayment::where('rental_application_id', $application->id)
            ->latest('id')
            ->lockForUpdate()
            ->first();

        $paymentMethod = $leaseData['payment_method']
            ?? $latestPayment?->payment_method
            ?? 'GCash';

        $start = isset($leaseData['start_date'])
            ? Carbon::parse($leaseData['start_date'])->startOfDay()
            : $this->leaseService->defaultLeaseStart();

        $end = isset($leaseData['end_date'])
            ? Carbon::parse($leaseData['end_date'])->startOfDay()
            : $this->leaseService->defaultLeaseEnd($start);

        $tenant = $this->tenantService->createFromApplication($application, $paymentMethod, [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
        ]);

        $this->transition(
            $application,
            RentalApplication::STATUS_CONVERTED,
            $actorId,
            $reason,
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $application->user_id,
                'converted_at' => now(),
                'admin_id' => $actorId,
            ],
        );

        event(new TenantCreatedEvent((int) $application->id, (int) $tenant->id, (int) $application->user_id));

        return [
            'name' => $application->full_name,
            'email' => (string) $application->user?->email,
            'auto_converted' => true,
        ];
    }

    private function transition(
        RentalApplication $application,
        string $toStatus,
        ?int $actorUserId,
        ?string $reason = null,
        array $extra = []
    ): void {
        $fromStatus = (string) $application->status;

        if ($fromStatus !== $toStatus) {
            $allowed = self::TRANSITIONS[$fromStatus] ?? [];
            if (! in_array($toStatus, $allowed, true)) {
                throw new \RuntimeException("Invalid transition: {$fromStatus} -> {$toStatus}");
            }
        }

        $application->fill(array_merge($extra, ['status' => $toStatus]));
        $application->save();

        $this->audit->logStatusTransition(
            $application,
            $fromStatus,
            $toStatus,
            $actorUserId,
            $reason,
            [
                'application_id' => $application->id,
                'unit_id' => $application->unit_id,
            ],
        );
    }

    private function releaseReservation(int $unitId): void
    {
        $unit = Unit::whereKey($unitId)->lockForUpdate()->first();

        if (! $unit) {
            return;
        }

        if ($unit->tenant_id === null && $unit->status === 'reserved') {
            $unit->update([
                'status' => 'vacant',
                'reserved_until' => null,
            ]);
        }
    }
}
