<?php

namespace App\Console\Commands;

use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use App\Models\Unit;
use Illuminate\Console\Command;

class ExpireReservedUnits extends Command
{
    protected $signature = 'units:expire-reserved';

    protected $description = 'Release reserved units whose reservation deadline has passed';

    public function handle()
    {
        $expiredUnits = Unit::where('status', 'reserved')
            ->where('reserved_until', '<', now())
            ->get();

        foreach ($expiredUnits as $unit) {
            $unit->update([
                'status' => 'vacant',
                'reserved_until' => null,
            ]);

            // Find the corresponding application and mark it expired
            $application = RentalApplication::where('unit_id', $unit->id)
                ->where('status', 'approved')
                ->first();

            if ($application) {
                $application->update(['status' => 'expired']);

                // Notify admin
                RtmsNotification::create([
                    'variant' => 'amber',
                    'message' => "Reservation for unit {$unit->number} has expired (application #{$application->id}).",
                    'category' => 'lease',
                    'tenant_id' => null,
                    'unread' => true,
                ]);
            }

            $this->info("Unit {$unit->number} released.");
        }

        return 0;
    }
}
