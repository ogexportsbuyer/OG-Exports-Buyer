<?php

use App\Models\BuyerRewardTier;
use App\Models\BuyerRewardTierAdjustment;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Country;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Port;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\Rfq;
use App\Models\User;
use Database\Seeders\PaymentMethodSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PaymentMethodSeeder::class);

    $this->buyer = User::factory()->create(['account_status' => 'active']);
    $this->buyer->assignRole('buyer');

    $this->makeOrder = function (
        string $number,
        string $status,
        string $paymentStatus,
        float $usdValue,
        array $attributes = [],
    ) {
        return Order::query()->create([
            'order_number' => $number,
            'buyer_id' => $this->buyer->id,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'total_value' => $usdValue,
            'currency' => 'USD',
            'total_value_usd' => $usdValue,
            'placed_at' => now(),
            ...$attributes,
        ]);
    };
});

it('allows the Expo browser preview origin through the API CORS policy', function () {
    $origin = 'https://session-preview.expo.pike.replit.dev';

    $this->withHeaders([
        'Origin' => $origin,
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'authorization,content-type',
    ])->options('/api/products')
        ->assertHeader('Access-Control-Allow-Origin', $origin);
});

it('seeds the requested ten tiers with discounts left for admin configuration', function () {
    $tiers = BuyerRewardTier::query()->with('rewards')->orderBy('sort_order')->get();

    expect($tiers)->toHaveCount(10)
        ->and($tiers->pluck('name')->all())->toBe([
            'Diamond Buyer',
            'Black Diamond Buyer',
            'Emerald Elite Buyer',
            'Sapphire Elite Buyer',
            'Royal Diamond Buyer',
            'Imperial Diamond Buyer',
            'Crown Elite Buyer',
            'Global Elite Buyer',
            'OG Legend Buyer',
            'OG Global Ambassador',
        ])
        ->and($tiers->pluck('minimum_spend_usd')->map(fn ($amount) => (float) $amount)->all())->toBe([
            100000.0,
            500000.0,
            1000000.0,
            5000000.0,
            10000000.0,
            50000000.0,
            100000000.0,
            250000000.0,
            500000000.0,
            1000000000.0,
        ])
        ->and($tiers->every(fn (BuyerRewardTier $tier) => (float) $tier->discount_percentage === 0.0))->toBeTrue()
        ->and($tiers->first()->rewards->contains(fn ($reward) => $reward->type === 'certificate'))->toBeTrue();
});

it('counts only paid or completed USD-snapshot orders toward the buyer tier', function () {
    ($this->makeOrder)('ORD-VIP-PAID', 'order_confirmed', 'paid', 99000);
    ($this->makeOrder)('ORD-VIP-COMPLETE', 'delivered', 'unpaid', 1000);
    ($this->makeOrder)('ORD-VIP-UNPAID', 'order_confirmed', 'unpaid', 250000);
    ($this->makeOrder)('ORD-VIP-PARTIAL', 'order_confirmed', 'partial', 20000);
    ($this->makeOrder)('ORD-VIP-CANCELLED', 'cancelled', 'paid', 300000);
    ($this->makeOrder)('ORD-VIP-REFUNDED', 'delivered', 'refunded', 400000);

    $this->actingAs($this->buyer)
        ->getJson('/api/buyer/rewards')
        ->assertOk()
        ->assertJsonPath('data.qualifying_spend_usd', 100000)
        ->assertJsonPath('data.current_tier.name', 'Diamond Buyer')
        ->assertJsonPath('data.next_tier.name', 'Black Diamond Buyer')
        ->assertJsonPath('data.is_manually_assigned', false);
});

it('applies the configured VIP discount after the product sale price in buyer catalog and checkout', function () {
    ($this->makeOrder)('ORD-VIP-QUALIFY', 'order_confirmed', 'paid', 100000);
    BuyerRewardTier::query()->where('slug', 'diamond-buyer')->update(['discount_percentage' => 10]);

    $product = Product::query()->create([
        'name' => 'Premium Maize',
        'slug' => 'vip-maize-test',
        'status' => 'approved',
        'fob' => 1000,
        'currency' => 'USD',
        'unit_of_measure' => 'MT',
        'discount_percentage' => 10,
    ]);

    $this->actingAs($this->buyer)
        ->getJson('/api/buyer/products')
        ->assertOk()
        ->assertJsonPath('data.0.list_unit_price', 1000)
        ->assertJsonPath('data.0.product_discount_percentage', 10)
        ->assertJsonPath('data.0.vip_discount_percentage', 10)
        ->assertJsonPath('data.0.discount_percentage', 19)
        ->assertJsonPath('data.0.discounted_unit_price', 810)
        ->assertJsonPath('data.0.vip_tier_name', 'Diamond Buyer');
    $this->actingAs($this->buyer)
        ->getJson('/api/buyer/products/vip-maize-test')
        ->assertOk()
        ->assertJsonPath('data.discounted_unit_price', 810);

    $country = Country::query()->create(['code' => 'AE', 'name' => 'United Arab Emirates']);
    $port = Port::query()->create([
        'country_id' => $country->id,
        'unlocode' => 'AEJEA',
        'name' => 'Jebel Ali',
    ]);
    $cart = Cart::query()->create(['user_id' => $this->buyer->id]);
    CartItem::query()->create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'qty' => 2,
        'unit_price' => 1000,
    ]);

    $this->actingAs($this->buyer)
        ->getJson('/api/buyer/cart')
        ->assertOk()
        ->assertJsonPath('data.items.0.unit_price', '810.00')
        ->assertJsonPath('data.items.0.discount_percentage', 19)
        ->assertJsonPath('data.items.0.vip_discount_percentage', 10);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', [
            'destination_country_id' => $country->id,
            'destination_port_id' => $port->id,
            'incoterm' => 'FOB',
            'required_delivery_date' => now()->addMonth()->toDateString(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.total_value', '1620.00');

    $item = OrderItem::query()->whereHas('order', fn ($query) => $query->where('buyer_id', $this->buyer->id))->firstOrFail();
    expect((float) $item->list_unit_price)->toBe(1000.0)
        ->and((float) $item->unit_price)->toBe(810.0)
        ->and((float) $item->discount_percentage)->toBe(19.0)
        ->and((float) $item->discount_amount)->toBe(190.0);
});

it('snapshots the personalized VIP catalog price when the buyer submits an RFQ', function () {
    ($this->makeOrder)('ORD-VIP-RFQ-QUALIFY', 'order_confirmed', 'paid', 100000);
    BuyerRewardTier::query()->where('slug', 'diamond-buyer')->update(['discount_percentage' => 10]);
    $product = Product::query()->create([
        'name' => 'VIP Quoted Product',
        'slug' => 'vip-rfq-product-test',
        'status' => 'approved',
        'fob' => 1000,
        'currency' => 'USD',
        'discount_percentage' => 10,
    ]);
    $country = Country::query()->create(['code' => 'AF', 'name' => 'Afghanistan']);
    $port = Port::query()->create([
        'country_id' => $country->id,
        'unlocode' => 'AFDHD',
        'name' => 'Dehdadi',
    ]);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/rfqs', [
            'product_id' => $product->id,
            'qty' => '10 MT',
            'country_id' => $country->id,
            'port_id' => $port->id,
            'incoterm' => 'CIF',
            'payment_terms' => 'To be agreed',
            'required_delivery_date' => now()->addMonth()->toDateString(),
        ])
        ->assertCreated();

    $rfq = Rfq::query()->where('buyer_id', $this->buyer->id)->firstOrFail();
    expect((float) $rfq->catalog_unit_price_snapshot)->toBe(810.0);

    $quotation = Quotation::query()->create([
        'rfq_id' => $rfq->id,
        'buyer_id' => $this->buyer->id,
        'product_name' => $rfq->product_name,
        'qty_mt' => 10,
        'incoterm' => 'CIF',
        'destination' => $rfq->destination,
        'payment_terms' => 'To be agreed',
        'status' => 'sent',
        'source' => 'admin',
        'fob_unit_price' => 800,
    ]);

    $this->actingAs($this->buyer)
        ->postJson("/api/buyer/quotations/{$quotation->id}/accept")
        ->assertOk()
        ->assertJsonPath('data.quotation.status', 'accepted');

    $acceptedItem = Order::query()
        ->where('quotation_id', $quotation->id)
        ->with('items')
        ->firstOrFail()
        ->items
        ->firstOrFail();
    expect((float) $acceptedItem->list_unit_price)->toBe(810.0)
        ->and((float) $acceptedItem->unit_price)->toBe(800.0)
        ->and((float) $acceptedItem->discount_amount)->toBe(10.0)
        ->and((float) $acceptedItem->discount_percentage)->toBe(1.23);
});

it('keeps guest product prices public and lets admins assign and clear tiers with an audit reason', function () {
    $product = Product::query()->create([
        'name' => 'Guest Maize',
        'slug' => 'guest-maize-test',
        'status' => 'approved',
        'fob' => 1000,
        'currency' => 'USD',
        'discount_percentage' => 10,
    ]);
    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonPath('data.0.discounted_unit_price', 900);
    $this->getJson('/api/products/guest-maize-test')
        ->assertOk()
        ->assertJsonPath('data.discounted_unit_price', 900);

    $admin = User::factory()->create(['account_status' => 'active']);
    $admin->assignRole('admin');
    $globalAmbassador = BuyerRewardTier::query()->where('slug', 'og-global-ambassador')->firstOrFail();

    $this->actingAs($admin)
        ->patchJson("/api/admin/buyer-reward-buyers/{$this->buyer->id}/tier", [
            'tier_id' => $globalAmbassador->id,
            'reason' => 'Approved strategic partner exception',
        ])
        ->assertOk()
        ->assertJsonPath('data.is_manually_assigned', true)
        ->assertJsonPath('data.current_tier.name', 'OG Global Ambassador');

    expect(BuyerRewardTierAdjustment::query()->where('buyer_id', $this->buyer->id)->count())->toBe(1);
    $this->actingAs($admin)
        ->deleteJson("/api/admin/buyer-reward-tiers/{$globalAmbassador->id}")
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->patchJson("/api/admin/buyer-reward-buyers/{$this->buyer->id}/tier", [
            'tier_id' => null,
            'reason' => 'Return to earned tier',
        ])
        ->assertOk()
        ->assertJsonPath('data.is_manually_assigned', false)
        ->assertJsonPath('data.current_tier', null);

    expect(BuyerRewardTierAdjustment::query()->where('buyer_id', $this->buyer->id)->count())->toBe(2);
    $this->actingAs($admin)
        ->deleteJson("/api/admin/buyer-reward-tiers/{$globalAmbassador->id}")
        ->assertOk();
});
