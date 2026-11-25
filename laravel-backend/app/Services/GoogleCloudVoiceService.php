<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Support\MediaStorage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class GoogleCloudVoiceService
{
    private const SPEECH_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';

    private const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

    private const MAX_SYNC_AUDIO_SECONDS = 60.0;

    /**
     * @return array{
     *   transcription_body:?string,
     *   transcription_translated_body:?string,
     *   transcription_source_language:?string,
     *   transcription_target_language:?string,
     *   transcription_buyer_body:?string,
     *   transcription_buyer_language:?string,
     *   transcription_buyer_status:string,
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
        $absolutePath = MediaStorage::absolutePath($message->attachment_path);
        if (! $absolutePath || ! is_file($absolutePath)) {
            return $this->transcriptionResult(null, null, null, null, 'audio_unavailable');
        }

        $size = filesize($absolutePath);
        if ($size === false || $size <= 0 || $size > self::MAX_AUDIO_BYTES) {
            return $this->transcriptionResult(null, null, null, null, 'audio_too_large');
        }

        $audio = file_get_contents($absolutePath);
        if (! is_string($audio)) {
            return $this->transcriptionResult(null, null, null, null, 'unsupported_audio_format');
        }

        $format = $this->recognitionFormat($mime, (string) $message->attachment_name, $audio);
        if (! $format || ! $this->matchesAudioFormat($audio, $format['encoding'])) {
            return $this->transcriptionResult(null, null, null, null, 'unsupported_audio_format');
        }

        $translator = app(GoogleCloudTranslationService::class);
        $buyer = $conversation->creator()->with('profile')->first();
        if (! $buyer) {
            return $this->transcriptionResult(null, null, null, null, 'buyer_unavailable');
        }

        $buyerLanguage = $translator->buyerLanguage($buyer, $conversation->buyer_language);
        $sourceLocale = $this->speechLocale($buyerLanguage);
        if (! $sourceLocale) {
            return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'unsupported_language', $buyerLanguage);
        }

        $durationSeconds = $this->audioDurationSeconds($audio, $format['encoding']);
        if ($durationSeconds === null) {
            return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'unsupported_audio_format', $buyerLanguage);
        }
        if ($durationSeconds <= 0 || $durationSeconds > self::MAX_SYNC_AUDIO_SECONDS) {
            return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'audio_too_long', $buyerLanguage);
        }

        if (! $this->reserveSpeechSeconds((int) ceil($durationSeconds))) {
            return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'quota_exceeded', $buyerLanguage);
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
                return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'failed', $buyerLanguage);
            }

            $transcript = collect($response->json('results', []))
                ->map(fn ($result) => trim((string) data_get($result, 'alternatives.0.transcript', '')))
                ->filter()
                ->implode(' ');

            if ($transcript === '') {
                return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'no_speech_detected', $buyerLanguage);
            }

            $staffTranslation = $translator->translate($transcript, 'ur');
            $buyerTranslation = $buyerLanguage === 'ur'
                ? $staffTranslation
                : $translator->translate($transcript, $buyerLanguage);

            $staffBody = $staffTranslation['translation_status'] === 'not_needed'
                ? $transcript
                : $staffTranslation['translated_body'];
            $buyerBody = $buyerTranslation['translation_status'] === 'not_needed'
                ? $transcript
                : $buyerTranslation['translated_body'];
            $staffStatus = $staffTranslation['translation_status'] === 'not_needed'
                ? 'transcribed'
                : $staffTranslation['translation_status'];
            $buyerStatus = $buyerTranslation['translation_status'] === 'not_needed'
                ? 'transcribed'
                : $buyerTranslation['translation_status'];

            return [
                ...$this->transcriptionResult(
                    $transcript,
                    $staffBody,
                    $buyerLanguage,
                    'ur',
                    $staffStatus,
                    $buyerLanguage
                ),
                'transcription_buyer_body' => $buyerBody,
                'transcription_buyer_language' => $buyerLanguage,
                'transcription_buyer_status' => $buyerStatus,
                'transcription_status' => $staffStatus === 'translated' || $buyerStatus === 'translated'
                    ? 'translated'
                    : 'transcribed',
            ];
        } catch (Throwable) {
            return $this->transcriptionResult(null, null, $buyerLanguage, 'ur', 'failed', $buyerLanguage);
        }
    }

    public function transcriptionResult(
        ?string $sourceText,
        ?string $translatedText,
        ?string $sourceLanguage,
        ?string $targetLanguage,
        string $status,
        ?string $buyerLanguage = null
    ): array {
        return [
            'transcription_body' => $sourceText,
            'transcription_translated_body' => $translatedText,
            'transcription_source_language' => $sourceLanguage,
            'transcription_target_language' => $targetLanguage,
            'transcription_buyer_body' => null,
            'transcription_buyer_language' => $buyerLanguage,
            'transcription_buyer_status' => $status,
            'transcription_status' => $status,
        ];
    }

    private function recognitionFormat(string $mime, string $name, string $bytes): ?array
    {
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if (str_starts_with($bytes, "#!AMR-WB\n")) {
            return ['encoding' => 'AMR_WB', 'sample_rate' => 16000];
        }
        if (str_starts_with($bytes, "#!AMR\n")) {
            return ['encoding' => 'AMR', 'sample_rate' => 8000];
        }
        if (str_starts_with($bytes, 'OggS') && str_contains($bytes, 'OpusHead')) {
            return ['encoding' => 'OGG_OPUS', 'sample_rate' => 48000];
        }

        return match (true) {
            $mime === 'audio/wav' || $mime === 'audio/x-wav' || $extension === 'wav' => [
                'encoding' => 'LINEAR16',
                'sample_rate' => 16000,
            ],
            $mime === 'audio/amr-wb' || $extension === 'awb' => [
                'encoding' => 'AMR_WB',
                'sample_rate' => 16000,
            ],
            $mime === 'audio/amr' || $extension === 'amr' => [
                'encoding' => 'AMR',
                'sample_rate' => 8000,
            ],
            $mime === 'audio/ogg' || $mime === 'application/ogg' || $extension === 'ogg' || $extension === 'opus' => [
                'encoding' => 'OGG_OPUS',
                'sample_rate' => 48000,
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
            'LINEAR16' => strlen($bytes) > 44
                && substr($bytes, 0, 4) === 'RIFF'
                && substr($bytes, 8, 4) === 'WAVE',
            'AMR' => str_starts_with($bytes, '#!AMR'),
            'AMR_WB' => str_starts_with($bytes, "#!AMR-WB\n"),
            'OGG_OPUS' => str_starts_with($bytes, 'OggS') && str_contains($bytes, 'OpusHead'),
            'WEBM_OPUS' => str_starts_with($bytes, "\x1A\x45\xDF\xA3"),
            default => false,
        };
    }

    private function audioDurationSeconds(string $bytes, string $encoding): ?float
    {
        if ($encoding === 'LINEAR16') {
            if (strlen($bytes) < 44) {
                return null;
            }

            $sampleRate = unpack('Vvalue', substr($bytes, 24, 4))['value'] ?? 0;
            $channels = unpack('vvalue', substr($bytes, 22, 2))['value'] ?? 0;
            $bitsPerSample = unpack('vvalue', substr($bytes, 34, 2))['value'] ?? 0;
            $format = unpack('vvalue', substr($bytes, 20, 2))['value'] ?? 0;
            if ($format !== 1 || $sampleRate < 8000 || $sampleRate > 48000 || $channels !== 1 || $bitsPerSample !== 16) {
                return null;
            }

            $offset = 12;
            $length = strlen($bytes);
            while ($offset + 8 <= $length) {
                $chunkName = substr($bytes, $offset, 4);
                $chunkSize = unpack('Vvalue', substr($bytes, $offset + 4, 4))['value'] ?? 0;
                if ($chunkName === 'data') {
                    return $chunkSize / ($sampleRate * $channels * ($bitsPerSample / 8));
                }
                $offset += 8 + $chunkSize + ($chunkSize % 2);
            }

            return null;
        }

        if ($encoding === 'AMR' || $encoding === 'AMR_WB') {
            $isWideband = $encoding === 'AMR_WB';
            $frameBytes = $isWideband
                ? [18, 24, 33, 37, 41, 47, 51, 59, 61, 6, 0, 0, 0, 0, 0, 1]
                : [12, 13, 15, 17, 19, 20, 26, 31, 5, 0, 0, 0, 0, 0, 0, 1];
            $offset = $isWideband ? 9 : 6;
            $header = $isWideband ? "#!AMR-WB\n" : '#!AMR\n';
            if (! str_starts_with($bytes, $header)) {
                return null;
            }

            $frames = 0;
            $length = strlen($bytes);

            while ($offset < $length) {
                $frameHeader = ord($bytes[$offset]);
                $frameType = ($frameHeader >> 3) & 0x0F;
                $totalBytes = $frameBytes[$frameType] ?? 0;
                if ($totalBytes < 1 || $offset + $totalBytes > $length) {
                    return null;
                }
                $offset += $totalBytes;
                $frames++;
            }

            return $frames * 0.02;
        }

        if ($encoding === 'OGG_OPUS') {
            return $this->oggOpusDurationSeconds($bytes);
        }

        if ($encoding === 'WEBM_OPUS') {
            return $this->webmDurationSeconds($bytes);
        }

        return null;
    }

    private function oggOpusDurationSeconds(string $bytes): ?float
    {
        if (! str_starts_with($bytes, 'OggS') || ! str_contains($bytes, 'OpusHead')) {
            return null;
        }

        $length = strlen($bytes);
        $offset = 0;
        $lastGranule = null;

        while ($offset < $length) {
            if ($offset + 27 > $length || substr($bytes, $offset, 4) !== 'OggS' || ord($bytes[$offset + 4]) !== 0) {
                return null;
            }

            $granule = unpack('Vlow/Vhigh', substr($bytes, $offset + 6, 8));
            if (! is_array($granule)) {
                return null;
            }
            $low = (int) ($granule['low'] ?? 0);
            $high = (int) ($granule['high'] ?? 0);
            if (! ($low === 0xFFFFFFFF && $high === 0xFFFFFFFF)) {
                if ($high !== 0) {
                    return null;
                }
                $lastGranule = $low;
            }

            $segmentCount = ord($bytes[$offset + 26]);
            $lacingOffset = $offset + 27;
            if ($lacingOffset + $segmentCount > $length) {
                return null;
            }

            $payloadLength = 0;
            for ($index = 0; $index < $segmentCount; $index++) {
                $payloadLength += ord($bytes[$lacingOffset + $index]);
            }
            $pageEnd = $lacingOffset + $segmentCount + $payloadLength;
            if ($pageEnd > $length) {
                return null;
            }
            $offset = $pageEnd;
        }

        return $lastGranule !== null && $lastGranule > 0
            ? $lastGranule / 48000
            : null;
    }

    private function webmDurationSeconds(string $bytes): ?float
    {
        $infoOffset = strpos($bytes, "\x15\x49\xA9\x66");
        if ($infoOffset === false) {
            return null;
        }

        $cursor = $infoOffset + 4;
        $infoSize = $this->readEbmlVint($bytes, $cursor, true);
        if (! $infoSize) {
            return null;
        }
        $cursor += $infoSize['length'];
        $end = min(strlen($bytes), $cursor + $infoSize['value']);
        $timecodeScale = 1_000_000;
        $duration = null;

        while ($cursor < $end) {
            $elementStart = $cursor;
            $elementId = $this->readEbmlVint($bytes, $cursor, false);
            if (! $elementId) {
                return null;
            }
            $cursor += $elementId['length'];
            $elementSize = $this->readEbmlVint($bytes, $cursor, true);
            if (! $elementSize) {
                return null;
            }
            $cursor += $elementSize['length'];
            $payloadEnd = $cursor + $elementSize['value'];
            if ($payloadEnd > $end) {
                return null;
            }

            $idBytes = bin2hex(substr($bytes, $elementStart, $elementId['length']));
            if ($idBytes === '2ad7b1' && $elementSize['value'] > 0 && $elementSize['value'] <= 8) {
                $timecodeScale = $this->readUnsignedBigEndian(substr($bytes, $cursor, $elementSize['value']));
                if ($timecodeScale <= 0 || $timecodeScale > 10_000_000) {
                    return null;
                }
            } elseif ($idBytes === '4489' && in_array($elementSize['value'], [4, 8], true)) {
                $unpacked = unpack($elementSize['value'] === 8 ? 'Evalue' : 'Gvalue', substr($bytes, $cursor, $elementSize['value']));
                $duration = is_array($unpacked) ? (float) ($unpacked['value'] ?? 0) : null;
            }

            $cursor = $payloadEnd;
        }

        if ($duration === null || $duration <= 0 || $timecodeScale <= 0) {
            return null;
        }

        return $duration * $timecodeScale / 1_000_000_000;
    }

    private function readEbmlVint(string $bytes, int $offset, bool $removeMarker): ?array
    {
        if ($offset >= strlen($bytes)) {
            return null;
        }

        $first = ord($bytes[$offset]);
        if ($first === 0) {
            return null;
        }

        $mask = 0x80;
        $length = 1;
        while (($first & $mask) === 0 && $length <= 8) {
            $mask >>= 1;
            $length++;
        }
        if ($length > 8 || $offset + $length > strlen($bytes)) {
            return null;
        }

        $value = $removeMarker ? ($first & ($mask - 1)) : $first;
        for ($index = 1; $index < $length; $index++) {
            $value = ($value * 256) + ord($bytes[$offset + $index]);
        }

        return ['value' => $value, 'length' => $length];
    }

    private function readUnsignedBigEndian(string $bytes): int
    {
        $value = 0;
        for ($index = 0, $length = strlen($bytes); $index < $length; $index++) {
            $value = ($value * 256) + ord($bytes[$index]);
        }

        return $value;
    }

    private function speechLocale(string $language): ?string
    {
        $base = strtolower(explode('-', $language)[0]);

        return match ($base) {
            'ar' => 'ar-SA',
            'bn' => 'bn-IN',
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
            'zh' => str_contains(strtolower($language), 'tw') ? 'cmn-Hant-TW' : 'cmn-Hans-CN',
            default => null,
        };
    }

    private function reserveSpeechSeconds(int $seconds): bool
    {
        $limitSeconds = max(0, (int) config('services.google_cloud.speech_monthly_minutes', 50)) * 60;
        if ($limitSeconds === 0 || $seconds <= 0) {
            return false;
        }

        $period = now()->format('Y-m');

        return DB::transaction(function () use ($period, $limitSeconds, $seconds): bool {
            DB::table('google_speech_monthly_usage')->insertOrIgnore([
                'period' => $period,
                'speech_seconds_reserved' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $usage = DB::table('google_speech_monthly_usage')->where('period', $period)->lockForUpdate()->first();
            if (! $usage || (int) $usage->speech_seconds_reserved + $seconds > $limitSeconds) {
                return false;
            }

            DB::table('google_speech_monthly_usage')->where('period', $period)->update([
                'speech_seconds_reserved' => (int) $usage->speech_seconds_reserved + $seconds,
                'updated_at' => now(),
            ]);

            return true;
        });
    }

}
