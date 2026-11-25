<?php

use App\Models\User;
use App\Services\GoogleCloudTranslationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(GoogleCloudTranslationService::class);
});

it('does not call Google until translation is explicitly enabled and configured', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => false,
    ]);

    Http::fake();

    expect($this->service->translate('Hello', 'ur'))
        ->toMatchArray([
            'translated_body' => null,
            'target_language' => 'ur',
            'translation_status' => 'disabled',
        ]);

    Http::assertNothingSent();
});

it('uses standard Google Translation and stores detected language and translated text', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => true,
        'services.google_cloud.translation_monthly_character_limit' => 400000,
    ]);
    Http::fake([
        'translation.googleapis.com/language/translate/v2*' => Http::response([
            'data' => [
                'translations' => [[
                    'translatedText' => 'مرحبا',
                    'detectedSourceLanguage' => 'en',
                ]],
            ],
        ]),
    ]);

    $result = $this->service->translate('Hello', 'ar');

    expect($result)->toMatchArray([
        'translated_body' => 'مرحبا',
        'source_language' => 'en',
        'target_language' => 'ar',
        'translation_status' => 'translated',
    ]);

    Http::assertSent(fn ($request) =>
        str_contains($request->url(), 'key=test-key')
        && $request['q'] === 'Hello'
        && $request['target'] === 'ar'
        && $request['format'] === 'text'
    );
    expect(DB::table('google_translation_monthly_usage')->value('characters'))->toBe(5);
});

it('stops before calling Google after the local monthly character limit is reached', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => true,
        'services.google_cloud.translation_monthly_character_limit' => 5,
    ]);
    Http::fake();

    $first = $this->service->translate('12345', 'ur');
    $second = $this->service->translate('6', 'ur');

    expect($first['translation_status'])->toBe('failed')
        ->and($second['translation_status'])->toBe('quota_exceeded');

    Http::assertSentCount(1);
});

it('defaults buyer chat language from the buyer country and allows a valid override', function () {
    $buyer = new User();
    $buyer->setRelation('profile', (object) ['country' => 'Pakistan', 'meta' => []]);

    expect($this->service->buyerLanguage($buyer))->toBe('ur')
        ->and($this->service->buyerLanguage($buyer, 'ar'))->toBe('ar')
        ->and($this->service->buyerLanguage($buyer, 'invalid language'))->toBe('ur');
});

it('serves safe common-language choices without contacting Google while translation is disabled', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => false,
    ]);
    Http::fake();

    $this->actingAs(User::factory()->create())
        ->getJson('/api/messages/translation-languages')
        ->assertOk()
        ->assertJsonPath('data.0.code', 'ar')
        ->assertJsonPath('data.0.name', 'Arabic');

    Http::assertNothingSent();
});

it('loads Google supported languages only after translation is explicitly enabled', function () {
    config([
        'services.google_cloud.translation_api_key' => 'test-key',
        'services.google_cloud.translation_enabled' => true,
    ]);
    Http::fake([
        'translation.googleapis.com/language/translate/v2/languages*' => Http::response([
            'data' => ['languages' => [
                ['language' => 'fr', 'name' => 'French'],
                ['language' => 'ur', 'name' => 'Urdu'],
            ]],
        ]),
    ]);

    expect($this->service->supportedLanguages())->toBe([
        ['code' => 'fr', 'name' => 'French'],
        ['code' => 'ur', 'name' => 'Urdu'],
    ]);
});

it('lets only the conversation owner save the support reply language', function () {
    $buyer = User::factory()->create();
    $otherBuyer = User::factory()->create();
    $conversation = \App\Models\Conversation::query()->create([
        'subject' => 'Support',
        'created_by' => $buyer->id,
    ]);
    $conversation->participants()->attach([$buyer->id, $otherBuyer->id]);

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/preferences", [
            'buyer_language' => 'fr-CA',
        ])
        ->assertOk()
        ->assertJsonPath('data.buyer_language', 'fr-CA');

    $this->actingAs($otherBuyer)
        ->patchJson("/api/conversations/{$conversation->id}/preferences", [
            'buyer_language' => 'ar',
        ])
        ->assertForbidden();

    expect($conversation->fresh()->buyer_language)->toBe('fr-CA');
});
