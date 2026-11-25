<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Concerns\PaginatesQueries;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\GoogleCloudVoiceService;
use App\Support\MediaPath;
use App\Support\NotifiesUsers;
use App\Services\GoogleCloudTranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    use PaginatesQueries;

    public function translationLanguages(): JsonResponse
    {
        return response()->json([
            'data' => app(GoogleCloudTranslationService::class)->supportedLanguages(),
        ]);
    }

    public function updateBuyerLanguage(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless((int) $conversation->created_by === (int) $request->user()->id, 403);

        $data = $request->validate([
            'buyer_language' => ['required', 'string', 'regex:/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/'],
        ]);

        $translator = app(GoogleCloudTranslationService::class);
        $buyerLanguage = $translator->buyerLanguage(
            $request->user()->loadMissing('profile'),
            $data['buyer_language']
        );
        $conversation->forceFill([
            'buyer_language' => $buyerLanguage,
        ])->save();

        $this->refreshBuyerLanguageTranslations($conversation, $buyerLanguage, $translator);

        return response()->json([
            'data' => [
                'buyer_language' => $conversation->buyer_language,
            ],
        ]);
    }

    public function updateBuyerVoiceTranslationConsent(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('buyer') && (int) $conversation->created_by === (int) $user->id, 403);

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);
        $enabled = (bool) $data['enabled'];

        DB::transaction(function () use ($conversation, $user, $enabled): void {
            $lockedConversation = Conversation::query()
                ->whereKey($conversation->id)
                ->lockForUpdate()
                ->firstOrFail();
            $currentlyEnabled = $lockedConversation->buyer_voice_translation_consent_at !== null
                && $lockedConversation->buyer_voice_translation_consent_revoked_at === null;

            if ($currentlyEnabled === $enabled) {
                return;
            }

            if ($enabled) {
                $lockedConversation->forceFill([
                    'buyer_voice_translation_consent_at' => now(),
                    'buyer_voice_translation_consent_revoked_at' => null,
                ])->save();
            } else {
                $lockedConversation->forceFill([
                    'buyer_voice_translation_consent_revoked_at' => now(),
                ])->save();
            }

            DB::table('buyer_voice_translation_consent_events')->insert([
                'conversation_id' => $lockedConversation->id,
                'buyer_id' => $user->id,
                'enabled' => $enabled,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $conversation->refresh();

        return response()->json([
            'data' => [
                'voice_translation_enabled' => $conversation->buyer_voice_translation_consent_at !== null
                    && $conversation->buyer_voice_translation_consent_revoked_at === null,
                'consented_at' => $conversation->buyer_voice_translation_consent_at,
                'revoked_at' => $conversation->buyer_voice_translation_consent_revoked_at,
            ],
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->with(['participants:id,name,email', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->latest()
            ->paginate($this->perPage($request));

        return response()->json($conversations);
    }

    public function withAdmin(Request $request): JsonResponse
    {
        $user = $request->user();
        $admin = User::role('admin')->orderBy('id')->first();

        if (! $admin) {
            return response()->json(['message' => 'No admin available.'], 404);
        }

        $conversation = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $admin->id))
            ->with(['participants:id,name,email'])
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'subject' => 'Support Chat',
                'created_by' => $user->id,
            ]);
            $conversation->participants()->sync([$user->id, $admin->id]);
            $conversation->load(['participants:id,name,email']);
        }

        $messages = $conversation->messages()
            ->with('sender:id,name,email')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $unread = $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages,
                'unread_count' => $unread,
            ],
        ]);
    }

    public function storeConversation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        $user = $request->user();

        $conversation = Conversation::create([
            'subject' => $data['subject'] ?? null,
            'created_by' => $user->id,
        ]);

        $ids = collect($data['participant_ids'])->push($user->id)->unique()->values()->all();
        $conversation->participants()->sync($ids);

        if (! empty($data['body'])) {
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'body' => $data['body'],
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'data' => $conversation->load(['participants:id,name,email', 'messages']),
        ], 201);
    }

    public function messages(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();

        $conversation = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->findOrFail($conversationId);

        $messages = $conversation->messages()
            ->with('sender:id,name,email')
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate($this->perPage($request));

        return response()->json($messages);
    }

    public function storeMessage(Request $request, int $conversationId): JsonResponse
    {
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'buyer_language' => ['nullable', 'string', 'regex:/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/'],
            'attachment_path' => ['nullable', 'string', 'max:1000'],
            'attachment_url' => ['nullable', 'string', 'max:1000'],
            'attachment_name' => ['nullable', 'string', 'max:255'],
            'attachment_mime' => ['nullable', 'string', 'max:100'],
        ]);

        if (empty($data['body']) && empty($data['attachment_path']) && empty($data['attachment_url'])) {
            return response()->json(['message' => 'Message body or attachment is required.'], 422);
        }

        $data = MediaPath::normalizeAttachmentFields($data);

        $user = $request->user();

        $conversation = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->findOrFail($conversationId);

        $translation = [
            'translated_body' => null,
            'source_language' => null,
            'target_language' => null,
            'translation_status' => 'not_needed',
        ];
        $buyerTranslation = [
            'buyer_translated_body' => null,
            'buyer_translation_language' => null,
            'buyer_translation_status' => 'not_needed',
        ];
        if ($user->hasRole('buyer')) {
            $translator = app(GoogleCloudTranslationService::class);
            $buyerLanguage = $translator->buyerLanguage(
                $user->loadMissing('profile'),
                $data['buyer_language'] ?? $conversation->buyer_language
            );
            $conversation->forceFill(['buyer_language' => $buyerLanguage])->save();
            if (! empty($data['body'])) {
                $translation = $translator->translate($data['body'], 'ur');
                $buyerTranslationResult = $buyerLanguage === 'ur'
                    ? $translation
                    : $translator->translate($data['body'], $buyerLanguage);
                $buyerTranslation = [
                    'buyer_translated_body' => $buyerTranslationResult['translation_status'] === 'not_needed'
                        ? $data['body']
                        : $buyerTranslationResult['translated_body'],
                    'buyer_translation_language' => $buyerLanguage,
                    'buyer_translation_status' => $buyerTranslationResult['translation_status'],
                ];
            }
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $data['body'] ?? '',
            ...$translation,
            ...$buyerTranslation,
            'attachment_path' => $data['attachment_path'] ?? null,
            'attachment_url' => $data['attachment_url'] ?? null,
            'attachment_name' => $data['attachment_name'] ?? null,
            'attachment_mime' => $data['attachment_mime'] ?? null,
            'created_at' => now(),
        ]);

        $conversation->touch();

        $recipients = $conversation->participants()->where('users.id', '!=', $user->id)->get();
        $preview = $message->translated_body ?: ($data['body'] ?: ($data['attachment_name'] ?? 'Sent an attachment'));
        NotifiesUsers::notifyMany(
            $recipients,
            'new_message',
            'New message from '.$user->name,
            $preview,
            ['conversation_id' => $conversation->id, 'message_id' => $message->id]
        );

        return response()->json([
            'data' => $message->load('sender:id,name,email'),
        ], 201);
    }

    public function transcribeBuyerVoiceMessage(
        Request $request,
        Conversation $conversation,
        int $messageId,
        GoogleCloudVoiceService $voiceService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user->hasRole('buyer') && (int) $conversation->created_by === (int) $user->id, 403);
        abort_unless(
            $conversation->buyer_voice_translation_consent_at !== null
                && $conversation->buyer_voice_translation_consent_revoked_at === null,
            403,
            'Voice translation consent is required.',
        );

        $message = $conversation->messages()->whereKey($messageId)->firstOrFail();
        abort_unless((int) $message->sender_id === (int) $user->id, 403);
        abort_unless(
            str_starts_with(strtolower((string) $message->attachment_mime), 'audio/')
                && filled($message->attachment_path),
            422,
            'A stored voice-message attachment is required.',
        );

        if (in_array($message->transcription_status, ['translated', 'transcribed'], true)) {
            return response()->json(['data' => $message->load('sender:id,name,email')]);
        }

        if (
            $message->transcription_status === 'processing'
            && $message->transcription_attempted_at?->gt(now()->subMinutes(3))
        ) {
            return response()->json([
                'message' => 'Voice translation is already being processed.',
                'data' => $message->load('sender:id,name,email'),
            ], 202);
        }

        $message->forceFill([
            'transcription_status' => 'processing',
            'transcription_attempted_at' => now(),
        ])->save();

        $result = $voiceService->transcribeBuyerVoiceMessage($message, $conversation);
        $message->forceFill($result)->save();

        return response()->json([
            'data' => $message->fresh()->load('sender:id,name,email'),
        ]);
    }

    public function markRead(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();

        $conversation = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->findOrFail($conversationId);

        $updated = $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        AppNotification::query()
            ->where('user_id', $user->id)
            ->where('type', 'new_message')
            ->whereNull('read_at')
            ->where('data->conversation_id', $conversation->id)
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Conversation marked as read.',
            'marked' => $updated,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Message::query()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $user->id)
            ->whereHas('conversation.participants', fn ($q) => $q->where('users.id', $user->id))
            ->count();

        return response()->json([
            'data' => ['unread_count' => $count],
        ]);
    }

    private function refreshBuyerLanguageTranslations(
        Conversation $conversation,
        string $buyerLanguage,
        GoogleCloudTranslationService $translator,
    ): void {
        $messages = $conversation->messages()->orderBy('id')->get();
        $texts = [];

        foreach ($messages as $message) {
            $hasCurrentBuyerText = $message->buyer_translation_language === $buyerLanguage
                && $message->buyer_translated_body !== null;
            $canReuseUrduText = $buyerLanguage === 'ur'
                && (int) $message->sender_id === (int) $conversation->created_by
                && ($message->translated_body !== null || $message->translation_status === 'not_needed');
            if (filled($message->body) && ! $hasCurrentBuyerText && ! $canReuseUrduText) {
                $texts[] = (string) $message->body;
            }

            $hasCurrentBuyerTranscript = $message->transcription_buyer_language === $buyerLanguage
                && $message->transcription_buyer_body !== null;
            $canReuseStaffTranscript = $buyerLanguage === 'ur'
                && filled($message->transcription_translated_body);
            if (filled($message->transcription_body) && ! $hasCurrentBuyerTranscript && ! $canReuseStaffTranscript) {
                $texts[] = (string) $message->transcription_body;
            }
        }

        $uniqueTexts = array_values(array_unique($texts));
        $translated = $uniqueTexts === [] ? [] : $translator->translateMany($uniqueTexts, $buyerLanguage);
        $translationByText = $uniqueTexts === [] ? [] : array_combine($uniqueTexts, $translated);

        foreach ($messages as $message) {
            $updates = [];

            if (filled($message->body)) {
                $hasCurrentBuyerText = $message->buyer_translation_language === $buyerLanguage
                    && $message->buyer_translated_body !== null;
                $canReuseUrduText = $buyerLanguage === 'ur'
                    && (int) $message->sender_id === (int) $conversation->created_by
                    && ($message->translated_body !== null || $message->translation_status === 'not_needed');
                if ($hasCurrentBuyerText) {
                    $buyerBody = $message->buyer_translated_body;
                    $buyerStatus = $message->buyer_translation_status;
                    $sourceLanguage = $message->source_language;
                } elseif ($canReuseUrduText) {
                    $buyerBody = $message->translated_body ?? $message->body;
                    $buyerStatus = $message->translation_status;
                    $sourceLanguage = $message->source_language;
                } else {
                    $result = $translationByText[(string) $message->body]
                        ?? $translator->translate((string) $message->body, $buyerLanguage);
                    $buyerBody = $result['translation_status'] === 'not_needed'
                        ? $message->body
                        : $result['translated_body'];
                    $buyerStatus = $result['translation_status'];
                    $sourceLanguage = $result['source_language'];
                }

                $updates['buyer_translated_body'] = $buyerBody;
                $updates['buyer_translation_language'] = $buyerLanguage;
                $updates['buyer_translation_status'] = $buyerStatus;

                if ((int) $message->sender_id !== (int) $conversation->created_by) {
                    $updates['translated_body'] = $buyerStatus === 'not_needed' ? null : $buyerBody;
                    $updates['source_language'] = $sourceLanguage;
                    $updates['target_language'] = $buyerLanguage;
                    $updates['translation_status'] = $buyerStatus;
                }
            }

            if (filled($message->transcription_body)) {
                $hasCurrentBuyerTranscript = $message->transcription_buyer_language === $buyerLanguage
                    && $message->transcription_buyer_body !== null;
                $canReuseStaffTranscript = $buyerLanguage === 'ur'
                    && filled($message->transcription_translated_body);
                if ($hasCurrentBuyerTranscript) {
                    $transcriptBody = $message->transcription_buyer_body;
                    $transcriptStatus = $message->transcription_buyer_status;
                } elseif ($canReuseStaffTranscript) {
                    $transcriptBody = $message->transcription_translated_body;
                    $transcriptStatus = 'translated';
                } else {
                    $result = $translationByText[(string) $message->transcription_body]
                        ?? $translator->translate((string) $message->transcription_body, $buyerLanguage);
                    $transcriptBody = $result['translation_status'] === 'not_needed'
                        ? $message->transcription_body
                        : $result['translated_body'];
                    $transcriptStatus = $result['translation_status'] === 'not_needed'
                        ? 'transcribed'
                        : $result['translation_status'];
                }

                $updates['transcription_buyer_body'] = $transcriptBody;
                $updates['transcription_buyer_language'] = $buyerLanguage;
                $updates['transcription_buyer_status'] = $transcriptStatus;
            }

            if ($updates !== []) {
                $message->forceFill($updates)->save();
            }
        }
    }
}
