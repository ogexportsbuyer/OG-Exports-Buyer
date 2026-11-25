<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
    $this->voiceTestFiles = [];
    $this->makeBuyer = function (string $country = 'Pakistan'): User {
        $buyer = User::factory()->create();
        $buyer->assignRole('buyer');
        $buyer->profile()->create(['country' => $country]);

        return $buyer;
    };
    $this->makeConversation = function (User $buyer, string $language = 'en'): Conversation {
        $conversation = Conversation::query()->create([
            'subject' => 'Voice support',
            'created_by' => $buyer->id,
            'buyer_language' => $language,
        ]);
        $conversation->participants()->attach($buyer->id);

        return $conversation;
    };
    $this->makeWavMessage = function (User $buyer, Conversation $conversation, int $durationSeconds = 1): Message {
        $relativeDirectory = 'upload/messages/'.$buyer->id.'/voice-test-'.bin2hex(random_bytes(5));
        $absoluteDirectory = public_path($relativeDirectory);
        if (! is_dir($absoluteDirectory)) {
            mkdir($absoluteDirectory, 0755, true);
        }
        $sampleRate = 16000;
        $data = str_repeat("\0", $sampleRate * 2 * $durationSeconds);
        $formatChunk = 'fmt '.pack('VvvVVvv', 16, 1, 1, $sampleRate, $sampleRate * 2, 2, 16);
        $file = 'RIFF'.pack('V', 36 + strlen($data)).'WAVE'.$formatChunk.'data'.pack('V', strlen($data)).$data;
        $path = $relativeDirectory.'/voice.wav';
        file_put_contents(public_path($path), $file);
        $this->voiceTestFiles[] = public_path($path);

        return Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $buyer->id,
            'body' => '',
            'attachment_path' => $path,
            'attachment_url' => '/'.$path,
            'attachment_name' => 'voice.wav',
            'attachment_mime' => 'audio/wav',
            'created_at' => now(),
        ]);
    };
    $this->makeWebmMessage = function (User $buyer, Conversation $conversation, float $durationSeconds = 1.5): Message {
        $relativeDirectory = 'upload/messages/'.$buyer->id.'/voice-test-'.bin2hex(random_bytes(5));
        $absoluteDirectory = public_path($relativeDirectory);
        if (! is_dir($absoluteDirectory)) {
            mkdir($absoluteDirectory, 0755, true);
        }
        $scale = "\x2A\xD7\xB1\x83".substr(pack('N', 1_000_000), 1);
        $duration = "\x44\x89\x88".pack('E', $durationSeconds * 1000);
        $infoPayload = $scale.$duration;
        $webm = "\x1A\x45\xDF\xA3".("\x15\x49\xA9\x66".chr(0x80 | strlen($infoPayload)).$infoPayload);
        $path = $relativeDirectory.'/voice.webm';
        file_put_contents(public_path($path), $webm);
        $this->voiceTestFiles[] = public_path($path);

        return Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $buyer->id,
            'body' => '',
            'attachment_path' => $path,
            'attachment_url' => '/'.$path,
            'attachment_name' => 'voice.webm',
            'attachment_mime' => 'audio/webm',
            'created_at' => now(),
        ]);
    };
    $this->makeRawVoiceMessage = function (
        User $buyer,
        Conversation $conversation,
        string $name,
        string $mime,
        string $bytes
    ): Message {
        $relativeDirectory = 'upload/messages/'.$buyer->id.'/voice-test-'.bin2hex(random_bytes(5));
        $absoluteDirectory = public_path($relativeDirectory);
        if (! is_dir($absoluteDirectory)) {
            mkdir($absoluteDirectory, 0755, true);
        }
        $path = $relativeDirectory.'/'.$name;
        file_put_contents(public_path($path), $bytes);
        $this->voiceTestFiles[] = public_path($path);

        return Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $buyer->id,
            'body' => '',
            'attachment_path' => $path,
            'attachment_url' => '/'.$path,
            'attachment_name' => $name,
            'attachment_mime' => $mime,
            'created_at' => now(),
        ]);
    };
});

afterEach(function () {
    foreach ($this->voiceTestFiles as $path) {
        if (is_file($path)) {
            unlink($path);
        }
        $directory = dirname($path);
        if (is_dir($directory) && count(scandir($directory) ?: []) <= 2) {
            rmdir($directory);
        }
        $parent = dirname($directory);
        if (is_dir($parent) && count(scandir($parent) ?: []) <= 2) {
            rmdir($parent);
        }
    }
});

it('records voice-translation consent and supports revoking it', function () {
    $buyer = ($this->makeBuyer)();
    $otherBuyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);

    $this->actingAs($otherBuyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertForbidden();

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk()
        ->assertJsonPath('data.voice_translation_enabled', true);

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => false])
        ->assertOk()
        ->assertJsonPath('data.voice_translation_enabled', false);

    expect(DB::table('buyer_voice_translation_consent_events')
        ->where('conversation_id', $conversation->id)
        ->orderBy('id')
        ->pluck('enabled')
        ->all())->toBe([1, 0]);

    expect($conversation->fresh()->buyer_voice_translation_consent_revoked_at)->not->toBeNull();
});

it('does not call Google when voice consent is missing or speech is disabled', function () {
    config([
        'services.google_cloud.speech_api_key' => 'test-speech-key',
        'services.google_cloud.speech_enabled' => false,
    ]);
    Http::fake();

    $buyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);
    $message = ($this->makeWavMessage)($buyer, $conversation);

    $this->actingAs($buyer)
        ->postJson("/api/conversations/{$conversation->id}/messages/{$message->id}/transcription")
        ->assertForbidden();

    $this->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk();

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$message->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'disabled');

    Http::assertNothingSent();
    expect(DB::table('google_speech_monthly_usage')->count())->toBe(0);
});

it('transcribes an opted-in voice note, translates it to Urdu, and enforces the monthly minute cap', function () {
    config([
        'services.google_cloud.speech_api_key' => 'test-speech-key',
        'services.google_cloud.speech_enabled' => true,
        'services.google_cloud.speech_monthly_minutes' => 1,
        'services.google_cloud.translation_api_key' => 'test-translation-key',
        'services.google_cloud.translation_enabled' => true,
        'services.google_cloud.translation_monthly_character_limit' => 400000,
    ]);
    Http::fake([
        'speech.googleapis.com/*' => Http::response([
            'results' => [
                ['alternatives' => [['transcript' => 'Hello, please send the quotation.']]],
            ],
        ]),
        'translation.googleapis.com/language/translate/v2*' => Http::response([
            'data' => [
                'translations' => [[
                    'translatedText' => 'براہ کرم قیمت بھیجیں۔',
                    'detectedSourceLanguage' => 'en',
                ]],
            ],
        ]),
    ]);

    $buyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);
    $firstMessage = ($this->makeWavMessage)($buyer, $conversation, 60);
    $secondMessage = ($this->makeWavMessage)($buyer, $conversation, 60);

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk();

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$firstMessage->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_body', 'Hello, please send the quotation.')
        ->assertJsonPath('data.transcription_translated_body', 'براہ کرم قیمت بھیجیں۔')
        ->assertJsonPath('data.transcription_buyer_body', 'Hello, please send the quotation.')
        ->assertJsonPath('data.transcription_buyer_language', 'en')
        ->assertJsonPath('data.transcription_buyer_status', 'transcribed')
        ->assertJsonPath('data.transcription_status', 'translated');

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$secondMessage->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'quota_exceeded');

    Http::assertSentCount(3);
    Http::assertSent(fn ($request) =>
        str_contains($request->url(), 'key=test-speech-key')
        && $request['config']['encoding'] === 'LINEAR16'
        && $request['config']['sampleRateHertz'] === 16000
        && $request['config']['languageCode'] === 'en-US'
    );
    Http::assertSent(fn ($request) =>
        str_contains($request->url(), 'translation.googleapis.com')
        && $request['target'] === 'ur'
    );
    Http::assertSent(fn ($request) =>
        str_contains($request->url(), 'translation.googleapis.com')
        && $request['target'] === 'en'
    );
    expect(DB::table('google_speech_monthly_usage')->value('speech_seconds_reserved'))->toBe(60);
});

it('rejects voice notes over one minute before spending speech quota', function () {
    config([
        'services.google_cloud.speech_api_key' => 'test-speech-key',
        'services.google_cloud.speech_enabled' => true,
        'services.google_cloud.speech_monthly_minutes' => 50,
    ]);
    Http::fake();

    $buyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);
    $message = ($this->makeWavMessage)($buyer, $conversation, 61);

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk();

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$message->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'audio_too_long');

    Http::assertNothingSent();
    expect(DB::table('google_speech_monthly_usage')->count())->toBe(0);
});

it('supports web voice notes and reserves their measured seconds', function () {
    config([
        'services.google_cloud.speech_api_key' => 'test-speech-key',
        'services.google_cloud.speech_enabled' => true,
        'services.google_cloud.speech_monthly_minutes' => 50,
        'services.google_cloud.translation_api_key' => 'test-translation-key',
        'services.google_cloud.translation_enabled' => true,
    ]);
    Http::fake([
        'speech.googleapis.com/*' => Http::response([
            'results' => [['alternatives' => [['transcript' => 'Hello there.']]]],
        ]),
        'translation.googleapis.com/language/translate/v2*' => Http::response([
            'data' => ['translations' => [[
                'translatedText' => 'السلام عليكم',
                'detectedSourceLanguage' => 'en',
            ]]],
        ]),
    ]);

    $buyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);
    $message = ($this->makeWebmMessage)($buyer, $conversation, 1.5);

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk();

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$message->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'translated');

    Http::assertSent(fn ($request) =>
        str_contains($request->url(), 'speech.googleapis.com')
        && $request['config']['encoding'] === 'WEBM_OPUS'
        && $request['config']['sampleRateHertz'] === 48000
    );
    expect(DB::table('google_speech_monthly_usage')->value('speech_seconds_reserved'))->toBe(2);
});

it('transcribes AMR wideband and Ogg Opus voice notes', function () {
    config([
        'services.google_cloud.speech_api_key' => 'test-speech-key',
        'services.google_cloud.speech_enabled' => true,
        'services.google_cloud.speech_monthly_minutes' => 50,
        'services.google_cloud.translation_enabled' => false,
    ]);
    Http::fake([
        'speech.googleapis.com/*' => Http::response([
            'results' => [['alternatives' => [['transcript' => 'Hello there.']]]],
        ]),
    ]);

    $buyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($buyer);
    $amrWideband = "#!AMR-WB\n".str_repeat("\x04".str_repeat("\0", 17), 50);
    $amrMessage = ($this->makeRawVoiceMessage)(
        $buyer,
        $conversation,
        'voice.awb',
        'audio/amr-wb',
        $amrWideband
    );

    $oggPage = static function (string $payload, int $granule, int $sequence, int $flags): string {
        return 'OggS'
            .chr(0)
            .chr($flags)
            .pack('V2', $granule, 0)
            .pack('V', 1)
            .pack('V', $sequence)
            .pack('V', 0)
            .chr(1)
            .chr(strlen($payload))
            .$payload;
    };
    $opusHead = 'OpusHead'.chr(1).chr(1).pack('v', 0).pack('V', 48000).pack('v', 0).chr(0);
    $oggOpus = $oggPage($opusHead, 0, 0, 2).$oggPage("\x00", 48000, 1, 4);
    $oggMessage = ($this->makeRawVoiceMessage)(
        $buyer,
        $conversation,
        'voice.ogg',
        'audio/ogg',
        $oggOpus
    );

    $this->actingAs($buyer)
        ->patchJson("/api/conversations/{$conversation->id}/voice-translation-consent", ['enabled' => true])
        ->assertOk();

    $this->postJson("/api/conversations/{$conversation->id}/messages/{$amrMessage->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'transcribed');
    $this->postJson("/api/conversations/{$conversation->id}/messages/{$oggMessage->id}/transcription")
        ->assertOk()
        ->assertJsonPath('data.transcription_status', 'transcribed');

    Http::assertSentCount(2);
    Http::assertSent(fn ($request) =>
        $request['config']['encoding'] === 'AMR_WB'
        && $request['config']['sampleRateHertz'] === 16000
    );
    Http::assertSent(fn ($request) =>
        $request['config']['encoding'] === 'OGG_OPUS'
        && $request['config']['sampleRateHertz'] === 48000
    );
    expect(DB::table('google_speech_monthly_usage')->value('speech_seconds_reserved'))->toBe(2);
});

it('does not expose another buyer message for transcription', function () {
    $owner = ($this->makeBuyer)();
    $otherBuyer = ($this->makeBuyer)();
    $conversation = ($this->makeConversation)($owner);
    $message = ($this->makeWavMessage)($owner, $conversation);

    $this->actingAs($otherBuyer)
        ->postJson("/api/conversations/{$conversation->id}/messages/{$message->id}/transcription")
        ->assertForbidden();
});
