<?php

use App\Models\AppNotification;
use App\Models\EmailTemplate;
use App\Models\Order;
use App\Models\Quotation;
use App\Models\Shipment;
use App\Models\ShipmentMilestone;
use App\Models\User;
use App\Support\DepositReviewStatuses;
use App\Support\OrderStatuses;
use App\Support\PortalNotificationTypes;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['mail.default' => 'array']);

    $this->admin = User::factory()->create(['account_status' => 'active', 'name' => 'Admin']);
    $this->admin->assignRole('admin');

    $this->buyer = User::factory()->create([
        'account_status' => 'active',
        'name' => 'Buyer User',
        'email' => 'buyer-notify@test.local',
    ]);
    $this->buyer->assignRole('buyer');
});

it('installs active email templates for buyer-facing admin updates with migrations', function () {
    $slugs = [
        'quotation_sent',
        'quotation_reply',
        'buyer_order_status_update',
        'buyer_shipment_update',
        'buyer_trade_document',
        'buyer_payment_approved',
        'buyer_payment_rejected',
        'buyer_payment_cancelled',
        'support_ticket_update',
    ];

    foreach ($slugs as $slug) {
        expect(EmailTemplate::query()->where('slug', $slug)->where('is_active', true)->exists())
            ->toBeTrue("Expected active email template [{$slug}] from migrations.");
    }
});

it('notifies buyer when admin updates order status', function () {
    $authLogs = [];
    Event::listen(MessageLogged::class, function (MessageLogged $event) use (&$authLogs) {
        $authLogs[] = $event;
    });

    $order = Order::query()->create([
        'order_number' => 'ORD-NOTIF-001',
        'buyer_id' => $this->buyer->id,
        'status' => OrderStatuses::ORDER_CONFIRMED,
        'payment_status' => 'unpaid',
        'total_value' => 5000,
        'currency' => 'USD',
        'placed_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => OrderStatuses::QUALITY_INSPECTION,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', OrderStatuses::QUALITY_INSPECTION);

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::ORDER_STATUS)
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toContain('ORD-NOTIF-001')
        ->and($notification->data['href'] ?? null)->toBe('/buyer/orders');

    expect(EmailTemplate::query()->where('slug', 'buyer_order_status_update')->where('is_active', true)->exists())->toBeTrue();

    $emailSent = collect($authLogs)->contains(function ($event) {
        return $event->level === 'info'
            && $event->message === 'auth.email.sent'
            && ($event->context['slug'] ?? null) === 'buyer_order_status_update';
    });
    expect($emailSent)->toBeTrue();

    $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
    expect($messages)->toHaveCount(1)
        ->and($messages[0]->getEnvelope()->getRecipients()[0]->getAddress())->toBe($this->buyer->email);

    $this->actingAs($this->buyer)
        ->withHeader('Origin', 'http://localhost:5000')
        ->getJson('/api/notifications/unread-count')
        ->assertOk()
        ->assertJsonPath('data.unread_count', 1);
});

it('notifies buyer when admin replies on a quotation', function () {
    $quotation = Quotation::query()->create([
        'buyer_id' => $this->buyer->id,
        'product_name' => 'Basmati Rice',
        'qty_mt' => 50,
        'incoterm' => 'CIF',
        'destination' => 'Rotterdam',
        'payment_terms' => 'LC at Sight',
        'status' => 'sent',
        'source' => 'admin',
        'fob_unit_price' => 700,
        'issued_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->postJson("/api/admin/quotations/{$quotation->id}/messages", [
            'body' => 'We can offer a better freight rate if you confirm this week.',
        ])
        ->assertCreated();

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::QUOTATION_REPLY)
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->body)->toContain('freight rate')
        ->and($notification->data['href'] ?? null)->toBe('/buyer/quotations')
        ->and(Mail::mailer('array')->getSymfonyTransport()->messages())->toHaveCount(1);
});

it('notifies and emails buyer when admin approves buyer payment', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-PAY-100',
        'buyer_id' => $this->buyer->id,
        'status' => OrderStatuses::PAYMENT,
        'payment_status' => 'pending_verification',
        'total_value' => 12000,
        'currency' => 'USD',
        'payment_submitted_at' => now(),
        'placed_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->postJson("/api/admin/finance/buyer-deposits/{$order->id}/approve")
        ->assertOk()
        ->assertJsonPath('message', 'Buyer payment approved.');

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::BUYER_PAYMENT_APPROVED)
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toContain('ORD-PAY-100')
        ->and($notification->data['href'] ?? null)->toBe('/buyer/payments');

    expect(Order::query()->whereKey($order->id)->value('payment_status'))
        ->toBe(DepositReviewStatuses::APPROVED);

    expect(EmailTemplate::query()->where('slug', 'buyer_payment_approved')->where('is_active', true)->exists())->toBeTrue();

    $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
    expect($messages)->toHaveCount(1)
        ->and($messages[0]->getEnvelope()->getRecipients()[0]->getAddress())->toBe($this->buyer->email);
});

it('emails the buyer when an admin edits an existing shipment milestone', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-SHIPMENT-EMAIL',
        'buyer_id' => $this->buyer->id,
        'status' => OrderStatuses::ORDER_CONFIRMED,
        'payment_status' => 'unpaid',
        'total_value' => 5000,
        'currency' => 'USD',
        'placed_at' => now(),
    ]);
    $shipment = Shipment::query()->create([
        'order_id' => $order->id,
        'buyer_id' => $this->buyer->id,
        'product_snapshot' => 'Yellow Maize',
        'container' => 'OGXU1234567',
        'status' => 'in_transit',
        'current_milestone' => 'Gate-In at Port',
    ]);
    $milestone = ShipmentMilestone::query()->create([
        'shipment_id' => $shipment->id,
        'label' => 'Gate-In at Port',
        'occurred_at' => now()->subDay(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->putJson("/api/admin/shipments/{$shipment->id}/milestones/{$milestone->id}", [
            'label' => 'Vessel Loaded',
        ])
        ->assertOk()
        ->assertJsonPath('data.label', 'Vessel Loaded');

    expect(Shipment::query()->whereKey($shipment->id)->value('current_milestone'))
        ->toBe('Vessel Loaded');

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::SHIPMENT_UPDATE)
        ->sole();
    $messages = Mail::mailer('array')->getSymfonyTransport()->messages();

    expect($notification->body)->toContain('Vessel Loaded')
        ->and($messages)->toHaveCount(1)
        ->and($messages[0]->getEnvelope()->getRecipients()[0]->getAddress())->toBe($this->buyer->email);
});
