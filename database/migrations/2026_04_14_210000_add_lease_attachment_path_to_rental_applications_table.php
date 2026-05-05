<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('rental_applications', 'lease_attachment_path')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->string('lease_attachment_path')->nullable()->after('lease_terms');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('rental_applications', 'lease_attachment_path')) {
            Schema::table('rental_applications', function (Blueprint $table): void {
                $table->dropColumn('lease_attachment_path');
            });
        }
    }
};
