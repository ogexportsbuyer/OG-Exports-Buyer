<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const SUBJECT = '{{app_name}} — New message from OG Exports Support';

    private const BODY_HTML = '<div style="font-family:Arial,sans-serif;color:#18372f;"><p>Dear {{user_name}},</p><p>Our support team has sent you a new message.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;"><tr><td style="background:#f4f6f2;border-left:4px solid #b08d57;border-radius:8px;padding:16px;"><strong style="display:block;margin-bottom:8px;color:#25483c;">Message preview</strong><span>{{message_preview}}</span></td></tr></table><p><a href="{{portal_url}}" style="display:inline-block;background:#123f32;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:7px;padding:12px 18px;">Open your secure conversation</a></p><p style="color:#60736c;font-size:13px;">Sign in to your buyer account to view the full conversation and any shared attachments.</p><p>Regards,<br>OG Exports Support</p></div>';

    public function up(): void
    {
        DB::table('email_templates')->insertOrIgnore([
            'slug' => 'buyer_admin_message',
            'subject' => self::SUBJECT,
            'body_html' => self::BODY_HTML,
            'body_text' => "Dear {{user_name}},\n\nOG Exports Support sent you a new message.\n\nMessage preview:\n{{message_preview}}\n\nSign in to your buyer account to view the full conversation and any shared attachments:\n{{portal_url}}\n\nRegards,\nOG Exports Support",
            'placeholders' => json_encode(['user_name', 'message_preview', 'portal_url', 'app_name'], JSON_THROW_ON_ERROR),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('email_templates')
            ->where('slug', 'buyer_admin_message')
            ->where('subject', self::SUBJECT)
            ->where('body_html', self::BODY_HTML)
            ->delete();
    }
};
