<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->timestamp('buyer_voice_translation_consent_at')->nullable();
            $table->timestamp('buyer_voice_translation_consent_revoked_at')->nullable();
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->text('transcription_body')->nullable();
            $table->text('transcription_translated_body')->nullable();
            $table->string('transcription_source_language', 12)->nullable();
            $table->string('transcription_target_language', 12)->nullable();
            $table->string('transcription_status', 32)->default('not_requested');
            $table->timestamp('transcription_attempted_at')->nullable();
        });

        Schema::create('buyer_voice_translation_consent_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('enabled');
            $table->timestamps();

            $table->index(['conversation_id', 'buyer_id', 'created_at'], 'buyer_voice_consent_history_idx');
        });

        Schema::create('google_speech_monthly_usage', function (Blueprint $table) {
            $table->id();
            $table->string('period', 7)->unique();
            $table->unsignedInteger('speech_seconds_reserved')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_speech_monthly_usage');
        Schema::dropIfExists('buyer_voice_translation_consent_events');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'transcription_body',
                'transcription_translated_body',
                'transcription_source_language',
                'transcription_target_language',
                'transcription_status',
                'transcription_attempted_at',
            ]);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn([
                'buyer_voice_translation_consent_at',
                'buyer_voice_translation_consent_revoked_at',
            ]);
        });
    }
};
