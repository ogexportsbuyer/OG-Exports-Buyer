<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerRewardTierAdjustment extends Model
{
    protected $fillable = [
        'buyer_id',
        'from_tier_id',
        'to_tier_id',
        'changed_by',
        'reason',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function fromTier(): BelongsTo
    {
        return $this->belongsTo(BuyerRewardTier::class, 'from_tier_id');
    }

    public function toTier(): BelongsTo
    {
        return $this->belongsTo(BuyerRewardTier::class, 'to_tier_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
