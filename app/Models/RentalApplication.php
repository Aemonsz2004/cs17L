<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class RentalApplication extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CONVERTED = 'converted';

    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'user_id',
        'unit_id',
        'full_name',
        'occupation',
        'monthly_income',
        'emergency_contact',
        'government_id_path',
        'income_proof_path',
        'preferred_move_in',
        'lease_duration',
        'payment_method',
        'applicant_notes',
        'status',
        'rejection_reason',
        'converted_at',
        'move_in_confirmed_at',
        'tenant_id',
        'tenant_user_id',
        'admin_id',
    ];

    protected $casts = [
        'monthly_income' => 'integer',
        'preferred_move_in' => 'date',
        'lease_duration' => 'integer',
        'converted_at' => 'datetime',
        'move_in_confirmed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function tenantUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ApplicationPayment::class, 'rental_application_id');
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(ApplicationPayment::class, 'rental_application_id')->latestOfMany();
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ApplicationLog::class, 'rental_application_id')->latest('created_at');
    }

    public function canResubmit(): bool
    {
        return $this->status === 'rejected';
    }
}
