<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerReward extends Model
{
    protected $fillable = [
        'tier_id',
        'title',
        'description',
        'type',
        'is_active',
        'requires_admin_approval',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_admin_approval' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(BuyerRewardTier::class, 'tier_id');
    }
}
