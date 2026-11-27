<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerRewardTierOverride extends Model
{
    protected $fillable = [
        'buyer_id',
        'tier_id',
        'changed_by',
        'reason',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(BuyerRewardTier::class, 'tier_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
