<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Unit extends Model
{
    protected $fillable = [
        'number',
        'floor',
        'type',
        'area',
        'base_rent',
        'status',
        'tenant_id',
    ];

    protected $casts = [
        'area'      => 'integer',
        'base_rent' => 'integer',
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isVacant(): bool { return $this->status === 'vacant'; }
}