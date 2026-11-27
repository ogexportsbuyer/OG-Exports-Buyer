<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuyerRewardTier extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'minimum_spend_usd',
        'discount_percentage',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'minimum_spend_usd' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(BuyerReward::class, 'tier_id')->orderBy('sort_order')->orderBy('id');
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(BuyerRewardTierOverride::class, 'tier_id');
    }
}
