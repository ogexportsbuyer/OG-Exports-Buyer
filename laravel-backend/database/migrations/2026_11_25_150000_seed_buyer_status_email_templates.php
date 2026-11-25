<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $templates = [
            [
                'slug' => 'quotation_sent',
                'subject' => '{{app_name}} — Quotation {{quotation_ref}} ({{status}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>Your quotation <strong>{{quotation_ref}}</strong> has been {{status}}.</p><ul><li><strong>Product:</strong> {{product_name}}</li><li><strong>Quantity:</strong> {{qty}}</li><li><strong>Incoterm:</strong> {{incoterm}}</li><li><strong>Estimated total:</strong> ${{total}}</li></ul><p>Review and respond in your portal: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nQuotation {{quotation_ref}} has been {{status}}.\nProduct: {{product_name}}\nQuantity: {{qty}}\nIncoterm: {{incoterm}}\nEstimated total: \${{total}}\n\nReview: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'quotation_ref', 'product_name', 'qty', 'incoterm', 'total', 'status', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'quotation_reply',
                'subject' => '{{app_name}} — Reply on Quotation {{quotation_ref}}',
                'body_html' => '<p>Dear {{user_name}},</p><p>There is a new reply on your quotation <strong>{{quotation_ref}}</strong>.</p><blockquote>{{message_preview}}</blockquote><p>View and respond: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nNew reply on quotation {{quotation_ref}}:\n{{message_preview}}\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'quotation_ref', 'message_preview', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_order_status_update',
                'subject' => '{{app_name}} — Order {{order_number}} Update',
                'body_html' => '<p>Dear {{user_name}},</p><p>Your order <strong>{{order_number}}</strong> has been updated.</p><ul><li><strong>Status:</strong> {{status}}</li><li><strong>Payment status:</strong> {{payment_status}}</li></ul><p>{{notes}}</p><p>View your orders: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nOrder {{order_number}} updated.\nStatus: {{status}}\nPayment status: {{payment_status}}\n{{notes}}\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'order_number', 'status', 'payment_status', 'notes', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_shipment_update',
                'subject' => '{{app_name}} — Shipment Update ({{container}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>There is an update on your shipment.</p><ul><li><strong>Container:</strong> {{container}}</li><li><strong>Milestone:</strong> {{milestone}}</li><li><strong>Vessel:</strong> {{vessel}}</li></ul><p>Track shipment: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nShipment update\nContainer: {{container}}\nMilestone: {{milestone}}\nVessel: {{vessel}}\n\nTrack: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'container', 'milestone', 'vessel', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_trade_document',
                'subject' => '{{app_name}} — Trade Document for Order {{order_number}}',
                'body_html' => '<p>Dear {{user_name}},</p><p>A new trade document (<strong>{{document_type}}</strong>) has been uploaded for order <strong>{{order_number}}</strong>.</p><p>View documents: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nDocument {{document_type}} uploaded for order {{order_number}}.\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'order_number', 'document_type', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_payment_approved',
                'subject' => '{{app_name}} — Payment Approved ({{order_number}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>Your payment for order <strong>{{order_number}}</strong> has been verified and approved.</p><p>View payments: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nPayment approved for order {{order_number}}.\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'order_number', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_payment_rejected',
                'subject' => '{{app_name}} — Payment Not Approved ({{order_number}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>Your payment for order <strong>{{order_number}}</strong> was not approved. Please resubmit or contact support.</p><p>View payments: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nPayment rejected for order {{order_number}}. Please resubmit or contact support.\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'order_number', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'buyer_payment_cancelled',
                'subject' => '{{app_name}} — Payment Cancelled ({{order_number}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>Your pending payment for order <strong>{{order_number}}</strong> has been cancelled.</p><p>View payments: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nPayment cancelled for order {{order_number}}.\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'order_number', 'portal_url', 'app_name'],
            ],
            [
                'slug' => 'support_ticket_update',
                'subject' => '{{app_name}} — Support Ticket {{ticket_number}} ({{status}})',
                'body_html' => '<p>Dear {{user_name}},</p><p>There is an update on support ticket <strong>{{ticket_number}}</strong>.</p><p><strong>Status:</strong> {{status}}</p><p>{{message_preview}}</p><p>View ticket: <a href="{{portal_url}}">{{portal_url}}</a></p><p>Thank you,<br>{{app_name}} Team</p>',
                'body_text' => "Dear {{user_name}},\n\nSupport ticket {{ticket_number}} update.\nStatus: {{status}}\n{{message_preview}}\n\nView: {{portal_url}}\n\nThank you,\n{{app_name}} Team",
                'placeholders' => ['user_name', 'ticket_number', 'status', 'message_preview', 'portal_url', 'app_name'],
            ],
        ];

        DB::table('email_templates')->insertOrIgnore(array_map(
            static fn (array $template): array => [
                ...$template,
                'placeholders' => json_encode($template['placeholders'], JSON_THROW_ON_ERROR),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $templates,
        ));
    }

    public function down(): void
    {
        // Keep templates on rollback because admins may have edited them after
        // deployment and insertOrIgnore cannot distinguish pre-existing rows.
    }
};
