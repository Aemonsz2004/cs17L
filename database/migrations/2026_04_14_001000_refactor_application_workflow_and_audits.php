<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tenants', 'user_id')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('rental_applications', 'payment_pending_at')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->timestamp('payment_pending_at')->nullable()->after('lease_acknowledged_at');
                $table->timestamp('payment_paid_at')->nullable()->after('payment_verified_at');
            });
        }

        $this->backfillTenantUserLinks();
        $this->normalizeApplicationStatuses();
        $this->normalizePaymentStatuses();

        if (! Schema::hasTable('application_logs')) {
            Schema::create('application_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('rental_application_id')->constrained('rental_applications')->cascadeOnDelete();
                $table->string('from_status', 50)->nullable();
                $table->string('to_status', 50)->nullable();
                $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('reason')->nullable();
                $table->json('context')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['rental_application_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('webhook_events')) {
            Schema::create('webhook_events', function (Blueprint $table): void {
                $table->id();
                $table->string('provider', 40)->default('paymongo');
                $table->string('event_id')->unique();
                $table->text('signature')->nullable();
                $table->json('payload');
                $table->enum('status', ['pending', 'processed', 'failed'])->default('pending');
                $table->unsignedInteger('attempts')->default(0);
                $table->text('last_error')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();

                $table->index(['provider', 'status']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('webhook_events')) {
            Schema::drop('webhook_events');
        }

        if (Schema::hasTable('application_logs')) {
            Schema::drop('application_logs');
        }

        if (Schema::hasColumn('rental_applications', 'payment_pending_at')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->dropColumn(['payment_pending_at', 'payment_paid_at']);
            });
        }

        $this->restoreApplicationStatuses();
        $this->restorePaymentStatuses();

        if (Schema::hasColumn('tenants', 'user_id')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('user_id');
            });
        }
    }

    private function backfillTenantUserLinks(): void
    {
        if (! Schema::hasColumn('users', 'tenant_id') || ! Schema::hasColumn('tenants', 'user_id')) {
            return;
        }

        $userTenantRows = DB::table('users')
            ->whereNotNull('tenant_id')
            ->select(['id', 'tenant_id'])
            ->get();

        foreach ($userTenantRows as $row) {
            DB::table('tenants')
                ->where('id', (int) $row->tenant_id)
                ->whereNull('user_id')
                ->update(['user_id' => (int) $row->id]);
        }
    }

    private function normalizeApplicationStatuses(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE rental_applications SET status = 'payment_pending' WHERE status IN ('lease_acknowledged', 'deposit_submitted')");
            DB::statement("UPDATE rental_applications SET status = 'payment_paid' WHERE status = 'deposit_confirmed'");
            DB::statement("ALTER TABLE rental_applications MODIFY status ENUM('pending_review','approved','rejected','lease_sent','payment_pending','payment_paid','converted') DEFAULT 'pending_review'");

            DB::statement('UPDATE rental_applications SET payment_pending_at = COALESCE(payment_pending_at, deposit_submitted_at, lease_acknowledged_at, lease_sent_at)');
            DB::statement('UPDATE rental_applications SET payment_paid_at = COALESCE(payment_paid_at, payment_verified_at, deposit_confirmed_at)');

            return;
        }

        if ($driver === 'sqlite') {
            $this->rebuildRentalApplicationsTableForSqlite(true);
        }
    }

    private function restoreApplicationStatuses(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE rental_applications SET status = 'lease_acknowledged' WHERE status = 'payment_pending'");
            DB::statement("UPDATE rental_applications SET status = 'deposit_confirmed' WHERE status = 'payment_paid'");
            DB::statement("ALTER TABLE rental_applications MODIFY status ENUM('pending_review','approved','rejected','lease_sent','lease_acknowledged','deposit_submitted','deposit_confirmed','converted') DEFAULT 'pending_review'");

            return;
        }

        if ($driver === 'sqlite') {
            $this->rebuildRentalApplicationsTableForSqlite(false);
        }
    }

    private function normalizePaymentStatuses(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE application_payments SET status = 'payment_pending' WHERE status = 'pending'");
            DB::statement("UPDATE application_payments SET status = 'payment_paid' WHERE status = 'payment_verified'");
            DB::statement("ALTER TABLE application_payments MODIFY status ENUM('payment_pending','payment_paid','failed','expired') DEFAULT 'payment_pending'");

            return;
        }

        if ($driver === 'sqlite') {
            $this->rebuildApplicationPaymentsTableForSqlite(true);
        }
    }

    private function restorePaymentStatuses(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE application_payments SET status = 'pending' WHERE status = 'payment_pending'");
            DB::statement("UPDATE application_payments SET status = 'payment_verified' WHERE status = 'payment_paid'");
            DB::statement("ALTER TABLE application_payments MODIFY status ENUM('pending','payment_verified','failed','expired') DEFAULT 'pending'");

            return;
        }

        if ($driver === 'sqlite') {
            $this->rebuildApplicationPaymentsTableForSqlite(false);
        }
    }

    private function rebuildRentalApplicationsTableForSqlite(bool $forward): void
    {
        $tempTable = 'rental_applications_status_refactor_tmp';

        DB::statement('PRAGMA foreign_keys=OFF');

        try {
            if (Schema::hasTable($tempTable)) {
                Schema::drop($tempTable);
            }

            $statuses = $forward
                ? ['pending_review', 'approved', 'rejected', 'lease_sent', 'payment_pending', 'payment_paid', 'converted']
                : ['pending_review', 'approved', 'rejected', 'lease_sent', 'lease_acknowledged', 'deposit_submitted', 'deposit_confirmed', 'converted'];

            Schema::create($tempTable, function (Blueprint $table) use ($statuses): void {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
                $table->string('full_name');
                $table->string('occupation');
                $table->unsignedInteger('monthly_income');
                $table->string('emergency_contact');
                $table->string('government_id_path');
                $table->string('income_proof_path');
                $table->enum('status', $statuses)->default('pending_review');
                $table->timestamp('reserved_at')->nullable();
                $table->timestamp('reservation_expires_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->longText('lease_terms')->nullable();
                $table->timestamp('lease_sent_at')->nullable();
                $table->timestamp('lease_expires_at')->nullable();
                $table->timestamp('lease_acknowledged_at')->nullable();
                $table->timestamp('payment_pending_at')->nullable();
                $table->enum('deposit_method', ['GCash', 'Bank Transfer', 'Maya', 'Card'])->nullable();
                $table->string('deposit_reference')->nullable();
                $table->timestamp('deposit_submitted_at')->nullable();
                $table->timestamp('payment_verified_at')->nullable();
                $table->timestamp('payment_paid_at')->nullable();
                $table->timestamp('deposit_confirmed_at')->nullable();
                $table->timestamp('converted_at')->nullable();
                $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
                $table->foreignId('tenant_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['status', 'created_at']);
                $table->index(['user_id', 'status']);
                $table->index(['status', 'reservation_expires_at']);
            });

            $statusExpression = $forward
                ? "CASE WHEN status IN ('lease_acknowledged','deposit_submitted') THEN 'payment_pending' WHEN status = 'deposit_confirmed' THEN 'payment_paid' ELSE status END"
                : "CASE WHEN status = 'payment_pending' THEN 'lease_acknowledged' WHEN status = 'payment_paid' THEN 'deposit_confirmed' ELSE status END";

            DB::table($tempTable)->insertUsing(
                [
                    'id',
                    'user_id',
                    'unit_id',
                    'full_name',
                    'occupation',
                    'monthly_income',
                    'emergency_contact',
                    'government_id_path',
                    'income_proof_path',
                    'status',
                    'reserved_at',
                    'reservation_expires_at',
                    'rejection_reason',
                    'lease_terms',
                    'lease_sent_at',
                    'lease_expires_at',
                    'lease_acknowledged_at',
                    'payment_pending_at',
                    'deposit_method',
                    'deposit_reference',
                    'deposit_submitted_at',
                    'payment_verified_at',
                    'payment_paid_at',
                    'deposit_confirmed_at',
                    'converted_at',
                    'tenant_id',
                    'tenant_user_id',
                    'admin_id',
                    'created_at',
                    'updated_at',
                ],
                DB::table('rental_applications')->select([
                    'id',
                    'user_id',
                    'unit_id',
                    'full_name',
                    'occupation',
                    'monthly_income',
                    'emergency_contact',
                    'government_id_path',
                    'income_proof_path',
                    DB::raw($statusExpression.' as status'),
                    DB::raw('reserved_at'),
                    DB::raw('reservation_expires_at'),
                    'rejection_reason',
                    'lease_terms',
                    DB::raw('lease_sent_at'),
                    DB::raw('lease_expires_at'),
                    DB::raw('lease_acknowledged_at'),
                    DB::raw('COALESCE(payment_pending_at, deposit_submitted_at, lease_acknowledged_at, lease_sent_at) as payment_pending_at'),
                    'deposit_method',
                    'deposit_reference',
                    'deposit_submitted_at',
                    DB::raw('payment_verified_at'),
                    DB::raw('COALESCE(payment_paid_at, payment_verified_at, deposit_confirmed_at) as payment_paid_at'),
                    'deposit_confirmed_at',
                    DB::raw('converted_at'),
                    'tenant_id',
                    DB::raw('tenant_user_id'),
                    'admin_id',
                    'created_at',
                    'updated_at',
                ])
            );

            Schema::drop('rental_applications');
            Schema::rename($tempTable, 'rental_applications');
        } finally {
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }

    private function rebuildApplicationPaymentsTableForSqlite(bool $forward): void
    {
        $tempTable = 'application_payments_status_refactor_tmp';

        DB::statement('PRAGMA foreign_keys=OFF');

        try {
            if (Schema::hasTable($tempTable)) {
                Schema::drop($tempTable);
            }

            $statuses = $forward
                ? ['payment_pending', 'payment_paid', 'failed', 'expired']
                : ['pending', 'payment_verified', 'failed', 'expired'];

            Schema::create($tempTable, function (Blueprint $table) use ($statuses, $forward): void {
                $table->id();
                $table->foreignId('rental_application_id')->constrained('rental_applications')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('provider', 40)->default('paymongo');
                $table->string('provider_reference')->unique();
                $table->text('checkout_url')->nullable();
                $table->unsignedInteger('amount');
                $table->string('currency', 8)->default('PHP');
                $table->string('payment_method', 40)->nullable();
                $table->enum('status', $statuses)->default($forward ? 'payment_pending' : 'pending');
                $table->json('metadata')->nullable();
                $table->json('webhook_payload')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();

                $table->index(['rental_application_id', 'status']);
                $table->index(['user_id', 'status']);
            });

            $statusExpression = $forward
                ? "CASE WHEN status = 'pending' THEN 'payment_pending' WHEN status = 'payment_verified' THEN 'payment_paid' ELSE status END"
                : "CASE WHEN status = 'payment_pending' THEN 'pending' WHEN status = 'payment_paid' THEN 'payment_verified' ELSE status END";

            DB::table($tempTable)->insertUsing(
                [
                    'id',
                    'rental_application_id',
                    'user_id',
                    'provider',
                    'provider_reference',
                    'checkout_url',
                    'amount',
                    'currency',
                    'payment_method',
                    'status',
                    'metadata',
                    'webhook_payload',
                    'paid_at',
                    'verified_at',
                    'expires_at',
                    'created_at',
                    'updated_at',
                ],
                DB::table('application_payments')->select([
                    'id',
                    'rental_application_id',
                    'user_id',
                    'provider',
                    'provider_reference',
                    'checkout_url',
                    'amount',
                    'currency',
                    'payment_method',
                    DB::raw($statusExpression.' as status'),
                    'metadata',
                    'webhook_payload',
                    'paid_at',
                    'verified_at',
                    'expires_at',
                    'created_at',
                    'updated_at',
                ])
            );

            Schema::drop('application_payments');
            Schema::rename($tempTable, 'application_payments');
        } finally {
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }
};
