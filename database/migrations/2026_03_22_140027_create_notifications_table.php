<?php

// database/migrations/2024_01_01_000006_create_notifications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Using a custom name to avoid colliding with Laravel's built-in
        // "notifications" table from the Notifiable trait (which uses UUIDs).
        // If you're NOT using Laravel's default notification system, you can
        // keep the name "notifications" — just make sure to delete the default
        // create_notifications_table.php migration that Laravel generates.
        Schema::create('rtms_notifications', function (Blueprint $table) {
            $table->id();
            $table->enum('variant', ['red', 'amber', 'teal', 'gray'])->default('gray');
            $table->text('message');
            $table->enum('category', ['payment', 'lease', 'maintenance', 'system']);
            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete();
            // null tenant_id  = admin-facing notification
            // set tenant_id   = scoped to that tenant's portal
            $table->boolean('unread')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rtms_notifications');
    }
};
