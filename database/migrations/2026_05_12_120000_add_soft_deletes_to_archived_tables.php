<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('units', 'deleted_at')) {
            Schema::table('units', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('leases', 'deleted_at')) {
            Schema::table('leases', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('invoices', 'deleted_at')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('rtms_notifications', 'deleted_at')) {
            Schema::table('rtms_notifications', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('rental_applications', 'deleted_at')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('units', 'deleted_at')) {
            Schema::table('units', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('leases', 'deleted_at')) {
            Schema::table('leases', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('invoices', 'deleted_at')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('rtms_notifications', 'deleted_at')) {
            Schema::table('rtms_notifications', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('rental_applications', 'deleted_at')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }
    }
};
