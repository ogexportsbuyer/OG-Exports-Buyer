<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'translated_body',
        'source_language',
        'target_language',
        'translation_status',
        'buyer_translated_body',
        'buyer_translation_language',
        'buyer_translation_status',
        'transcription_body',
        'transcription_translated_body',
        'transcription_source_language',
        'transcription_target_language',
        'transcription_buyer_body',
        'transcription_buyer_language',
        'transcription_buyer_status',
        'transcription_status',
        'transcription_attempted_at',
        'attachment_path',
        'attachment_url',
        'attachment_name',
        'attachment_mime',
        'read_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'transcription_attempted_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
