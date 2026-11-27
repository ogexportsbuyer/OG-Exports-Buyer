<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buyer_reward_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 120);
            $table->decimal('minimum_spend_usd', 15, 2);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('buyer_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tier_id')->constrained('buyer_reward_tiers')->cascadeOnDelete();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->string('type', 40)->default('benefit');
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_admin_approval')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('buyer_reward_tier_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('tier_id')->constrained('buyer_reward_tiers')->restrictOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->timestamps();
        });

        Schema::create('buyer_reward_tier_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('from_tier_id')->nullable()->constrained('buyer_reward_tiers')->nullOnDelete();
            $table->foreignId('to_tier_id')->nullable()->constrained('buyer_reward_tiers')->nullOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->timestamps();
            $table->index(['buyer_id', 'created_at']);
        });

        $tiers = [
            [
                'slug' => 'diamond-buyer',
                'name' => 'Diamond Buyer',
                'minimum_spend_usd' => 100000,
                'rewards' => [
                    ['Exclusive buyer discount', 'discount', false],
                    ['Loyalty rewards at trade milestones', 'loyalty', true],
                    ['Priority customer support', 'support', true],
                    ['VIP buyer certificate', 'certificate', false],
                ],
            ],
            [
                'slug' => 'black-diamond-buyer',
                'name' => 'Black Diamond Buyer',
                'minimum_spend_usd' => 500000,
                'rewards' => [
                    ['Higher exclusive discounts', 'discount', false],
                    ['Dedicated account manager', 'support', true],
                    ['Priority order processing', 'priority', true],
                    ['Exclusive product offers', 'product_offer', true],
                ],
            ],
            [
                'slug' => 'emerald-elite-buyer',
                'name' => 'Emerald Elite Buyer',
                'minimum_spend_usd' => 1000000,
                'rewards' => [
                    ['Premium pricing privileges', 'discount', false],
                    ['Free product samples for eligible orders', 'sample', true],
                    ['Free shipping on selected eligible orders', 'shipping', true],
                    ['Priority shipment coordination', 'priority', true],
                    ['Personalized business support', 'support', true],
                ],
            ],
            [
                'slug' => 'sapphire-elite-buyer',
                'name' => 'Sapphire Elite Buyer',
                'minimum_spend_usd' => 5000000,
                'rewards' => [
                    ['Enhanced trade discounts', 'discount', false],
                    ['Priority production allocation', 'priority', true],
                    ['Exclusive annual rewards', 'gift', true],
                    ['Senior management assistance', 'support', true],
                ],
            ],
            [
                'slug' => 'royal-diamond-buyer',
                'name' => 'Royal Diamond Buyer',
                'minimum_spend_usd' => 10000000,
                'rewards' => [
                    ['Special contract pricing', 'pricing', true],
                    ['Premium logistics coordination', 'priority', true],
                    ['Special payment terms for eligible buyers', 'payment_terms', true],
                    ['Exclusive business privileges', 'privilege', true],
                    ['Personalized rewards', 'gift', true],
                ],
            ],
            [
                'slug' => 'imperial-diamond-buyer',
                'name' => 'Imperial Diamond Buyer',
                'minimum_spend_usd' => 50000000,
                'rewards' => [
                    ['Higher negotiated discounts', 'discount', false],
                    ['Priority supply commitments', 'priority', true],
                    ['Dedicated senior relationship manager', 'support', true],
                    ['Exclusive annual appreciation rewards', 'gift', true],
                ],
            ],
            [
                'slug' => 'crown-elite-buyer',
                'name' => 'Crown Elite Buyer',
                'minimum_spend_usd' => 100000000,
                'rewards' => [
                    ['Strategic partner pricing', 'pricing', true],
                    ['Priority supply allocation', 'priority', true],
                    ['Customized trade agreements', 'privilege', true],
                    ['Premium corporate gifts', 'gift', true],
                ],
            ],
            [
                'slug' => 'global-elite-buyer',
                'name' => 'Global Elite Buyer',
                'minimum_spend_usd' => 250000000,
                'rewards' => [
                    ['Special strategic buyer privileges', 'privilege', true],
                    ['Customized annual benefits', 'gift', true],
                    ['Priority business negotiations', 'priority', true],
                    ['Exclusive executive-level support', 'support', true],
                ],
            ],
            [
                'slug' => 'og-legend-buyer',
                'name' => 'OG Legend Buyer',
                'minimum_spend_usd' => 500000000,
                'rewards' => [
                    ['Highest-level buyer discounts', 'discount', false],
                    ['Strategic partnership opportunities', 'privilege', true],
                    ['Dedicated executive relationship', 'support', true],
                    ['Bespoke rewards and privileges', 'gift', true],
                ],
            ],
            [
                'slug' => 'og-global-ambassador',
                'name' => 'OG Global Ambassador',
                'minimum_spend_usd' => 1000000000,
                'rewards' => [
                    ['Maximum exclusive trade privileges', 'privilege', true],
                    ['Customized strategic agreements', 'privilege', true],
                    ['Highest priority business support', 'support', true],
                    ['Special recognition by OG Exports', 'recognition', true],
                    ['Exclusive lifetime recognition award', 'recognition', true],
                ],
            ],
        ];

        $now = now();
        foreach ($tiers as $index => $tierData) {
            $rewards = $tierData['rewards'];
            unset($tierData['rewards']);
            $tierId = DB::table('buyer_reward_tiers')->insertGetId([
                ...$tierData,
                'discount_percentage' => 0,
                'sort_order' => $index + 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($rewards as $rewardIndex => [$title, $type, $requiresAdminApproval]) {
                DB::table('buyer_rewards')->insert([
                    'tier_id' => $tierId,
                    'title' => $title,
                    'description' => $title,
                    'type' => $type,
                    'is_active' => true,
                    'requires_admin_approval' => $requiresAdminApproval,
                    'sort_order' => $rewardIndex + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('buyer_reward_tier_adjustments');
        Schema::dropIfExists('buyer_reward_tier_overrides');
        Schema::dropIfExists('buyer_rewards');
        Schema::dropIfExists('buyer_reward_tiers');
    }
};
