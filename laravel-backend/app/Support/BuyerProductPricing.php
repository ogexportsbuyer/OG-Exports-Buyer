<?php

namespace App\Support;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class BuyerProductPricing
{
    /**
     * @return array{
     *   list_unit_price: ?float,
     *   product_discount_percentage: float,
     *   vip_discount_percentage: float,
     *   vip_tier_name: ?string,
     *   discount_percentage: float,
     *   discounted_unit_price: ?float,
     *   discount_amount_per_unit: float
     * }
     */
    public function forProduct(Product $product, ?User $buyer = null, ?Request $request = null): array
    {
        $listPrice = $product->buyerBaseUnitPrice();
        $productDiscount = min(99.99, max(0.0, $product->buyerDiscountPercentage()));
        $productSalePrice = $product->buyerDiscountedUnitPrice();
        $tier = $this->buyerTierContext($buyer, $request);
        $vipDiscount = (float) ($tier['discount_percentage'] ?? 0.0);

        $finalPrice = $productSalePrice !== null
            ? round($productSalePrice * (1 - ($vipDiscount / 100)), 2)
            : null;
        $overallDiscount = $listPrice !== null && $listPrice > 0 && $finalPrice !== null
            ? round(max(0.0, min(99.99, (($listPrice - $finalPrice) / $listPrice) * 100)), 2)
            : 0.0;

        return [
            'list_unit_price' => $listPrice,
            'product_discount_percentage' => $productDiscount,
            'vip_discount_percentage' => $vipDiscount,
            'vip_tier_name' => $tier['name'] ?? null,
            'discount_percentage' => $overallDiscount,
            'discounted_unit_price' => $finalPrice,
            'discount_amount_per_unit' => $listPrice !== null && $finalPrice !== null
                ? round(max(0.0, $listPrice - $finalPrice), 2)
                : 0.0,
        ];
    }

    /**
     * @return array{name: ?string, discount_percentage: float}
     */
    private function buyerTierContext(?User $buyer, ?Request $request): array
    {
        if (! $buyer || ! $buyer->hasRole('buyer')) {
            return ['name' => null, 'discount_percentage' => 0.0];
        }

        $attribute = 'buyer_vip_pricing_context_'.$buyer->id;
        if ($request && $request->attributes->has($attribute)) {
            return $request->attributes->get($attribute);
        }

        $summary = app(BuyerRewardProgramService::class)->summaryFor($buyer);
        $tier = $summary['current_tier'];
        $context = [
            'name' => $tier['name'] ?? null,
            'discount_percentage' => min(99.99, max(0.0, (float) ($tier['discount_percentage'] ?? 0.0))),
        ];

        $request?->attributes->set($attribute, $context);

        return $context;
    }
}
