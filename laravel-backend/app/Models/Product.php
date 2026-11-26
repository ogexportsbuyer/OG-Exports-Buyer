<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'status',
        'short_description',
        'description',
        'origin',
        'fob',
        'price',
        'currency',
        'unit_of_measure',
        'discount_percentage',
        'min_order',
        'moq',
        'lead_time',
        'hs_code',
        'shelf_life',
        'storage_instructions',
        'incoterms',
        'video_url',
        'image_url',
        'lab_report_path',
        'featured',
        'stock',
        'certifications',
        'payment_terms',
        'delivery_terms',
        'packaging_options',
        'export_markets',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fob' => 'decimal:2',
            'price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'featured' => 'boolean',
            'certifications' => 'array',
            'payment_terms' => 'array',
            'delivery_terms' => 'array',
            'packaging_options' => 'array',
            'export_markets' => 'array',
        ];
    }

    public function buyerBaseUnitPrice(): ?float
    {
        $value = $this->fob !== null ? $this->fob : $this->price;
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return round((float) $value, 2);
    }

    public function buyerDiscountPercentage(): float
    {
        $value = is_numeric($this->discount_percentage) ? (float) $this->discount_percentage : 0.0;

        return round(max(0, min(100, $value)), 2);
    }

    public function buyerDiscountedUnitPrice(): ?float
    {
        $basePrice = $this->buyerBaseUnitPrice();
        if ($basePrice === null) {
            return null;
        }

        return round($basePrice * (1 - ($this->buyerDiscountPercentage() / 100)), 2);
    }

    public function buyerDiscountAmountPerUnit(): float
    {
        $basePrice = $this->buyerBaseUnitPrice();
        $discountedPrice = $this->buyerDiscountedUnitPrice();

        return $basePrice !== null && $discountedPrice !== null
            ? round(max(0, $basePrice - $discountedPrice), 2)
            : 0.0;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function specs(): HasMany
    {
        return $this->hasMany(ProductSpec::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductMedia::class);
    }

    public function fobPrices(): HasMany
    {
        return $this->hasMany(FobPrice::class);
    }
}
