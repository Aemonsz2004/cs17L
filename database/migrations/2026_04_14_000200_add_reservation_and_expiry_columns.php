<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_applications', function (Blueprint $table): void {
            $table->timestamp('reserved_at')->nullable()->after('status');
            $table->timestamp('reservation_expires_at')->nullable()->after('reserved_at');
            $table->timestamp('lease_sent_at')->nullable()->after('lease_terms');
            $table->timestamp('lease_expires_at')->nullable()->after('lease_sent_at');
            $table->timestamp('payment_verified_at')->nullable()->after('deposit_submitted_at');
            $table->timestamp('converted_at')->nullable()->after('deposit_confirmed_at');
            $table->foreignId('tenant_user_id')->nullable()->after('tenant_id')->constrained('users')->nullOnDelete();
            $table->index(['status', 'reservation_expires_at']);
        });

        Schema::table('units', function (Blueprint $table): void {
            $table->timestamp('reserved_until')->nullable()->after('tenant_id');
        });

        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE units MODIFY status ENUM('occupied','vacant','reserved','expiring','overdue') DEFAULT 'vacant'");
        }

        if ($driver === 'sqlite') {
            $this->rebuildUnitsTable([
                'occupied', 'vacant', 'reserved', 'expiring', 'overdue',
            ]);
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE units SET status = 'vacant' WHERE status = 'reserved'");
            DB::statement("ALTER TABLE units MODIFY status ENUM('occupied','vacant','expiring','overdue') DEFAULT 'vacant'");
        }

        if ($driver === 'sqlite') {
            DB::table('units')->where('status', 'reserved')->update(['status' => 'vacant']);
            $this->rebuildUnitsTable([
                'occupied', 'vacant', 'expiring', 'overdue',
            ]);
        }

        Schema::table('rental_applications', function (Blueprint $table): void {
            $table->dropIndex(['status', 'reservation_expires_at']);
            $table->dropConstrainedForeignId('tenant_user_id');
            $table->dropColumn([
                'reserved_at',
                'reservation_expires_at',
                'lease_sent_at',
                'lease_expires_at',
                'payment_verified_at',
                'converted_at',
            ]);
        });

        Schema::table('units', function (Blueprint $table): void {
            $table->dropColumn('reserved_until');
        });
    }

    private function rebuildUnitsTable(array $statuses): void
    {
        $tempTable = 'units_status_fix_tmp';
        $allowedStatuses = "'".implode("','", $statuses)."'";

        DB::statement('PRAGMA foreign_keys=OFF');

        try {
            if (Schema::hasTable($tempTable)) {
                Schema::drop($tempTable);
            }

            Schema::create($tempTable, function (Blueprint $table) use ($statuses): void {
                $table->id();
                $table->string('number', 10)->unique();
                $table->enum('floor', ['GF', '1F', '2F', '3F']);
                $table->enum('type', ['Office', 'Retail', 'Medical']);
                $table->unsignedSmallInteger('area');
                $table->unsignedInteger('base_rent');
                $table->enum('status', $statuses)->default('vacant');
                $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
                $table->timestamp('reserved_until')->nullable();
                $table->timestamps();
            });

            DB::table($tempTable)->insertUsing(
                [
                    'id',
                    'number',
                    'floor',
                    'type',
                    'area',
                    'base_rent',
                    'status',
                    'tenant_id',
                    'reserved_until',
                    'created_at',
                    'updated_at',
                ],
                DB::table('units')->select([
                    'id',
                    'number',
                    'floor',
                    'type',
                    'area',
                    'base_rent',
                    DB::raw("CASE WHEN status IN ($allowedStatuses) THEN status ELSE 'vacant' END as status"),
                    'tenant_id',
                    DB::raw('reserved_until'),
                    'created_at',
                    'updated_at',
                ])
            );

            Schema::drop('units');
            Schema::rename($tempTable, 'units');
        } finally {
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }
};
