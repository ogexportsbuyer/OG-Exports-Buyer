<?php

use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->buyer = User::factory()->create(['account_status' => 'active']);
    $this->buyer->assignRole('buyer');

    $this->admin = User::factory()->create(['account_status' => 'active']);
    $this->admin->assignRole('admin');

    $this->conversation = Conversation::query()->create([
        'subject' => 'Buyer support',
        'created_by' => $this->buyer->id,
    ]);
    $this->conversation->participants()->attach([$this->buyer->id, $this->admin->id]);
});

it('stores buyer support media metadata and notifies the other participant', function () {
    $mediaPath = "upload/messages/{$this->buyer->id}/voice-message.m4a";

    $response = $this->actingAs($this->buyer)
        ->postJson("/api/conversations/{$this->conversation->id}/messages", [
            'body' => '',
            'attachment_path' => $mediaPath,
            'attachment_url' => "https://ogexports.co/{$mediaPath}",
            'attachment_name' => 'voice-message.m4a',
            'attachment_mime' => 'audio/mp4',
        ])
        ->assertCreated()
        ->assertJsonPath('data.attachment_path', $mediaPath)
        ->assertJsonPath('data.attachment_name', 'voice-message.m4a')
        ->assertJsonPath('data.attachment_mime', 'audio/mp4');

    expect($response->json('data.attachment_url'))->toBeNull()
        ->and(Message::query()->where('conversation_id', $this->conversation->id)->count())->toBe(1)
        ->and(AppNotification::query()
            ->where('user_id', $this->admin->id)
            ->where('type', 'new_message')
            ->where('data->message_id', $response->json('data.id'))
            ->exists())->toBeTrue();
});

