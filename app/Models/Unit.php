<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'number',
        'floor',
        'type',
        'area',
        'base_rent',
        'status',
        'tenant_id',
        'reserved_until',
        'description',
        'gallery',
    ];

    protected $casts = [
        'area'      => 'integer',
        'base_rent' => 'integer',
        'reserved_until' => 'datetime',
        'gallery' => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function setNumberAttribute(string $value): void
    {
        $this->attributes['number'] = strtoupper(trim($value));
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function leases(): HasMany
    {
        return $this->hasMany(Lease::class);
    }

    public function rentalApplications(): HasMany
    {
        return $this->hasMany(RentalApplication::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isVacant(): bool { return $this->status === 'vacant'; }

    public function isReserved(): bool { return $this->status === 'reserved'; }
}
