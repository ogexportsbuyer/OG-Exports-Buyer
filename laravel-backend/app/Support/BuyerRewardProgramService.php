<?php

namespace App\Support;

use App\Models\BuyerRewardTier;
use App\Models\BuyerRewardTierOverride;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;

class BuyerRewardProgramService
{
    /**
     * Return the reward summary for one buyer.
     *
     * @return array<string, mixed>
     */
    public function summaryFor(User $buyer): array
    {
        $spend = $this->qualifyingSpendByBuyerIds([$buyer->id])->get($buyer->id, 0.0);
        $override = BuyerRewardTierOverride::query()
            ->with('tier.rewards')
            ->where('buyer_id', $buyer->id)
            ->first();

        return $this->summaryFromValues($spend, $override?->tier, $override !== null, $this->activeTiers());
    }

    /**
     * @param  Collection<int, User>  $buyers
     * @return Collection<int, array<string, mixed>>
     */
    public function summariesFor(Collection $buyers): Collection
    {
        $buyerIds = $buyers->pluck('id')->map(fn ($id) => (int) $id)->all();
        $spendByBuyer = $this->qualifyingSpendByBuyerIds($buyerIds);
        $overrides = BuyerRewardTierOverride::query()
            ->with('tier.rewards')
            ->whereIn('buyer_id', $buyerIds)
            ->get()
            ->keyBy('buyer_id');
        $tiers = $this->activeTiers();

        return $buyers->map(function (User $buyer) use ($spendByBuyer, $overrides, $tiers) {
            $override = $overrides->get($buyer->id);

            return [
                'buyer' => [
                    'id' => $buyer->id,
                    'name' => $buyer->name,
                    'email' => $buyer->email,
                ],
                ...$this->summaryFromValues(
                    (float) $spendByBuyer->get($buyer->id, 0.0),
                    $override?->tier,
                    $override !== null,
                    $tiers,
                ),
                'override_reason' => $override?->reason,
                'override_changed_at' => $override?->updated_at?->toIso8601String(),
            ];
        });
    }

    /**
     * @return Collection<int, float>
     */
    public function qualifyingSpendByBuyerIds(array $buyerIds): Collection
    {
        $buyerIds = array_values(array_unique(array_map('intval', $buyerIds)));
        if ($buyerIds === []) {
            return collect();
        }

        return Order::query()
            ->whereIn('buyer_id', $buyerIds)
            ->get([
                'buyer_id',
                'status',
                'payment_status',
                'total_value',
                'currency',
                'total_value_usd',
                'total_value_pkr',
                'exchange_rate',
            ])
            ->filter(fn (Order $order) => $this->orderQualifies($order))
            ->groupBy('buyer_id')
            ->map(fn (Collection $orders) => round($orders->sum(fn (Order $order) => $this->orderValueUsd($order)), 2));
    }

    private function orderQualifies(Order $order): bool
    {
        $status = strtolower(trim((string) $order->status));
        $paymentStatus = strtolower(trim((string) $order->payment_status));

        if (in_array($status, ['cancelled', 'canceled'], true)) {
            return false;
        }
        if (in_array($paymentStatus, ['cancelled', 'canceled', 'rejected', 'refunded'], true)) {
            return false;
        }

        return in_array($paymentStatus, ['approved', 'paid'], true)
            || in_array($status, ['delivered', 'completed'], true);
    }

    private function orderValueUsd(Order $order): float
    {
        return TradeAmountSnapshot::resolve(
            (float) $order->total_value,
            (string) ($order->currency ?: 'USD'),
            $order->total_value_usd !== null ? (float) $order->total_value_usd : null,
            $order->total_value_pkr !== null ? (float) $order->total_value_pkr : null,
            $order->exchange_rate !== null ? (float) $order->exchange_rate : null,
        )['usd'];
    }

    /**
     * @return array<string, mixed>
     */
    private function summaryFromValues(
        float $spend,
        ?BuyerRewardTier $overrideTier,
        bool $isManuallyAssigned,
        ?Collection $tiers = null,
    ): array
    {
        $tiers ??= $this->activeTiers();

        $eligibleTiers = $tiers
            ->filter(fn (BuyerRewardTier $tier) => (float) $tier->minimum_spend_usd <= $spend)
            ->sortBy('minimum_spend_usd');
        $earnedTier = $eligibleTiers->last();
        $activeOverride = $overrideTier?->is_active ? $overrideTier : null;
        $currentTier = $activeOverride ?? $earnedTier;
        $isManuallyAssigned = $isManuallyAssigned && $activeOverride !== null;
        $currentThreshold = $currentTier ? (float) $currentTier->minimum_spend_usd : 0.0;
        $nextTier = $tiers
            ->filter(fn (BuyerRewardTier $tier) => (float) $tier->minimum_spend_usd > $currentThreshold)
            ->sortBy('minimum_spend_usd')
            ->first();

        $progressStart = $currentTier ? $currentThreshold : 0.0;
        $progressRange = $nextTier
            ? max(0.0, (float) $nextTier->minimum_spend_usd - $progressStart)
            : 0.0;
        $progress = $nextTier && $progressRange > 0
            ? min(100.0, max(0.0, (($spend - $progressStart) / $progressRange) * 100))
            : ($currentTier ? 100.0 : 0.0);

        return [
            'currency' => 'USD',
            'qualifying_spend_usd' => round($spend, 2),
            'current_tier' => $this->serializeTier($currentTier),
            'earned_tier' => $this->serializeTier($earnedTier),
            'is_manually_assigned' => $isManuallyAssigned,
            'next_tier' => $this->serializeTier($nextTier),
            'spend_to_next_tier_usd' => $nextTier
                ? round(max(0.0, (float) $nextTier->minimum_spend_usd - $spend), 2)
                : null,
            'progress_percentage' => round($progress, 2),
            'active_rewards' => $currentTier
                ? $currentTier->rewards
                    ->where('is_active', true)
                    ->map(fn ($reward) => $this->serializeReward($reward->toArray()))
                    ->values()
                    ->all()
                : [],
            'tiers' => $tiers
                ->map(fn (BuyerRewardTier $tier) => $this->serializeTier($tier))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return Collection<int, BuyerRewardTier>
     */
    private function activeTiers(): Collection
    {
        return BuyerRewardTier::query()
            ->with(['rewards' => fn ($query) => $query->where('is_active', true)])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('minimum_spend_usd')
            ->get();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function serializeTier(?BuyerRewardTier $tier): ?array
    {
        if (! $tier) {
            return null;
        }

        return [
            'id' => $tier->id,
            'slug' => $tier->slug,
            'name' => $tier->name,
            'minimum_spend_usd' => (float) $tier->minimum_spend_usd,
            'discount_percentage' => (float) $tier->discount_percentage,
            'sort_order' => (int) $tier->sort_order,
            'rewards' => $tier->relationLoaded('rewards')
                ? $tier->rewards
                    ->where('is_active', true)
                    ->map(fn ($reward) => $this->serializeReward($reward->toArray()))
                    ->values()
                    ->all()
                : [],
        ];
    }

    /**
     * @param  array<string, mixed>  $reward
     * @return array<string, mixed>
     */
    public function serializeReward(array $reward): array
    {
        return [
            'id' => (int) ($reward['id'] ?? 0),
            'tier_id' => (int) ($reward['tier_id'] ?? 0),
            'title' => (string) ($reward['title'] ?? ''),
            'description' => $reward['description'] ?? null,
            'type' => (string) ($reward['type'] ?? 'benefit'),
            'is_active' => (bool) ($reward['is_active'] ?? false),
            'requires_admin_approval' => (bool) ($reward['requires_admin_approval'] ?? true),
            'sort_order' => (int) ($reward['sort_order'] ?? 0),
        ];
    }
}
