<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RtmsNotification extends Model
{
    use SoftDeletes;

    // Matches the migration table name: rtms_notifications
    protected $table = 'rtms_notifications';

    protected $fillable = [
        'variant',
        'message',
        'category',
        'tenant_id',
        'unread',
    ];

    protected $casts = [
        'unread' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    /**
     * Admin-facing notifications (no tenant_id).
     */
    public function scopeAdmin(Builder $query): Builder
    {
        return $query->whereNull('tenant_id');
    }

    /**
     * Notifications scoped to a specific tenant.
     */
    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }
}
