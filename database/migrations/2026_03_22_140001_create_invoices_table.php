<?php

// database/migrations/2024_01_01_000004_create_invoices_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->string('period');
            $table->unsignedInteger('rent')->default(0);
            $table->unsignedInteger('utilities')->default(0);
            $table->unsignedInteger('penalty')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->enum('method', ['GCash', 'Bank Transfer', 'Cash'])->nullable();
            $table->enum('status', ['paid', 'due', 'overdue'])->default('due');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
