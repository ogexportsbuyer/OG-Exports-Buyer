<?php

use App\Models\InvestorPushToken;
use App\Models\AppNotification;
use App\Models\User;
use App\Models\UserProfile;
use App\Support\InvestorExpoPush;
use App\Support\InvestorPushBridge;
use App\Support\NotifiesUsers;
use App\Support\PortalNotificationTypes;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->buyer = User::factory()->create(['account_status' => 'active']);
    $this->buyer->assignRole('buyer');
});

it('stores buyer theme and notification preferences without replacing other profile metadata', function () {
    UserProfile::query()->create([
        'user_id' => $this->buyer->id,
        'meta' => ['existing_setting' => 'keep'],
    ]);

    $this->actingAs($this->buyer)
        ->putJson('/api/me', [
            'meta' => [
                'preferences' => [
                    'language' => 'ur',
                    'appearance' => 'dark',
                    'theme' => 'dark',
                    'currency' => 'PKR',
                ],
                'notification_prefs' => ['trade' => false],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.profile.meta.preferences.appearance', 'dark')
        ->assertJsonPath('data.profile.meta.preferences.language', 'ur')
        ->assertJsonPath('data.profile.meta.notification_prefs.trade', false);

    expect($this->buyer->profile->fresh()->meta)->toMatchArray(['existing_setting' => 'keep']);
});

it('registers and revokes push tokens only through buyer-scoped routes', function () {
    $token = 'ExponentPushToken[Buyerdeviceabcdefghijk123456789]';

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/push-tokens/register', [
            'expo_push_token' => $token,
            'platform' => 'ios',
        ])
        ->assertOk()
        ->assertExactJson(['success' => true]);

    $this->assertDatabaseHas('investor_push_tokens', [
        'user_id' => $this->buyer->id,
        'expo_push_token' => $token,
        'platform' => 'ios',
        'revoked_at' => null,
    ]);

    $this->actingAs($this->buyer)
        ->postJson('/api/buyer/push-tokens/revoke', ['expo_push_token' => $token])
        ->assertOk()
        ->assertJson(['success' => true, 'revoked' => true]);

    $this->actingAs($this->buyer)
        ->postJson('/api/investor/push-tokens/register', [
            'expo_push_token' => $token,
            'platform' => 'ios',
        ])
        ->assertForbidden();
});

it('sends buyer device alerts through Expo using a buyer notification channel', function () {
    $token = InvestorPushToken::query()->create([
        'user_id' => $this->buyer->id,
        'expo_push_token' => 'ExponentPushToken[Buyerdeviceabcdefghijk123456789]',
        'platform' => 'ios',
    ]);

    Http::fake([
        'https://exp.host/--/api/v2/push/send' => Http::response([
            'data' => [['status' => 'ok']],
        ]),
    ]);

    expect(InvestorExpoPush::send($this->buyer, 'Order update', 'A buyer update is ready.', [
        'href' => '/buyer/orders',
    ]))->toBe(1);

    Http::assertSent(fn ($request) => $request->url() === 'https://exp.host/--/api/v2/push/send'
        && $request->data()[0]['to'] === $token->expo_push_token
        && $request->data()[0]['channelId'] === 'buyer-updates');
});

it('keeps buyer push alerts out of the investor-only signed callback', function () {
    InvestorPushToken::query()->create([
        'user_id' => $this->buyer->id,
        'expo_push_token' => 'ExponentPushToken[Buyerdeviceabcdefghijk123456789]',
        'platform' => 'ios',
    ]);
    config([
        'services.investor_push.notification_url' => 'https://internal.example/investor-notifications',
        'services.investor_push.session_secret' => 'test-signing-secret',
    ]);
    Http::fake([
        'https://exp.host/--/api/v2/push/send' => Http::response(['data' => [['status' => 'ok']]]),
        '*' => Http::response(['success' => true]),
    ]);
    $notification = AppNotification::query()->create([
        'user_id' => $this->buyer->id,
        'type' => PortalNotificationTypes::ORDER_STATUS,
        'title' => 'Order update',
        'body' => 'Private order details',
        'data' => ['href' => '/buyer/orders', 'order_id' => 42],
    ]);

    InvestorPushBridge::sendNotification($this->buyer, $notification);

    expect(Http::recorded())->toHaveCount(1);
    Http::assertSent(fn ($request) => $request->url() === 'https://exp.host/--/api/v2/push/send');
});

it('uses buyer notification category preferences for future in-app alerts', function () {
    UserProfile::query()->create([
        'user_id' => $this->buyer->id,
        'meta' => ['notification_prefs' => ['trade' => false]],
    ]);

    expect(NotifiesUsers::notify(
        $this->buyer,
        PortalNotificationTypes::SHIPMENT_UPDATE,
        'Shipment update',
        'A shipment has moved.',
    ))->toBeNull();

    $this->assertDatabaseCount('notifications', 0);

    $this->buyer->profile->update(['meta' => ['notification_prefs' => ['trade' => true]]]);
    $notification = NotifiesUsers::notify(
        $this->buyer,
        PortalNotificationTypes::SHIPMENT_UPDATE,
        'Shipment update',
        'A shipment has moved.',
    );

    expect($notification)->not->toBeNull();
    $this->assertDatabaseHas('notifications', [
        'user_id' => $this->buyer->id,
        'type' => PortalNotificationTypes::SHIPMENT_UPDATE,
    ]);
});
