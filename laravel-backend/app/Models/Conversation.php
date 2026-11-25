<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'subject',
        'buyer_language',
        'buyer_voice_translation_consent_at',
        'buyer_voice_translation_consent_revoked_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'buyer_voice_translation_consent_at' => 'datetime',
            'buyer_voice_translation_consent_revoked_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
