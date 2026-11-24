<?php

use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\EmailTemplate;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    EmailTemplate::query()->updateOrCreate(
        ['slug' => 'buyer_admin_message'],
        [
            'subject' => '{{app_name}} — New message from OG Exports Support',
            'body_html' => '<p>{{message_preview}}</p><a href="{{portal_url}}">Open secure conversation</a>',
            'body_text' => "{{message_preview}}\n{{portal_url}}",
            'placeholders' => ['user_name', 'message_preview', 'portal_url', 'app_name'],
            'is_active' => true,
        ]
    );

    $this->admin = User::factory()->create(['account_status' => 'active', 'name' => 'Admin']);
    $this->admin->assignRole('admin');

    $this->buyer = User::factory()->create([
        'account_status' => 'active',
        'name' => 'Buyer User',
        'email' => 'buyer-message@test.local',
    ]);
    $this->buyer->assignRole('buyer');

    $this->investor = User::factory()->create([
        'account_status' => 'active',
        'name' => 'Investor User',
        'email' => 'investor-message@test.local',
    ]);
    $this->investor->assignRole('investor');

    $this->conversation = Conversation::query()->create([
        'subject' => 'Trade support',
        'created_by' => $this->buyer->id,
    ]);
    $this->conversation->participants()->attach([
        $this->admin->id,
        $this->buyer->id,
        $this->investor->id,
    ]);
});

it('emails a buyer when an admin sends a direct message while preserving in-app notifications for all recipients', function () {
    Mail::fake();

    $authLogs = [];
    Event::listen(MessageLogged::class, function (MessageLogged $event) use (&$authLogs) {
        $authLogs[] = $event;
    });

    $this->actingAs($this->admin)
        ->postJson("/api/admin/conversations/{$this->conversation->id}/messages", [
            'body' => 'Your updated product quotation is ready to review.',
        ])
        ->assertCreated();

    $buyerNotification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', 'new_message')
        ->first();
    $investorNotification = AppNotification::query()
        ->where('user_id', $this->investor->id)
        ->where('type', 'new_message')
        ->first();

    expect($buyerNotification)->not->toBeNull()
        ->and($buyerNotification->body)->toContain('quotation')
        ->and($buyerNotification->data['href'] ?? null)->toBe('/buyer/messages')
        ->and($investorNotification)->not->toBeNull();

    $buyerEmailSent = collect($authLogs)->contains(fn (MessageLogged $event) => $event->level === 'info'
        && $event->message === 'auth.email.sent'
        && ($event->context['slug'] ?? null) === 'buyer_admin_message'
        && (int) ($event->context['user_id'] ?? 0) === $this->buyer->id);
    $investorEmailSent = collect($authLogs)->contains(fn (MessageLogged $event) => $event->level === 'info'
        && $event->message === 'auth.email.sent'
        && ($event->context['slug'] ?? null) === 'buyer_admin_message'
        && (int) ($event->context['user_id'] ?? 0) === $this->investor->id);

    expect($buyerEmailSent)->toBeTrue()
        ->and($investorEmailSent)->toBeFalse();
});

it('emails buyers about admin attachments without exposing a private file link', function () {
    Mail::fake();

    $authLogs = [];
    Event::listen(MessageLogged::class, function (MessageLogged $event) use (&$authLogs) {
        $authLogs[] = $event;
    });

    $this->actingAs($this->admin)
        ->postJson("/api/admin/conversations/{$this->conversation->id}/messages", [
            'attachment_path' => 'private/messages/secure-document.pdf',
            'attachment_name' => 'secure-document.pdf',
            'attachment_mime' => 'application/pdf',
        ])
        ->assertCreated();

    $notification = AppNotification::query()
        ->where('user_id', $this->buyer->id)
        ->where('type', 'new_message')
        ->first();

    $buyerEmailSent = collect($authLogs)->contains(fn (MessageLogged $event) => $event->level === 'info'
        && $event->message === 'auth.email.sent'
        && ($event->context['slug'] ?? null) === 'buyer_admin_message'
        && (int) ($event->context['user_id'] ?? 0) === $this->buyer->id);

    expect($notification)->not->toBeNull()
        ->and($notification->body)->toContain('secure conversation')
        ->and($notification->body)->not->toContain('private/messages')
        ->and($buyerEmailSent)->toBeTrue();
});
