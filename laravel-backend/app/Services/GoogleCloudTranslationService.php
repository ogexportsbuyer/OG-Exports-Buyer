<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class GoogleCloudTranslationService
{
    private const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

    /**
     * @return array{translated_body:?string, source_language:?string, target_language:string, translation_status:string}
     */
    public function translate(string $text, string $targetLanguage): array
    {
        $targetLanguage = $this->normalizeLanguageCode($targetLanguage) ?? 'ur';
        $text = trim($text);

        if ($text === '') {
            return $this->result(null, null, $targetLanguage, 'not_needed');
        }

        $apiKey = (string) config('services.google_cloud.translation_api_key', '');
        if ($apiKey === '') {
            return $this->result(null, null, $targetLanguage, 'not_configured');
        }

        if (! config('services.google_cloud.translation_enabled', false)) {
            return $this->result(null, null, $targetLanguage, 'disabled');
        }

        $characterCount = mb_strlen($text, 'UTF-8');
        if (! $this->reserveMonthlyCharacters($characterCount)) {
            return $this->result(null, null, $targetLanguage, 'quota_exceeded');
        }

        try {
            $response = Http::timeout(8)->post(self::ENDPOINT.'?key='.urlencode($apiKey), [
                'q' => $text,
                'target' => $targetLanguage,
                'format' => 'text',
            ]);

            if (! $response->successful()) {
                return $this->result(null, null, $targetLanguage, 'failed');
            }

            $translation = $response->json('data.translations.0.translatedText');
            if (! is_string($translation) || trim($translation) === '') {
                return $this->result(null, null, $targetLanguage, 'failed');
            }

            $sourceLanguage = $this->normalizeLanguageCode(
                $response->json('data.translations.0.detectedSourceLanguage')
            );

            if ($sourceLanguage === $targetLanguage) {
                return $this->result(null, $sourceLanguage, $targetLanguage, 'not_needed');
            }

            return $this->result(
                html_entity_decode($translation, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                $sourceLanguage,
                $targetLanguage,
                'translated'
            );
        } catch (Throwable) {
            return $this->result(null, null, $targetLanguage, 'failed');
        }
    }

    /**
     * @param  list<string>  $texts
     * @return list<array{translated_body:?string, source_language:?string, target_language:string, translation_status:string}>
     */
    public function translateMany(array $texts, string $targetLanguage): array
    {
        $targetLanguage = $this->normalizeLanguageCode($targetLanguage) ?? 'ur';
        $results = [];
        $pending = [];

        foreach (array_values($texts) as $index => $rawText) {
            $text = trim($rawText);
            $results[$index] = $this->result(null, null, $targetLanguage, 'not_needed');
            if ($text !== '') {
                $pending[$index] = $text;
            }
        }

        if ($pending === []) {
            return array_values($results);
        }

        $apiKey = (string) config('services.google_cloud.translation_api_key', '');
        $unavailableStatus = $apiKey === ''
            ? 'not_configured'
            : (! config('services.google_cloud.translation_enabled', false) ? 'disabled' : null);
        if ($unavailableStatus !== null) {
            foreach (array_keys($pending) as $index) {
                $results[$index] = $this->result(null, null, $targetLanguage, $unavailableStatus);
            }

            return array_values($results);
        }

        $chunks = [];
        $currentChunk = [];
        $currentCharacters = 0;
        foreach ($pending as $index => $text) {
            $length = mb_strlen($text, 'UTF-8');
            if ($currentChunk !== [] && (count($currentChunk) >= 50 || $currentCharacters + $length > 20000)) {
                $chunks[] = [$currentChunk, $currentCharacters];
                $currentChunk = [];
                $currentCharacters = 0;
            }
            $currentChunk[$index] = $text;
            $currentCharacters += $length;
        }
        if ($currentChunk !== []) {
            $chunks[] = [$currentChunk, $currentCharacters];
        }

        foreach ($chunks as [$chunk, $characterCount]) {
            if (! $this->reserveMonthlyCharacters($characterCount)) {
                foreach (array_keys($chunk) as $index) {
                    $results[$index] = $this->result(null, null, $targetLanguage, 'quota_exceeded');
                }
                continue;
            }

            try {
                $response = Http::timeout(15)->post(self::ENDPOINT.'?key='.urlencode($apiKey), [
                    'q' => array_values($chunk),
                    'target' => $targetLanguage,
                    'format' => 'text',
                ]);
                $translations = $response->json('data.translations', []);
                if (! $response->successful() || ! is_array($translations) || count($translations) !== count($chunk)) {
                    foreach (array_keys($chunk) as $index) {
                        $results[$index] = $this->result(null, null, $targetLanguage, 'failed');
                    }
                    continue;
                }

                foreach (array_keys($chunk) as $chunkIndex => $resultIndex) {
                    $translation = $translations[$chunkIndex] ?? [];
                    $translatedText = is_array($translation) ? ($translation['translatedText'] ?? null) : null;
                    if (! is_string($translatedText) || trim($translatedText) === '') {
                        $results[$resultIndex] = $this->result(null, null, $targetLanguage, 'failed');
                        continue;
                    }

                    $sourceLanguage = $this->normalizeLanguageCode($translation['detectedSourceLanguage'] ?? null);
                    $results[$resultIndex] = $sourceLanguage === $targetLanguage
                        ? $this->result(null, $sourceLanguage, $targetLanguage, 'not_needed')
                        : $this->result(
                            html_entity_decode($translatedText, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                            $sourceLanguage,
                            $targetLanguage,
                            'translated'
                        );
                }
            } catch (Throwable) {
                foreach (array_keys($chunk) as $index) {
                    $results[$index] = $this->result(null, null, $targetLanguage, 'failed');
                }
            }
        }

        ksort($results);

        return array_values($results);
    }

    public function buyerLanguage(User $buyer, ?string $requestedLanguage = null): string
    {
        $requested = $this->normalizeLanguageCode($requestedLanguage);
        if ($requested) {
            return $requested;
        }

        $profile = $buyer->profile;
        $meta = is_array($profile?->meta) ? $profile->meta : [];
        $saved = $this->normalizeLanguageCode(
            $meta['support_language'] ?? $meta['chat_language'] ?? null
        );

        return $saved ?? $this->languageForCountry((string) ($profile?->country ?? ''));
    }

    /**
     * @return list<array{code:string, name:string}>
     */
    public function supportedLanguages(): array
    {
        $fallback = [
            ['code' => 'ar', 'name' => 'Arabic'],
            ['code' => 'bn', 'name' => 'Bengali'],
            ['code' => 'zh-CN', 'name' => 'Chinese (Simplified)'],
            ['code' => 'nl', 'name' => 'Dutch'],
            ['code' => 'en', 'name' => 'English'],
            ['code' => 'fr', 'name' => 'French'],
            ['code' => 'de', 'name' => 'German'],
            ['code' => 'hi', 'name' => 'Hindi'],
            ['code' => 'id', 'name' => 'Indonesian'],
            ['code' => 'it', 'name' => 'Italian'],
            ['code' => 'ja', 'name' => 'Japanese'],
            ['code' => 'ko', 'name' => 'Korean'],
            ['code' => 'ms', 'name' => 'Malay'],
            ['code' => 'fa', 'name' => 'Persian'],
            ['code' => 'pl', 'name' => 'Polish'],
            ['code' => 'pt', 'name' => 'Portuguese'],
            ['code' => 'ru', 'name' => 'Russian'],
            ['code' => 'es', 'name' => 'Spanish'],
            ['code' => 'th', 'name' => 'Thai'],
            ['code' => 'tr', 'name' => 'Turkish'],
            ['code' => 'ur', 'name' => 'Urdu'],
            ['code' => 'vi', 'name' => 'Vietnamese'],
        ];

        $apiKey = (string) config('services.google_cloud.translation_api_key', '');
        if ($apiKey === '' || ! config('services.google_cloud.translation_enabled', false)) {
            return $fallback;
        }

        $cacheKey = 'google-cloud-translation-languages-en-'.hash('sha256', $apiKey);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($apiKey, $fallback) {
            try {
                $response = Http::timeout(8)->get(self::ENDPOINT.'/languages', [
                    'key' => $apiKey,
                    'target' => 'en',
                ]);

                if (! $response->successful()) {
                    return $fallback;
                }

                $languages = collect($response->json('data.languages', []))
                    ->map(fn ($language) => [
                        'code' => $this->normalizeLanguageCode($language['language'] ?? null),
                        'name' => is_string($language['name'] ?? null) ? trim($language['name']) : '',
                    ])
                    ->filter(fn (array $language) => $language['code'] && $language['name'] !== '')
                    ->unique('code')
                    ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                    ->values()
                    ->all();

                return $languages !== [] ? $languages : $fallback;
            } catch (Throwable) {
                return $fallback;
            }
        });
    }

    public function languageForCountry(string $country): string
    {
        $country = mb_strtolower(trim($country));

        return match (true) {
            in_array($country, ['pakistan', 'pak'], true) => 'ur',
            in_array($country, ['saudi arabia', 'saudi', 'uae', 'united arab emirates', 'qatar', 'oman', 'kuwait', 'bahrain', 'egypt', 'jordan', 'iraq', 'lebanon', 'morocco', 'algeria', 'tunisia'], true) => 'ar',
            in_array($country, ['turkey', 'türkiye'], true) => 'tr',
            in_array($country, ['china', 'mainland china'], true) => 'zh-CN',
            in_array($country, ['taiwan'], true) => 'zh-TW',
            in_array($country, ['japan'], true) => 'ja',
            in_array($country, ['south korea', 'korea, republic of'], true) => 'ko',
            in_array($country, ['bangladesh'], true) => 'bn',
            in_array($country, ['india'], true) => 'hi',
            in_array($country, ['iran'], true) => 'fa',
            in_array($country, ['russia'], true) => 'ru',
            in_array($country, ['germany', 'austria'], true) => 'de',
            in_array($country, ['france', 'belgium'], true) => 'fr',
            in_array($country, ['spain', 'mexico', 'colombia', 'argentina', 'chile', 'peru'], true) => 'es',
            in_array($country, ['italy'], true) => 'it',
            in_array($country, ['brazil', 'portugal'], true) => 'pt',
            in_array($country, ['netherlands'], true) => 'nl',
            in_array($country, ['poland'], true) => 'pl',
            in_array($country, ['indonesia'], true) => 'id',
            in_array($country, ['thailand'], true) => 'th',
            in_array($country, ['vietnam'], true) => 'vi',
            in_array($country, ['ukraine'], true) => 'uk',
            default => 'en',
        };
    }

    public function normalizeLanguageCode(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);
        if (! preg_match('/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/', $value)) {
            return null;
        }

        return $value;
    }

    /**
     * @return array{translated_body:?string, source_language:?string, target_language:string, translation_status:string}
     */
    private function result(?string $translation, ?string $source, string $target, string $status): array
    {
        return [
            'translated_body' => $translation,
            'source_language' => $source,
            'target_language' => $target,
            'translation_status' => $status,
        ];
    }

    private function reserveMonthlyCharacters(int $characterCount): bool
    {
        $limit = max(0, (int) config('services.google_cloud.translation_monthly_character_limit', 400000));
        if ($limit === 0 || $characterCount <= 0) {
            return false;
        }

        $period = now()->format('Y-m');

        return DB::transaction(function () use ($period, $characterCount, $limit): bool {
            DB::table('google_translation_monthly_usage')->insertOrIgnore([
                'period' => $period,
                'characters' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $usage = DB::table('google_translation_monthly_usage')
                ->where('period', $period)
                ->lockForUpdate()
                ->first();

            if (! $usage || ((int) $usage->characters + $characterCount) > $limit) {
                return false;
            }

            DB::table('google_translation_monthly_usage')
                ->where('period', $period)
                ->update([
                    'characters' => (int) $usage->characters + $characterCount,
                    'updated_at' => now(),
                ]);

            return true;
        });
    }
}
