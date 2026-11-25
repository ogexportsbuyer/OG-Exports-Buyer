<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Support\MediaStorage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class GoogleCloudVoiceService
{
    private const SPEECH_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';

    private const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

    private const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

    private const MAX_SYNC_AUDIO_SECONDS = 60;

    /**
     * @return array{
     *   transcription_body:?string,
     *   transcription_translated_body:?string,
     *   transcription_source_language:?string,
     *   transcription_target_language:?string,
     *   transcription_status:string
     * }
     */
    public function transcribeBuyerVoiceMessage(Message $message, Conversation $conversation): array
    {
        $key = (string) config('services.google_cloud.speech_api_key', '');
        if ($key === '') {
            return $this->transcriptionResult(null, null, null, null, 'not_configured');
        }

        if (! config('services.google_cloud.speech_enabled', false)) {
            return $this->transcriptionResult(null, null, null, null, 'disabled');
        }

        $mime = strtolower((string) $message->attachment_mime);
        $format = $this->recognitionFormat($mime, (string) $message->attachment_name);
        if (! $format) {
            return $this->transcriptionResult(null, null, null, null, 'unsupported_audio_format');
        }

        $absolutePath = MediaStorage::absolutePath($message->attachment_path);
        if (! $absolutePath || ! is_file($absolutePath)) {
            return $this->transcriptionResult(null, null, null, null, 'audio_unavailable');
        }

        $size = filesize($absolutePath);
        if ($size === false || $size <= 0 || $size > self::MAX_AUDIO_BYTES) {
            return $this->transcriptionResult(null, null, null, null, 'audio_too_large');
        }

        $audio = file_get_contents($absolutePath);
        if (! is_string($audio) || ! $this->matchesAudioFormat($audio, $format['encoding'])) {
            return $this->transcriptionResult(null, null, null, null, 'unsupported_audio_format');
        }

        if (! $this->reserveSpeechMinute()) {
            return $this->transcriptionResult(null, null, null, null, 'quota_exceeded');
        }

        $translator = app(GoogleCloudTranslationService::class);
        $sourceLanguage = $translator->buyerLanguage(
            $conversation->creator()->with('profile')->first() ?? $message->sender()->with('profile')->firstOrFail()
        );
        $sourceLocale = $this->speechLocale($sourceLanguage);
        if (! $sourceLocale) {
            return $this->transcriptionResult(null, null, $sourceLanguage, 'ur', 'unsupported_language');
        }

        try {
            $response = Http::timeout(25)->post(self::SPEECH_ENDPOINT.'?key='.urlencode($key), [
                'config' => [
                    'encoding' => $format['encoding'],
                    'sampleRateHertz' => $format['sample_rate'],
                    'audioChannelCount' => 1,
                    'languageCode' => $sourceLocale,
                    'enableAutomaticPunctuation' => true,
                ],
                'audio' => [
                    'content' => base64_encode($audio),
                ],
            ]);

            if (! $response->successful()) {
                return $this->transcriptionResult(null, null, $sourceLanguage, 'ur', 'failed');
            }

            $transcript = collect($response->json('results', []))
                ->map(fn ($result) => trim((string) data_get($result, 'alternatives.0.transcript', '')))
                ->filter()
                ->implode(' ');

            if ($transcript === '') {
                return $this->transcriptionResult(null, null, $sourceLanguage, 'ur', 'no_speech_detected');
            }

            $translation = $translator->translate($transcript, 'ur');

            return $this->transcriptionResult(
                $transcript,
                $translation['translated_body'],
                $sourceLanguage,
                'ur',
                $translation['translation_status'] === 'translated'
                    ? 'translated'
                    : ($translation['translation_status'] === 'not_needed' ? 'transcribed' : $translation['translation_status'])
            );
        } catch (Throwable) {
            return $this->transcriptionResult(null, null, $sourceLanguage, 'ur', 'failed');
        }
    }

    /**
     * @return array{audio_url:?string, status:string}
     */
    public function translatedAudioUrl(Message $message, Conversation $conversation): array
    {
        $key = (string) config('services.google_cloud.speech_api_key', '');
        if ($key === '') {
            return ['audio_url' => null, 'status' => 'not_configured'];
        }

        if (! config('services.google_cloud.speech_enabled', false)) {
            return ['audio_url' => null, 'status' => 'disabled'];
        }

        $text = trim((string) ($message->translated_body ?: $message->body));
        if ($text === '') {
            return ['audio_url' => null, 'status' => 'no_text'];
        }

        $language = app(GoogleCloudTranslationService::class)->buyerLanguage(
            $conversation->creator()->with('profile')->firstOrFail(),
            $message->target_language ?? $conversation->buyer_language
        );
        $voice = $this->textToSpeechLocale($language);
        if (! $voice) {
            return ['audio_url' => null, 'status' => 'unsupported_language'];
        }

        $path = $this->cachedAudioPath($message, $language);
        $this->purgeExpiredAudio();
        if (! is_file($path)) {
            $characterCount = mb_strlen($text, 'UTF-8');
            if (! $this->reserveTtsCharacters($characterCount)) {
                return ['audio_url' => null, 'status' => 'quota_exceeded'];
            }

            try {
                $response = Http::timeout(25)->post(self::TTS_ENDPOINT.'?key='.urlencode($key), [
                    'input' => ['text' => $text],
                    'voice' => [
                        'languageCode' => $voice['language_code'],
                        'name' => $voice['voice_name'],
                    ],
                    'audioConfig' => [
                        'audioEncoding' => 'MP3',
                        'speakingRate' => 1.0,
                        'pitch' => 0.0,
                    ],
                ]);

                $encodedAudio = $response->json('audioContent');
                $audio = is_string($encodedAudio) ? base64_decode($encodedAudio, true) : false;
                if (! $response->successful() || ! is_string($audio) || $audio === '' || strlen($audio) > 8 * 1024 * 1024) {
                    return ['audio_url' => null, 'status' => 'failed'];
                }

                $directory = dirname($path);
                if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
                    return ['audio_url' => null, 'status' => 'failed'];
                }

                $temporaryPath = tempnam($directory, 'tts-');
                if ($temporaryPath === false) {
                    return ['audio_url' => null, 'status' => 'failed'];
                }

                try {
                    if (file_put_contents($temporaryPath, $audio, LOCK_EX) === false) {
                        return ['audio_url' => null, 'status' => 'failed'];
                    }
                    chmod($temporaryPath, 0600);
                    if (! rename($temporaryPath, $path)) {
                        return ['audio_url' => null, 'status' => 'failed'];
                    }
                } finally {
                    if (is_file($temporaryPath)) {
                        unlink($temporaryPath);
                    }
                }
            } catch (Throwable) {
                return ['audio_url' => null, 'status' => 'failed'];
            }
        }

        return [
            'audio_url' => \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'messages.translated-audio',
                now()->addMinutes(15),
                ['message' => $message->id, 'language' => $language]
            ),
            'status' => 'ready',
        ];
    }

    public function cachedAudioPath(Message $message, string $language): string
    {
        $safeLanguage = preg_replace('/[^a-zA-Z0-9-]/', '', $language) ?: 'en';

        return storage_path('app/private/chat-tts-cache/'.$message->id.'-'.$safeLanguage.'.mp3');
    }

    public function transcriptionResult(
        ?string $sourceText,
        ?string $translatedText,
        ?string $sourceLanguage,
        ?string $targetLanguage,
        string $status
    ): array {
        return [
            'transcription_body' => $sourceText,
            'transcription_translated_body' => $translatedText,
            'transcription_source_language' => $sourceLanguage,
            'transcription_target_language' => $targetLanguage,
            'transcription_status' => $status,
        ];
    }

    private function recognitionFormat(string $mime, string $name): ?array
    {
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        return match (true) {
            $mime === 'audio/wav' || $mime === 'audio/x-wav' || $extension === 'wav' => [
                'encoding' => 'LINEAR16',
                'sample_rate' => 16000,
            ],
            $mime === 'audio/amr' || $extension === 'amr' => [
                'encoding' => 'AMR',
                'sample_rate' => 8000,
            ],
            $mime === 'audio/webm' || str_starts_with($mime, 'audio/webm;') || $extension === 'webm' => [
                'encoding' => 'WEBM_OPUS',
                'sample_rate' => 48000,
            ],
            default => null,
        };
    }

    private function matchesAudioFormat(string $bytes, string $encoding): bool
    {
        return match ($encoding) {
            'LINEAR16' => strlen($bytes) > 44 && substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WAVE',
            'AMR' => str_starts_with($bytes, '#!AMR'),
            'WEBM_OPUS' => str_starts_with($bytes, "\x1A\x45\xDF\xA3"),
            default => false,
        };
    }

    private function speechLocale(string $language): ?string
    {
        $base = strtolower(explode('-', $language)[0]);

        return match ($base) {
            'ar' => 'ar-SA',
            'bn' => 'bn-BD',
            'de' => 'de-DE',
            'en' => 'en-US',
            'es' => 'es-ES',
            'fr' => 'fr-FR',
            'hi' => 'hi-IN',
            'id' => 'id-ID',
            'it' => 'it-IT',
            'ja' => 'ja-JP',
            'ko' => 'ko-KR',
            'ms' => 'ms-MY',
            'nl' => 'nl-NL',
            'pt' => 'pt-BR',
            'ru' => 'ru-RU',
            'th' => 'th-TH',
            'tr' => 'tr-TR',
            'ur' => 'ur-PK',
            'vi' => 'vi-VN',
            'zh' => str_contains(strtolower($language), 'tw') ? 'cmn-TW' : 'cmn-Hans-CN',
            default => null,
        };
    }

    private function textToSpeechLocale(string $language): ?array
    {
        $base = strtolower(explode('-', $language)[0]);

        return match ($base) {
            'ar' => ['language_code' => 'ar-XA', 'voice_name' => 'ar-XA-Standard-A'],
            'bn' => ['language_code' => 'bn-IN', 'voice_name' => 'bn-IN-Standard-A'],
            'de' => ['language_code' => 'de-DE', 'voice_name' => 'de-DE-Standard-A'],
            'en' => ['language_code' => 'en-US', 'voice_name' => 'en-US-Standard-C'],
            'es' => ['language_code' => 'es-ES', 'voice_name' => 'es-ES-Standard-A'],
            'fr' => ['language_code' => 'fr-FR', 'voice_name' => 'fr-FR-Standard-A'],
            'hi' => ['language_code' => 'hi-IN', 'voice_name' => 'hi-IN-Standard-A'],
            'id' => ['language_code' => 'id-ID', 'voice_name' => 'id-ID-Standard-A'],
            'it' => ['language_code' => 'it-IT', 'voice_name' => 'it-IT-Standard-A'],
            'ja' => ['language_code' => 'ja-JP', 'voice_name' => 'ja-JP-Standard-A'],
            'ko' => ['language_code' => 'ko-KR', 'voice_name' => 'ko-KR-Standard-A'],
            'ms' => ['language_code' => 'ms-MY', 'voice_name' => 'ms-MY-Standard-A'],
            'nl' => ['language_code' => 'nl-NL', 'voice_name' => 'nl-NL-Standard-A'],
            'pt' => ['language_code' => 'pt-BR', 'voice_name' => 'pt-BR-Standard-A'],
            'ru' => ['language_code' => 'ru-RU', 'voice_name' => 'ru-RU-Standard-A'],
            'th' => ['language_code' => 'th-TH', 'voice_name' => 'th-TH-Standard-A'],
            'tr' => ['language_code' => 'tr-TR', 'voice_name' => 'tr-TR-Standard-A'],
            'ur' => ['language_code' => 'ur-IN', 'voice_name' => 'ur-IN-Standard-A'],
            'vi' => ['language_code' => 'vi-VN', 'voice_name' => 'vi-VN-Standard-A'],
            'zh' => str_contains(strtolower($language), 'tw')
                ? ['language_code' => 'cmn-TW', 'voice_name' => 'cmn-TW-Standard-A']
                : ['language_code' => 'cmn-CN', 'voice_name' => 'cmn-CN-Standard-A'],
            default => null,
        };
    }

    private function reserveSpeechMinute(): bool
    {
        $limit = max(0, (int) config('services.google_cloud.speech_monthly_minutes', 50));
        if ($limit === 0) {
            return false;
        }

        $period = now()->format('Y-m');

        return DB::transaction(function () use ($period, $limit): bool {
            DB::table('google_speech_monthly_usage')->insertOrIgnore([
                'period' => $period,
                'speech_minutes_reserved' => 0,
                'tts_characters_reserved' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $usage = DB::table('google_speech_monthly_usage')->where('period', $period)->lockForUpdate()->first();
            if (! $usage || (int) $usage->speech_minutes_reserved + 1 > $limit) {
                return false;
            }

            DB::table('google_speech_monthly_usage')->where('period', $period)->update([
                'speech_minutes_reserved' => (int) $usage->speech_minutes_reserved + 1,
                'updated_at' => now(),
            ]);

            return true;
        });
    }

    private function reserveTtsCharacters(int $characterCount): bool
    {
        $limit = max(0, (int) config('services.google_cloud.tts_monthly_character_limit', 300000));
        if ($limit === 0 || $characterCount <= 0) {
            return false;
        }

        $period = now()->format('Y-m');

        return DB::transaction(function () use ($period, $characterCount, $limit): bool {
            DB::table('google_speech_monthly_usage')->insertOrIgnore([
                'period' => $period,
                'speech_minutes_reserved' => 0,
                'tts_characters_reserved' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $usage = DB::table('google_speech_monthly_usage')->where('period', $period)->lockForUpdate()->first();
            if (! $usage || (int) $usage->tts_characters_reserved + $characterCount > $limit) {
                return false;
            }

            DB::table('google_speech_monthly_usage')->where('period', $period)->update([
                'tts_characters_reserved' => (int) $usage->tts_characters_reserved + $characterCount,
                'updated_at' => now(),
            ]);

            return true;
        });
    }

    private function purgeExpiredAudio(): void
    {
        $directory = storage_path('app/private/chat-tts-cache');
        if (! is_dir($directory)) {
            return;
        }

        foreach (glob($directory.'/*.mp3') ?: [] as $path) {
            if (is_file($path) && filemtime($path) < now()->subDay()->timestamp) {
                unlink($path);
            }
        }
    }
}
