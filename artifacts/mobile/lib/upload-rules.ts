export const MAX_INVESTOR_UPLOAD_BYTES = 10 * 1024 * 1024;

export const INVESTOR_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const MAX_BUYER_CHAT_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_BUYER_CHAT_VIDEO_BYTES = 20 * 1024 * 1024;
export const MAX_BUYER_CHAT_AUDIO_BYTES = 10 * 1024 * 1024;

export type BuyerChatMediaKind = 'image' | 'video' | 'audio';

const mediaExtensions: Record<string, BuyerChatMediaKind> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  avi: 'video',
  m4a: 'audio',
  mp3: 'audio',
  wav: 'audio',
  aac: 'audio',
  ogg: 'audio',
  opus: 'audio',
  '3gp': 'audio',
};

export function buyerChatMediaKind(name: string, mimeType: string): BuyerChatMediaKind | null {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  const extensionKind = mediaExtensions[extension];
  const mime = mimeType.trim().toLowerCase();

  if (mime.startsWith('image/')) return extensionKind === 'image' ? 'image' : null;
  if (mime.startsWith('video/')) return extensionKind === 'video' ? 'video' : null;
  if (mime.startsWith('audio/')) return extensionKind === 'audio' ? 'audio' : null;

  return extensionKind ?? null;
}

export function validateBuyerChatMediaFile(
  name: string,
  mimeType: string,
  size: number,
  expectedKind?: BuyerChatMediaKind,
): BuyerChatMediaKind {
  const kind = buyerChatMediaKind(name, mimeType);
  if (!kind || (expectedKind && kind !== expectedKind)) {
    throw new Error('Choose a supported image, video, or audio file.');
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('The selected media size could not be checked. Choose another file.');
  }

  const limit = kind === 'image'
    ? MAX_BUYER_CHAT_IMAGE_BYTES
    : kind === 'video'
      ? MAX_BUYER_CHAT_VIDEO_BYTES
      : MAX_BUYER_CHAT_AUDIO_BYTES;
  if (size > limit) {
    const limitMb = limit / (1024 * 1024);
    throw new Error(`${kind === 'video' ? 'Videos' : kind === 'audio' ? 'Voice notes' : 'Images'} must be ${limitMb} MB or smaller.`);
  }

  return kind;
}

export function validateInvestorUploadFileSize(size: number): number {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('The selected file size could not be checked. Choose another file.');
  }
  if (size > MAX_INVESTOR_UPLOAD_BYTES) {
    throw new Error('Choose a file that is 10 MB or smaller.');
  }
  return size;
}
