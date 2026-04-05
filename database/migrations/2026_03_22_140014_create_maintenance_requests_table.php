<?php
// database/migrations/2024_01_01_000005_create_maintenance_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('unit', 10);
            $table->string('tenant');
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();
            $table->enum('type', [
                'Electrical',
                'Plumbing',
                'Air Conditioning',
                'Structural',
                'General',
            ]);
            $table->enum('priority', ['high', 'medium', 'low'])->default('medium');
            $table->enum('status', ['open', 'inprogress', 'resolved'])->default('open');
            $table->string('assigned_to')->nullable();
            $table->date('resolved_date')->nullable();
            $table->text('notes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
    }
};