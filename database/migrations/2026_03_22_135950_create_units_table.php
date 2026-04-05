<?php
// database/migrations/2024_01_01_000003_create_units_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('number', 10)->unique();
            $table->enum('floor', ['GF', '1F', '2F', '3F']);
            $table->enum('type', ['Office', 'Retail', 'Medical']);
            $table->unsignedSmallInteger('area');         // sqm
            $table->unsignedInteger('base_rent');
            $table->enum('status', ['occupied', 'vacant', 'expiring', 'overdue'])->default('vacant');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('units'); }
};