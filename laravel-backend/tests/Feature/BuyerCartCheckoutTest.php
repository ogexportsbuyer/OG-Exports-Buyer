<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Country;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Port;
use App\Models\Product;
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

    $this->country = Country::query()->create([
        'code' => 'AE',
        'name' => 'United Arab Emirates',
    ]);
    $this->port = Port::query()->create([
        'country_id' => $this->country->id,
        'unlocode' => 'AEJEA',
        'name' => 'Jebel Ali',
    ]);

    $this->product = Product::query()->create([
        'name' => 'IQF Potato Sticks',
        'slug' => 'iqf-potato-sticks-test',
        'status' => 'approved',
        'price' => 1100,
    ]);

    $this->cart = Cart::query()->create(['user_id' => $this->buyer->id]);
    CartItem::query()->create([
        'cart_id' => $this->cart->id,
        'product_id' => $this->product->id,
        'qty' => 10,
        'unit_price' => 1100,
    ]);

    $this->checkoutPayload = [
        'payment_method' => 'lc',
        'destination_country_id' => $this->country->id,
        'destination_port_id' => $this->port->id,
        'incoterm' => 'FOB',
        'required_delivery_date' => now()->addMonth()->toDateString(),
    ];
});

it('places an order, clears the cart, and rejects a second checkout while empty', function () {
    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', $this->checkoutPayload)
        ->assertCreated()
        ->assertJsonPath('data.buyer_id', $this->buyer->id)
        ->assertJsonPath('data.payment_status', 'unpaid');

    expect(Order::query()->where('buyer_id', $this->buyer->id)->count())->toBe(1);
    expect(CartItem::query()->where('cart_id', $this->cart->id)->count())->toBe(0);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', $this->checkoutPayload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cart');

    expect(Order::query()->where('buyer_id', $this->buyer->id)->count())->toBe(1);
});

it('uses the current FOB discount and snapshots unit pricing when the buyer checks out', function () {
    $this->product->update([
        'fob' => 1250,
        'unit_of_measure' => 'kg',
        'discount_percentage' => 10,
    ]);
    CartItem::query()->where('cart_id', $this->cart->id)->update(['unit_price' => 1]);

    $this->actingAs($this->buyer)
        ->getJson('/api/buyer/cart')
        ->assertOk()
        ->assertJsonPath('data.items.0.unit_of_measure', 'kg')
        ->assertJsonPath('data.items.0.list_unit_price', 1250)
        ->assertJsonPath('data.items.0.unit_price', '1125.00')
        ->assertJsonPath('data.items.0.discount_percentage', 10)
        ->assertJsonPath('data.items.0.discount_amount_per_unit', 125);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', $this->checkoutPayload)
        ->assertCreated();

    $order = Order::query()->where('buyer_id', $this->buyer->id)->with('items')->firstOrFail();
    $item = $order->items->firstOrFail();

    expect((float) $order->total_value)->toBe(11250.0)
        ->and((float) $item->unit_price)->toBe(1125.0)
        ->and((float) $item->list_unit_price)->toBe(1250.0)
        ->and((float) $item->discount_percentage)->toBe(10.0)
        ->and((float) $item->discount_amount)->toBe(125.0)
        ->and($item->unit_of_measure)->toBe('kg');
});

it('rejects an FOB order when the discounted unit price is zero', function () {
    $this->product->update([
        'fob' => 0.01,
        'discount_percentage' => 99.99,
    ]);
    CartItem::query()->where('cart_id', $this->cart->id)->update(['unit_price' => 0]);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', $this->checkoutPayload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cart');

    expect(Order::query()->where('buyer_id', $this->buyer->id)->count())->toBe(0);
});

it('rejects non-FOB checkout', function () {
    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/cart/checkout', [
            ...$this->checkoutPayload,
            'incoterm' => 'CIF',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('incoterm');

    expect(Order::query()->where('buyer_id', $this->buyer->id)->count())->toBe(0);
    expect(CartItem::query()->where('cart_id', $this->cart->id)->count())->toBe(1);
});

it('rejects duplicate payment submission for the same order', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-TESTDUP1',
        'buyer_id' => $this->buyer->id,
        'status' => 'order_confirmed',
        'payment_status' => 'unpaid',
        'payment_method' => 'Letter of Credit (LC at Sight)',
        'total_value' => 11000,
        'currency' => 'USD',
        'placed_at' => now(),
    ]);

    $payload = [
        'payment_method' => 'lc',
        'payment_field1' => 'Emirates NBD',
        'reference' => 'LC-123',
        'notes' => 'Submitted',
    ];

    $this->actingAs($this->buyer)
        ->postJson("/api/buyer/payments/orders/{$order->id}/mark-paid", $payload)
        ->assertOk()
        ->assertJsonPath('data.payment_status', 'pending_verification');

    $this->actingAs($this->buyer)
        ->postJson("/api/buyer/payments/orders/{$order->id}/mark-paid", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('payment_status');

    expect(Order::query()->whereKey($order->id)->value('payment_status'))->toBe('pending_verification');
});
