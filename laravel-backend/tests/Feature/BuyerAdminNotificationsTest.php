<?php

use App\Models\AppNotification;
use App\Models\EmailTemplate;
use App\Models\KycApplication;
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
        ->and($notification->title)->toContain('Quality Inspection in Progress')
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

it('does not notify a buyer when an admin saves an unchanged order status', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-NOTIF-UNCHANGED',
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
            'status' => OrderStatuses::ORDER_CONFIRMED,
        ])
        ->assertOk();

    expect(AppNotification::query()->where('user_id', $this->buyer->id)->count())->toBe(0)
        ->and(Mail::mailer('array')->getSymfonyTransport()->messages())->toHaveCount(0);
});

it('uses the exact payment status when only the payment status changes', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-PAY-STATUS',
        'buyer_id' => $this->buyer->id,
        'status' => OrderStatuses::ORDER_CONFIRMED,
        'payment_status' => 'pending_verification',
        'total_value' => 5000,
        'currency' => 'USD',
        'placed_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => OrderStatuses::ORDER_CONFIRMED,
            'payment_status' => 'approved',
        ])
        ->assertOk();

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::ORDER_STATUS)
        ->sole();

    expect($notification->title)->toBe('Payment Approved — ORD-PAY-STATUS')
        ->and($notification->body)->toContain('Payment status is now Approved')
        ->and($notification->data['notification_event'] ?? null)->toBe('payment_status');
});

it('notifies buyers once per KYC submission and approval transition', function () {
    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/company/kyc/upload', [
            'doc_type' => 'company_registration',
            'path' => 'uploads/buyer/company-registration.pdf',
            'original_name' => 'company-registration.pdf',
        ])
        ->assertCreated();

    $application = KycApplication::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', 'company')
        ->sole();

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/company/kyc/upload', [
            'doc_type' => 'tax_registration',
            'path' => 'uploads/buyer/tax-registration.pdf',
            'original_name' => 'tax-registration.pdf',
        ])
        ->assertCreated();

    expect(AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', 'kyc_submitted')
        ->count())->toBe(1);

    $this->actingAs($this->admin)
        ->postJson("/api/admin/compliance/kyc/{$application->id}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'approved');

    $this->actingAs($this->admin)
        ->postJson("/api/admin/compliance/kyc/{$application->id}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'approved');

    expect(AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', 'kyc_approved')
        ->count())->toBe(1);
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

    expect($notification->title)->toBe('Shipment Loaded on Vessel')
        ->and($notification->body)->toBe(
            'Your shipment for order ORD-SHIPMENT-EMAIL has been successfully loaded onto the designated vessel. Shipment reference: OGXU1234567.'
        )
        ->and($notification->data['shipment_id'] ?? null)->toBe($shipment->id)
        ->and($notification->data['order_id'] ?? null)->toBe($order->id)
        ->and($messages)->toHaveCount(1)
        ->and($messages[0]->getEnvelope()->getRecipients()[0]->getAddress())->toBe($this->buyer->email);
});

it('starts shipment tracking at awaiting booking and sends the nine dedicated logistics alerts', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-SHIPMENT-FLOW',
        'buyer_id' => $this->buyer->id,
        'status' => OrderStatuses::ORDER_CONFIRMED,
        'payment_status' => 'unpaid',
        'total_value' => 5000,
        'currency' => 'USD',
        'placed_at' => now(),
    ]);

    $response = $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->postJson('/api/admin/shipments', [
            'order_id' => $order->id,
            'buyer_id' => $this->buyer->id,
            'product_snapshot' => 'Premium Basmati Rice',
            'container' => 'OGX-FLOW-001',
        ])
        ->assertCreated()
        ->assertJsonPath('data.current_milestone', 'Awaiting Booking');

    $shipmentId = (int) $response->json('data.id');
    $shipment = Shipment::query()->findOrFail($shipmentId);

    $updates = [
        ['Booking Confirmed', 'booking'],
        ['Gate-In at Port', 'booking'],
        ['Vessel Loaded', 'booking'],
        ['Departed Origin', 'in_transit'],
        ['In Transit', 'in_transit'],
        ['Arrived Destination', 'arrived'],
        ['Customs Cleared', 'arrived'],
        ['Final Delivery', 'delivered'],
    ];

    foreach ($updates as [$milestone, $status]) {
        $this->actingAs($this->admin)
            ->withHeader('Origin', 'http://localhost:5000')
            ->putJson("/api/admin/shipments/{$shipmentId}", [
                'status' => $status,
                'current_milestone' => $milestone,
            ])
            ->assertOk()
            ->assertJsonPath('data.current_milestone', $milestone);
    }

    $expected = [
        [
            'Awaiting Shipment Booking',
            'Your order ORD-SHIPMENT-FLOW is awaiting shipment booking. We are coordinating the shipping arrangements for your consignment. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Shipment Booking Confirmed',
            'The shipping booking for your order ORD-SHIPMENT-FLOW has been successfully confirmed. Your shipment is scheduled for the next stage. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Shipment Received at Port',
            'Your shipment for order ORD-SHIPMENT-FLOW has successfully entered the port terminal and is awaiting vessel loading. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Shipment Loaded on Vessel',
            'Your shipment for order ORD-SHIPMENT-FLOW has been successfully loaded onto the designated vessel. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Vessel Departed from Origin Port',
            'Your shipment for order ORD-SHIPMENT-FLOW has departed from the origin port and is officially on its international journey. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Shipment In Transit',
            'Your shipment for order ORD-SHIPMENT-FLOW is currently in transit to the destination port. Track your shipment for the latest updates. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Vessel Arrived at Destination Port',
            'Your shipment for order ORD-SHIPMENT-FLOW has arrived at the destination port and is awaiting the next clearance procedures. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Customs Clearance Completed',
            'Your shipment for order ORD-SHIPMENT-FLOW has successfully cleared customs at the destination and is ready for the next delivery stage. Shipment reference: OGX-FLOW-001.',
        ],
        [
            'Final Delivery Completed',
            'Your shipment for order ORD-SHIPMENT-FLOW has successfully reached its final delivery destination. Thank you for choosing OG Exports. Shipment reference: OGX-FLOW-001.',
        ],
    ];

    $notifications = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::SHIPMENT_UPDATE)
        ->orderBy('id')
        ->get();

    expect($notifications)->toHaveCount(9);
    foreach ($expected as $index => [$title, $body]) {
        expect($notifications[$index]->title)->toBe($title)
            ->and($notifications[$index]->body)->toBe($body)
            ->and($notifications[$index]->data['shipment_id'] ?? null)->toBe($shipmentId)
            ->and($notifications[$index]->data['order_id'] ?? null)->toBe($order->id);
    }

    $shipment->refresh()->load('milestones');
    expect($shipment->milestones->pluck('label')->all())->toBe([
        'Awaiting Booking',
        'Booking Confirmed',
        'Gate-In at Port',
        'Vessel Loaded',
        'Departed Origin',
        'In Transit',
        'Arrived Destination',
        'Customs Cleared',
        'Final Delivery',
    ]);
    expect(Order::query()->whereKey($order->id)->value('status'))
        ->toBe(OrderStatuses::ORDER_CONFIRMED);

    $emails = Mail::mailer('array')->getSymfonyTransport()->messages();
    expect($emails)->toHaveCount(9)
        ->and(collect($emails)->every(
            fn ($email) => $email->getEnvelope()->getRecipients()[0]->getAddress() === $this->buyer->email
        ))->toBeTrue();
});

it('does not re-notify an unchanged milestone or edits to its timestamp and notes', function () {
    $order = Order::query()->create([
        'order_number' => 'ORD-SHIPMENT-UNCHANGED',
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
        'container' => 'OGX-UNCHANGED-001',
        'status' => 'pending',
        'current_milestone' => 'Awaiting Booking',
    ]);
    $milestone = ShipmentMilestone::query()->create([
        'shipment_id' => $shipment->id,
        'label' => 'Awaiting Booking',
        'occurred_at' => now()->subDay(),
    ]);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->putJson("/api/admin/shipments/{$shipment->id}", [
            'status' => 'pending',
            'current_milestone' => 'Awaiting Booking',
        ])
        ->assertOk();

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->postJson("/api/admin/shipments/{$shipment->id}/milestones", [
            'label' => 'Awaiting Booking',
        ])
        ->assertOk()
        ->assertJsonPath('unchanged', true);

    $this->actingAs($this->admin)
        ->withHeader('Origin', 'http://localhost:5000')
        ->putJson("/api/admin/shipments/{$shipment->id}/milestones/{$milestone->id}", [
            'occurred_at' => now()->toIso8601String(),
            'notes' => 'Updated operations note',
        ])
        ->assertOk();

    expect(AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', PortalNotificationTypes::SHIPMENT_UPDATE)
        ->count())->toBe(0);
    expect(ShipmentMilestone::query()->where('shipment_id', $shipment->id)->count())->toBe(1);
});
