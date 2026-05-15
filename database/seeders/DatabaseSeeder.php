<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'RTMS Admin',
            'email' => 'admin@rtms.test',
            'password' => 'password',
            'role' => 'admin',
            'tenant_id' => null,
            'email_verified_at' => now(),
        ]);
    }
}
