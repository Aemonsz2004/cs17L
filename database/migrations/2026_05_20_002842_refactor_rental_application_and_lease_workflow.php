<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Rental Applications ──
        // Drop all indexes referencing status before altering column.
        // Index names may come from prior temp-table recreations.
        $indexes = collect(DB::select("PRAGMA index_list('rental_applications')"))
            ->pluck('name')
            ->filter(fn ($name) => str_contains((string) $name, 'status'))
            ->each(fn ($name) => DB::statement('DROP INDEX IF EXISTS "'.$name.'"'));

        // Add new fields: preferred_move_in, lease_duration, payment_method, applicant_notes
        Schema::table('rental_applications', function (Blueprint $table) {
            $table->date('preferred_move_in')->nullable()->after('income_proof_path');
            $table->unsignedTinyInteger('lease_duration')->nullable()->after('preferred_move_in');
            $table->string('payment_method', 50)->nullable()->after('lease_duration');
            $table->text('applicant_notes')->nullable()->after('payment_method');
            $table->timestamp('move_in_confirmed_at')->nullable()->after('converted_at');
        });

        // Simplify statuses via temp column
        Schema::table('rental_applications', function (Blueprint $table) {
            $table->string('status_new', 30)->default('pending')->after('status');
        });

        DB::statement("UPDATE rental_applications SET status_new = 'pending' WHERE status IN ('pending_review', 'lease_sent', 'payment_pending', 'payment_paid')");
        DB::statement("UPDATE rental_applications SET status_new = 'approved' WHERE status = 'approved'");
        DB::statement("UPDATE rental_applications SET status_new = 'rejected' WHERE status = 'rejected'");
        DB::statement("UPDATE rental_applications SET status_new = 'converted' WHERE status = 'converted'");

        Schema::table('rental_applications', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('rental_applications', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Recreate index on new status column
        Schema::table('rental_applications', function (Blueprint $table) {
            $table->index(['status'], 'rental_applications_status_index');
        });

        // ── Leases ──
        // Drop all indexes referencing status before altering column
        $this->dropStatusIndexes('leases');

        // Add renewed status: pending, active, expired, terminated, renewed
        Schema::table('leases', function (Blueprint $table) {
            $table->string('status_new', 20)->default('pending')->after('status');
        });

        DB::statement("UPDATE leases SET status_new = status WHERE status IN ('pending', 'active', 'expired')");
        DB::statement("UPDATE leases SET status_new = 'terminated' WHERE status = 'ended'");
        DB::statement("UPDATE leases SET status_new = 'terminated' WHERE status = 'terminated'");

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Recreate indexes on new status column
        Schema::table('leases', function (Blueprint $table) {
            $table->index(['tenant_id', 'status'], 'leases_tenant_id_status_index');
            $table->index(['unit_id', 'status'], 'leases_unit_id_status_index');
        });
    }

    public function down(): void
    {
        // Revert leases status
        $this->dropStatusIndexes('leases');

        Schema::table('leases', function (Blueprint $table) {
            $table->string('status_old', 20)->default('active')->after('status');
        });

        DB::statement('UPDATE leases SET status_old = status');
        DB::statement("UPDATE leases SET status_old = 'ended' WHERE status = 'terminated'");
        DB::statement("UPDATE leases SET status_old = 'ended' WHERE status = 'renewed'");

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->index(['tenant_id', 'status'], 'leases_tenant_id_status_index');
            $table->index(['unit_id', 'status'], 'leases_unit_id_status_index');
        });

        // Revert rental_applications
        Schema::table('rental_applications', function (Blueprint $table) {
            $table->dropColumn(['preferred_move_in', 'lease_duration', 'payment_method', 'applicant_notes', 'move_in_confirmed_at']);
        });

        $this->dropStatusIndexes('rental_applications');

        Schema::table('rental_applications', function (Blueprint $table) {
            $table->string('status_old', 30)->default('pending_review')->after('status');
        });

        DB::statement("UPDATE rental_applications SET status_old = 'pending_review' WHERE status = 'pending'");
        DB::statement("UPDATE rental_applications SET status_old = status WHERE status IN ('approved', 'rejected', 'converted')");

        Schema::table('rental_applications', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        Schema::table('rental_applications', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });
    }

    private function dropStatusIndexes(string $table): void
    {
        collect(DB::select("PRAGMA index_list('{$table}')"))
            ->pluck('name')
            ->filter(fn ($name) => str_contains((string) $name, 'status'))
            ->each(fn ($name) => DB::statement('DROP INDEX IF EXISTS "'.$name.'"'));
    }

    private function dropIndexSafely(string $indexName): void
    {
        $prefix = DB::getTablePrefix();
        $name = str_replace('__', '_', $prefix.$indexName);

        try {
            DB::statement('DROP INDEX IF EXISTS "'.$name.'"');
        } catch (Throwable) {
            try {
                DB::statement('DROP INDEX "'.$name.'"');
            } catch (Throwable) {
                // Index may not exist
            }
        }
    }
};
