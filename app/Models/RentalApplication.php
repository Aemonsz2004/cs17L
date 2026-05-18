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

    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_LEASE_SENT = 'lease_sent';

    public const STATUS_PAYMENT_PENDING = 'payment_pending';

    public const STATUS_PAYMENT_PAID = 'payment_paid';

    public const STATUS_CONVERTED = 'converted';

    protected $fillable = [
        'user_id',
        'unit_id',
        'full_name',
        'occupation',
        'monthly_income',
        'emergency_contact',
        'government_id_path',
        'income_proof_path',
        'status',
        'reserved_at',
        'reservation_expires_at',
        'rejection_reason',
        'lease_terms',
        'lease_attachment_path',
        'lease_sent_at',
        'lease_expires_at',
        'lease_acknowledged_at',
        'payment_pending_at',
        'deposit_method',
        'deposit_reference',
        'deposit_submitted_at',
        'payment_verified_at',
        'payment_paid_at',
        'deposit_confirmed_at',
        'converted_at',
        'tenant_id',
        'tenant_user_id',
        'admin_id',
    ];

    protected $casts = [
        'monthly_income' => 'integer',
        'reserved_at' => 'datetime',
        'reservation_expires_at' => 'datetime',
        'lease_sent_at' => 'datetime',
        'lease_expires_at' => 'datetime',
        'lease_acknowledged_at' => 'datetime',
        'payment_pending_at' => 'datetime',
        'deposit_submitted_at' => 'datetime',
        'payment_verified_at' => 'datetime',
        'payment_paid_at' => 'datetime',
        'deposit_confirmed_at' => 'datetime',
        'converted_at' => 'datetime',
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
