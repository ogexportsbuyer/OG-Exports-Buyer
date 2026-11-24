<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Controller;
use App\Support\MediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file'],
            'category' => ['nullable', 'string', 'max:100', Rule::in(MediaStorage::ALLOWED_CATEGORIES)],
            'item_id' => ['nullable', 'integer', 'min:1'],
            'folder' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_\-\/]+$/'],
        ]);

        $category = $data['category']
            ?? MediaStorage::categoryFromLegacyFolder($data['folder'] ?? null);
        $normalizedCategory = MediaStorage::normalizeCategory($category);

        $file = $request->file('file');
        $mime = (string) $file->getMimeType();
        $clientMime = strtolower((string) $file->getClientMimeType());
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $isImage = str_starts_with(strtolower($mime), 'image/');
        $messageAudioExtensions = ['m4a', 'mp3', 'wav', 'aac', 'ogg', 'opus'];
        $isAudio = str_starts_with(strtolower($mime), 'audio/')
            || ($normalizedCategory === 'messages' && (
                str_starts_with($clientMime, 'audio/')
                || in_array($extension, $messageAudioExtensions, true)
            ));
        $maxImageSizeKb = $normalizedCategory === 'kyc' ? 10 * 1024 : 8 * 1024;

        if ($isAudio && $normalizedCategory !== 'messages') {
            return response()->json(['message' => 'Audio files may only be uploaded as support-message attachments.'], 422);
        }

        if ($isAudio) {
            $request->validate([
                'file' => [
                    'required',
                    'file',
                    'max:10240',
                    'mimes:m4a,mp4,mp3,wav,aac,ogg,opus,webm,3gp',
                    'extensions:m4a,mp3,wav,aac,ogg,opus,webm,3gp',
                ],
            ]);
        } elseif ($isImage) {
            $request->validate([
                'file' => [
                    'required',
                    File::image()
                        ->types(['jpg', 'jpeg', 'png', 'gif', 'webp'])
                        ->max($maxImageSizeKb),
                ],
            ]);
        } else {
            $request->validate([
                'file' => [
                    'required',
                    'file',
                    'max:20480',
                    'mimes:pdf,doc,docx,xls,xlsx,mp4,webm,mov,avi',
                ],
            ]);
        }

        $stored = MediaStorage::store(
            $file,
            $category,
            isset($data['item_id']) ? (int) $data['item_id'] : null,
            $request->user(),
        );
        if ($isAudio) {
            $stored['mime'] = match ($extension) {
                'm4a' => 'audio/mp4',
                'mp3' => 'audio/mpeg',
                'wav' => 'audio/wav',
                'aac' => 'audio/aac',
                'ogg' => 'audio/ogg',
                'opus' => 'audio/opus',
                'webm' => 'audio/webm',
                '3gp' => 'audio/3gpp',
                default => $mime,
            };
        }

        return response()->json([
            'data' => $stored,
        ], 201);
    }
}
