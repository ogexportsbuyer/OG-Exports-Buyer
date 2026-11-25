<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('buyer_language', 12)->nullable()->after('subject');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->text('translated_body')->nullable()->after('body');
            $table->string('source_language', 12)->nullable()->after('translated_body');
            $table->string('target_language', 12)->nullable()->after('source_language');
            $table->string('translation_status', 24)->default('not_needed')->after('target_language');
        });

        Schema::create('google_translation_monthly_usage', function (Blueprint $table) {
            $table->id();
            $table->string('period', 7)->unique();
            $table->unsignedBigInteger('characters')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_translation_monthly_usage');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'translated_body',
                'source_language',
                'target_language',
                'translation_status',
            ]);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('buyer_language');
        });
    }
};
