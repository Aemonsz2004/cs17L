<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoveOutHistory extends Model
{
    protected $fillable = [
        'tenant_id',
        'unit_id',
        'lease_id',
        'date',
        'reason',
        'notes',
        'damages',
        'balance_due',
    ];

    protected $casts = [
        'date' => 'date',
        'balance_due' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }
}
