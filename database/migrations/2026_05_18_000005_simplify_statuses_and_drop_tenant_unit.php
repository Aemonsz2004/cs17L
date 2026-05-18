<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop indexes that reference status column before altering it
        // SQLite requires this before ALTER TABLE DROP COLUMN
        $this->dropIndexSafely('leases_tenant_id_status_index');
        $this->dropIndexSafely('leases_unit_id_status_index');

        // Simplify units.status: remove expiring, overdue, available, archived
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_new', [
                'occupied', 'vacant', 'maintenance', 'pending', 'reserved',
            ])->default('vacant')->after('status');
        });

        DB::statement("UPDATE units SET status_new = 'vacant' WHERE status IN ('available', 'archived')");
        DB::statement("UPDATE units SET status_new = status WHERE status IN ('occupied', 'vacant', 'maintenance', 'pending', 'reserved')");

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Simplify tenants.status: remove expiring, overdue
        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('status_new', [
                'active', 'pending_payment', 'moved_out', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement("UPDATE tenants SET status_new = 'active' WHERE status IN ('expiring', 'overdue')");
        DB::statement("UPDATE tenants SET status_new = status WHERE status IN ('active', 'pending_payment', 'moved_out', 'terminated')");

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Simplify leases.status: remove expiring, overdue, terminated
        Schema::table('leases', function (Blueprint $table) {
            $table->enum('status_new', [
                'pending', 'active', 'ended', 'expired',
            ])->default('active')->after('status');
        });

        DB::statement("UPDATE leases SET status_new = 'active' WHERE status IN ('expiring', 'overdue')");
        DB::statement("UPDATE leases SET status_new = 'ended' WHERE status = 'terminated'");
        DB::statement("UPDATE leases SET status_new = status WHERE status IN ('pending', 'active', 'ended', 'expired')");

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });

        // Recreate indexes on leases
        Schema::table('leases', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
            $table->index(['unit_id', 'status']);
        });

        // Drop tenants.unit column — multi-unit via units.tenant_id
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('unit');
        });
    }

    public function down(): void
    {
        // Drop indexes before altering columns
        $this->dropIndexSafely('leases_tenant_id_status_index');
        $this->dropIndexSafely('leases_unit_id_status_index');

        // Restore tenants.unit
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('unit', 10)->nullable()->after('email');
        });

        // Restore leases status
        Schema::table('leases', function (Blueprint $table) {
            $table->enum('status_old', [
                'pending', 'active', 'expiring', 'overdue', 'ended', 'expired', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE leases SET status_old = status');

        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('leases', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        // Restore tenants status
        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('status_old', [
                'active', 'expiring', 'overdue', 'pending_payment', 'moved_out', 'terminated',
            ])->default('active')->after('status');
        });

        DB::statement('UPDATE tenants SET status_old = status');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });

        // Restore units status
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_old', [
                'occupied', 'vacant', 'expiring', 'overdue', 'maintenance',
                'pending', 'reserved', 'available', 'archived',
            ])->default('vacant')->after('status');
        });

        DB::statement('UPDATE units SET status_old = status');

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('units', function (Blueprint $table) {
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
                // Index may not exist — that's ok
            }
        }
    }
};
