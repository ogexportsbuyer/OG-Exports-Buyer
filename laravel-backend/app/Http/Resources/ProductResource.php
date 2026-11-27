<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use App\Support\BuyerProductPricing;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pricing = app(BuyerProductPricing::class)->forProduct($this->resource, $request->user(), $request);

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ]),
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'status' => $this->status,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'origin' => $this->origin,
            'fob' => $this->fob,
            'price' => $this->price,
            'currency' => $this->currency,
            'unit_of_measure' => $this->unit_of_measure ?: 'MT',
            'list_unit_price' => $pricing['list_unit_price'],
            'discount_percentage' => $pricing['discount_percentage'],
            'product_discount_percentage' => $pricing['product_discount_percentage'],
            'vip_discount_percentage' => $pricing['vip_discount_percentage'],
            'vip_tier_name' => $pricing['vip_tier_name'],
            'discounted_unit_price' => $pricing['discounted_unit_price'],
            'discount_amount_per_unit' => $pricing['discount_amount_per_unit'],
            'min_order' => $this->min_order,
            'moq' => $this->moq,
            'lead_time' => $this->lead_time,
            'hs_code' => $this->hs_code,
            'shelf_life' => $this->shelf_life,
            'storage_instructions' => $this->storage_instructions,
            'incoterms' => $this->incoterms,
            'video_url' => $this->video_url,
            'image_url' => MediaStorage::url($this->image_url),
            'lab_report_path' => $this->lab_report_path,
            'lab_report_url' => MediaStorage::url($this->lab_report_path),
            'featured' => (bool) $this->featured,
            'stock' => $this->stock,
            'certifications' => $this->certifications,
            'payment_terms' => $this->payment_terms,
            'delivery_terms' => $this->delivery_terms,
            'packaging_options' => $this->packaging_options,
            'export_markets' => $this->export_markets,
            'specs' => $this->whenLoaded('specs'),
            'media' => $this->whenLoaded('media'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
