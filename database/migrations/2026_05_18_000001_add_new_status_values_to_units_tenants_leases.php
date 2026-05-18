<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop indexes referencing status before altering the column
        $this->dropIndexSafely('leases_tenant_id_status_index');
        $this->dropIndexSafely('leases_unit_id_status_index');

        // Add new status values to units (reserved, available, archived)
        // Using a temp column approach for SQLite compatibility
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_new', [
                'occupied', 'vacant', 'expiring', 'overdue', 'maintenance',
                'pending', 'reserved', 'available', 'archived',
            ])->default('vacant')->after('status');
        });

        DB::statement('UPDATE units SET status_new = status');

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Add new status values to tenants (pending_payment, moved_out, terminated)
        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('status_new', [
                'active', 'expiring', 'overdue', 'pending_payment', 'moved_out', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE tenants SET status_new = status');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Add new status values to leases (pending, expired, and keep existing)
        Schema::table('leases', function (Blueprint $table) {
            $table->enum('status_new', [
                'pending', 'active', 'expiring', 'overdue', 'ended', 'expired', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE leases SET status_new = status');

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Recreate indexes
        Schema::table('leases', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
            $table->index(['unit_id', 'status']);
        });
    }

    public function down(): void
    {
        // Revert units status
        $this->dropIndexSafely('leases_tenant_id_status_index');
        $this->dropIndexSafely('leases_unit_id_status_index');
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_old', [
                'occupied', 'vacant', 'expiring', 'overdue',
            ])->default('vacant')->after('status');
        });

        DB::statement('UPDATE units SET status_old = status WHERE status IN (\'occupied\', \'vacant\', \'expiring\', \'overdue\')');

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        // Revert tenants status
        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('status_old', [
                'active', 'expiring', 'overdue',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE tenants SET status_old = status WHERE status IN (\'active\', \'expiring\', \'overdue\')');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        // Revert leases status
        Schema::table('leases', function (Blueprint $table) {
            $table->enum('status_old', [
                'active', 'expiring', 'overdue', 'ended', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE leases SET status_old = status WHERE status IN (\'active\', \'expiring\', \'overdue\', \'ended\', \'terminated\')');

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        // Recreate indexes
        Schema::table('leases', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
            $table->index(['unit_id', 'status']);
        });
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
