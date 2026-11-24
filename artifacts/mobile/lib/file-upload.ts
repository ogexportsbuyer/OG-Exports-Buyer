import { getSavedToken } from '@/lib/api-config';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { validateBuyerChatMediaFile, validateInvestorUploadFileSize, type BuyerChatMediaKind } from './upload-rules';

function checkedFile(source: string | File): File {
  const file = typeof source === 'string' ? new File(source) : source;
  if (!file.exists) {
    throw new Error('The selected file could not be read. Choose another file.');
  }
  validateInvestorUploadFileSize(file.size);
  return file;
}

export function getInvestorUploadFileSize(source: string | File): number {
  return checkedFile(source).size;
}

export async function uploadInvestorFile(source: string | File, name: string, _mimeType: string, folder: string, origin: string): Promise<string> {
  if (!origin) throw new Error('The investor service is not configured for this app. Contact OG Exports support.');
  const token = await getSavedToken();
  if (!token) throw new Error('Sign in again before uploading a document.');
  const body = new FormData();
  body.append('file', checkedFile(source), name);
  body.append('folder', folder);
  const response = await fetch(`${origin.replace(/\/+$/, '')}/api/uploads`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body,
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : 'The file could not be uploaded.');
  const data = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : result;
  const path = data.path ?? data.file_path ?? data.url;
  if (typeof path !== 'string' || !path) throw new Error('The server did not return an uploaded file path.');
  return path;
}

export type UploadedBuyerChatMedia = {
  path: string;
  url: string;
  name: string;
  mime: string;
  size: number;
};

async function chatUploadBlob(source: string | File | Blob, mimeType: string): Promise<Blob> {
  if (source instanceof File) {
    if (!source.exists) throw new Error('The selected media could not be read. Choose it again.');
    return source;
  }

  if (typeof source !== 'string') return source;

  if (Platform.OS !== 'web') {
    const file = new File(source);
    if (!file.exists) throw new Error('The selected media could not be read. Choose it again.');
    return file;
  }

  const response = await fetch(source);
  if (!response.ok) throw new Error('The selected media could not be read. Choose it again.');
  const blob = await response.blob();
  if (mimeType && blob.type !== mimeType) {
    return new Blob([blob], { type: mimeType });
  }
  return blob;
}

export async function uploadBuyerChatMedia(
  source: string | File | Blob,
  name: string,
  mimeType: string,
  kind: BuyerChatMediaKind,
  origin: string,
): Promise<UploadedBuyerChatMedia> {
  if (!origin) throw new Error('The support service is not configured for this app. Contact OG Exports support.');
  const token = await getSavedToken();
  if (!token) throw new Error('Sign in again before sending media.');

  const blob = await chatUploadBlob(source, mimeType);
  const checkedKind = validateBuyerChatMediaFile(name, mimeType || blob.type, blob.size, kind);
  if (checkedKind !== kind) throw new Error('Choose a supported media file.');

  const body = new FormData();
  body.append('file', blob, name);
  body.append('category', 'messages');
  const response = await fetch(`${origin.replace(/\/+$/, '')}/api/uploads`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body,
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result.message === 'string' ? result.message : 'The media could not be uploaded.');
  }

  const data = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : result;
  const path = data.path ?? data.file_path;
  const url = data.url ?? (typeof path === 'string' ? path : '');
  if (typeof path !== 'string' || !path || typeof url !== 'string' || !url) {
    throw new Error('The server did not return a usable media path.');
  }

  return {
    path,
    url,
    name: typeof data.name === 'string' && data.name ? data.name : name,
    mime: typeof data.mime === 'string' && data.mime ? data.mime : mimeType,
    size: typeof data.size === 'number' ? data.size : blob.size,
  };
}
