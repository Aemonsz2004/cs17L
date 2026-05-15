<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'description')) {
                $table->text('description')->nullable()->after('status');
            }
            if (!Schema::hasColumn('units', 'gallery')) {
                $table->json('gallery')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            if (Schema::hasColumn('units', 'gallery')) {
                $table->dropColumn('gallery');
            }
            if (Schema::hasColumn('units', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
