<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->text('buyer_translated_body')->nullable();
            $table->string('buyer_translation_language', 12)->nullable();
            $table->string('buyer_translation_status', 32)->default('not_needed');
            $table->text('transcription_buyer_body')->nullable();
            $table->string('transcription_buyer_language', 12)->nullable();
            $table->string('transcription_buyer_status', 32)->default('not_requested');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'buyer_translated_body',
                'buyer_translation_language',
                'buyer_translation_status',
                'transcription_buyer_body',
                'transcription_buyer_language',
                'transcription_buyer_status',
            ]);
        });
    }
};
