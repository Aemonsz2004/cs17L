<?php

namespace App\Support;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Collection;

class UnitVisibilityService
{
    public function getPublicListings(): Collection
    {
        return Unit::publiclyVisible()
            ->select([
                'id',
                'number',
                'floor',
                'type',
                'area',
                'base_rent',
                'deposit_amount',
                'description',
                'gallery',
                'status',
            ])
            ->get();
    }

    public function isPubliclyVisible(Unit $unit): bool
    {
        return $unit->status === 'vacant';
    }
}
