<?php

use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->buyer = User::factory()->create(['account_status' => 'active']);
    $this->buyer->assignRole('buyer');

    $this->admin = User::factory()->create(['account_status' => 'active']);
    $this->admin->assignRole('admin');

    $this->conversation = Conversation::query()->create([
        'subject' => 'Buyer support',
        'created_by' => $this->buyer->id,
    ]);
    $this->conversation->participants()->attach([$this->buyer->id, $this->admin->id]);
});

it('stores buyer support media metadata and notifies the other participant', function () {
    $mediaPath = "upload/messages/{$this->buyer->id}/voice-message.m4a";

    $response = $this->actingAs($this->buyer)
        ->postJson("/api/conversations/{$this->conversation->id}/messages", [
            'body' => '',
            'attachment_path' => $mediaPath,
            'attachment_url' => "https://ogexports.co/{$mediaPath}",
            'attachment_name' => 'voice-message.m4a',
            'attachment_mime' => 'audio/mp4',
        ])
        ->assertCreated()
        ->assertJsonPath('data.attachment_path', $mediaPath)
        ->assertJsonPath('data.attachment_name', 'voice-message.m4a')
        ->assertJsonPath('data.attachment_mime', 'audio/mp4');

    expect($response->json('data.attachment_url'))->toBeNull()
        ->and(Message::query()->where('conversation_id', $this->conversation->id)->count())->toBe(1)
        ->and(AppNotification::query()
            ->where('user_id', $this->admin->id)
            ->where('type', 'new_message')
            ->where('data->message_id', $response->json('data.id'))
            ->exists())->toBeTrue();
});

it('returns the latest support messages on the first page in chronological order', function () {
    $firstMessageAt = now()->startOfSecond();

    foreach (range(1, 20) as $number) {
        Message::query()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $number <= 15 ? $this->buyer->id : $this->admin->id,
            'body' => sprintf('Support message %02d', $number),
            'created_at' => $firstMessageAt->copy()->addSeconds($number),
        ]);
    }

    $firstPage = $this->actingAs($this->buyer)
        ->getJson("/api/conversations/{$this->conversation->id}/messages")
        ->assertOk()
        ->assertJsonPath('current_page', 1)
        ->assertJsonPath('last_page', 2)
        ->assertJsonPath('data.0.body', 'Support message 06')
        ->assertJsonPath('data.14.body', 'Support message 20')
        ->assertJsonPath('data.14.sender_id', $this->admin->id);

    expect($firstPage->json('data'))->toHaveCount(15);

    $this->getJson("/api/conversations/{$this->conversation->id}/messages?page=2")
        ->assertOk()
        ->assertJsonPath('data.0.body', 'Support message 01')
        ->assertJsonPath('data.4.body', 'Support message 05');
});

it('translates new buyer and support messages toward each recipient language', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => true,
        'services.google_cloud.translation_monthly_character_limit' => 400000,
    ]);
    Http::fake(function ($request) {
        $target = (string) $request['target'];
        return Http::response([
            'data' => [
                'translations' => [[
                    'translatedText' => $target === 'ur' ? 'اردو ترجمہ' : 'Bonjour',
                    'detectedSourceLanguage' => $target === 'ur' ? 'ar' : 'ur',
                ]],
            ],
        ]);
    });
    Mail::fake();

    $buyerMessage = $this->actingAs($this->buyer)
        ->postJson("/api/conversations/{$this->conversation->id}/messages", [
            'body' => 'مرحبا، أحتاج إلى عرض سعر.',
            'buyer_language' => 'fr',
        ])
        ->assertCreated()
        ->assertJsonPath('data.body', 'مرحبا، أحتاج إلى عرض سعر.')
        ->assertJsonPath('data.translated_body', 'اردو ترجمہ')
        ->assertJsonPath('data.source_language', 'ar')
        ->assertJsonPath('data.target_language', 'ur')
        ->assertJsonPath('data.translation_status', 'translated')
        ->assertJsonPath('data.buyer_translated_body', 'Bonjour')
        ->assertJsonPath('data.buyer_translation_language', 'fr')
        ->assertJsonPath('data.buyer_translation_status', 'translated');

    expect($this->conversation->fresh()->buyer_language)->toBe('fr');

    $adminMessage = $this->actingAs($this->admin)
        ->postJson("/api/admin/conversations/{$this->conversation->id}/messages", [
            'body' => 'آپ کی درخواست موصول ہوگئی ہے۔',
        ])
        ->assertCreated()
        ->assertJsonPath('data.body', 'آپ کی درخواست موصول ہوگئی ہے۔')
        ->assertJsonPath('data.translated_body', 'Bonjour')
        ->assertJsonPath('data.source_language', 'ur')
        ->assertJsonPath('data.target_language', 'fr')
        ->assertJsonPath('data.translation_status', 'translated')
        ->assertJsonPath('data.buyer_translated_body', 'Bonjour')
        ->assertJsonPath('data.buyer_translation_language', 'fr')
        ->assertJsonPath('data.buyer_translation_status', 'translated');

    expect(Message::query()->where('id', $buyerMessage->json('data.id'))->value('body'))
        ->toBe('مرحبا، أحتاج إلى عرض سعر.')
        ->and(Message::query()->where('id', $adminMessage->json('data.id'))->value('body'))
        ->toBe('آپ کی درخواست موصول ہوگئی ہے۔');
});

