<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add temporary column with new wider enum
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_new', [
                'vacant', 'occupied', 'maintenance',
                'pending', 'expiring', 'overdue',
            ])->default('vacant')->after('status');
        });

        // Copy existing statuses
        DB::statement('UPDATE units SET status_new = status');

        // Drop old column
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        // Rename new column to "status"
        Schema::table('units', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });
    }

    public function down(): void
    {
        // Reverse the operation (similar swap, back to original four values)
        Schema::table('units', function (Blueprint $table) {
            $table->enum('status_old', [
                'occupied', 'vacant', 'expiring', 'overdue',
            ])->default('vacant')->after('status');
        });

        DB::statement('UPDATE units SET status_old = status');

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });
    }
};
