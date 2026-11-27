<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyerReward;
use App\Models\BuyerRewardTier;
use App\Models\BuyerRewardTierAdjustment;
use App\Models\BuyerRewardTierOverride;
use App\Models\User;
use App\Support\BuyerRewardProgramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BuyerRewardsController extends Controller
{
    public function tiers(): JsonResponse
    {
        $tiers = BuyerRewardTier::query()
            ->with(['rewards' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')
            ->orderBy('minimum_spend_usd')
            ->get();

        return response()->json(['data' => $tiers]);
    }

    public function storeTier(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:buyer_reward_tiers,slug'],
            'minimum_spend_usd' => ['required', 'numeric', 'min:0', 'max:1000000000000'],
            'discount_percentage' => ['required', 'numeric', 'min:0', 'max:99.99'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);
        if (BuyerRewardTier::query()->where('slug', $data['slug'])->exists()) {
            $data['slug'] = $data['slug'].'-'.Str::lower(Str::random(6));
        }
        $tier = BuyerRewardTier::query()->create($data);

        return response()->json(['data' => $tier->load('rewards')], 201);
    }

    public function updateTier(Request $request, int $id): JsonResponse
    {
        $tier = BuyerRewardTier::query()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('buyer_reward_tiers', 'slug')->ignore($tier->id)],
            'minimum_spend_usd' => ['sometimes', 'required', 'numeric', 'min:0', 'max:1000000000000'],
            'discount_percentage' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99.99'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $tier->update($data);

        return response()->json(['data' => $tier->fresh()->load('rewards')]);
    }

    public function destroyTier(int $id): JsonResponse
    {
        $tier = BuyerRewardTier::query()->findOrFail($id);
        if (BuyerRewardTierOverride::query()->where('tier_id', $tier->id)->exists()) {
            return response()->json([
                'message' => 'This tier is assigned to one or more buyers. Clear their manual assignments before deleting it.',
            ], 422);
        }

        $tier->delete();

        return response()->json(['message' => 'Buyer reward tier removed.']);
    }

    public function reorderTiers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tiers' => ['required', 'array', 'min:1', 'max:100'],
            'tiers.*.id' => ['required', 'integer', 'distinct', 'exists:buyer_reward_tiers,id'],
            'tiers.*.sort_order' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['tiers'] as $row) {
                BuyerRewardTier::query()
                    ->whereKey($row['id'])
                    ->update(['sort_order' => $row['sort_order']]);
            }
        });

        return $this->tiers();
    }

    public function rewards(): JsonResponse
    {
        $rewards = BuyerReward::query()
            ->with('tier:id,name')
            ->orderBy('tier_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $rewards]);
    }

    public function storeReward(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tier_id' => ['required', 'integer', 'exists:buyer_reward_tiers,id'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
            'requires_admin_approval' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
        ]);
        $reward = BuyerReward::query()->create($data);

        return response()->json(['data' => $reward->load('tier:id,name')], 201);
    }

    public function updateReward(Request $request, int $id): JsonResponse
    {
        $reward = BuyerReward::query()->findOrFail($id);
        $data = $request->validate([
            'tier_id' => ['sometimes', 'required', 'integer', 'exists:buyer_reward_tiers,id'],
            'title' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'type' => ['sometimes', 'required', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
            'requires_admin_approval' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
        ]);
        $reward->update($data);

        return response()->json(['data' => $reward->fresh()->load('tier:id,name')]);
    }

    public function destroyReward(int $id): JsonResponse
    {
        BuyerReward::query()->findOrFail($id)->delete();

        return response()->json(['message' => 'Reward removed.']);
    }

    public function buyers(Request $request, BuyerRewardProgramService $program): JsonResponse
    {
        $perPage = min(100, max(1, $request->integer('per_page', 25)));
        $query = User::query()->role('buyer');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderBy('name')->paginate($perPage);
        $data = $program->summariesFor($paginator->getCollection())->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function updateBuyerTier(Request $request, int $id, BuyerRewardProgramService $program): JsonResponse
    {
        $data = $request->validate([
            'tier_id' => ['present', 'nullable', 'integer', Rule::exists('buyer_reward_tiers', 'id')->where('is_active', true)],
            'reason' => ['required', 'string', 'min:4', 'max:2000'],
        ]);

        $buyer = User::query()->role('buyer')->findOrFail($id);
        $result = DB::transaction(function () use ($request, $buyer, $data, $program) {
            $before = $program->summaryFor($buyer);
            $targetTierId = $data['tier_id'] ?? null;

            if ($targetTierId === null) {
                BuyerRewardTierOverride::query()->where('buyer_id', $buyer->id)->delete();
            } else {
                BuyerRewardTierOverride::query()->updateOrCreate(
                    ['buyer_id' => $buyer->id],
                    [
                        'tier_id' => $targetTierId,
                        'changed_by' => $request->user()->id,
                        'reason' => $data['reason'],
                    ],
                );
            }

            $after = $program->summaryFor($buyer);
            BuyerRewardTierAdjustment::query()->create([
                'buyer_id' => $buyer->id,
                'from_tier_id' => $before['current_tier']['id'] ?? null,
                'to_tier_id' => $after['current_tier']['id'] ?? null,
                'changed_by' => $request->user()->id,
                'reason' => $data['reason'],
            ]);

            return $after;
        });

        return response()->json(['data' => [
            'buyer' => ['id' => $buyer->id, 'name' => $buyer->name, 'email' => $buyer->email],
            ...$result,
        ]]);
    }
}
