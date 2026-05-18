<?php

// database/migrations/2024_01_01_000001_create_tenants_table.php
// Must run BEFORE users so users can have a tenant_id FK.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('initials', 4);
            $table->string('contact');
            $table->string('phone', 20);
            $table->string('email')->unique();
            $table->string('unit', 10);
            $table->string('floor', 4);           // GF | 1F | 2F | 3F
            $table->enum('type', ['Office', 'Retail', 'Medical']);
            $table->unsignedInteger('rent');
            $table->unsignedInteger('deposit');
            $table->date('lease_start');
            $table->date('lease_end');
            $table->enum('payment_method', ['GCash', 'Bank Transfer', 'Cash']);
            $table->enum('status', ['active', 'expiring', 'overdue'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
