import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INVESTOR_DOCUMENT_MIME_TYPES,
  MAX_INVESTOR_UPLOAD_BYTES,
  MAX_BUYER_CHAT_ATTACHMENTS,
  MAX_BUYER_CHAT_AUDIO_BYTES,
  MAX_BUYER_CHAT_IMAGE_BYTES,
  MAX_BUYER_CHAT_VIDEO_BYTES,
  buyerChatMediaKind,
  validateBuyerChatMediaFile,
  validateInvestorUploadFileSize,
} from './upload-rules.ts';

test('accepts supported PDF and image document types', () => {
  assert.deepEqual(INVESTOR_DOCUMENT_MIME_TYPES, [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]);
});

test('allows files up to and including 10 MB', () => {
  assert.equal(validateInvestorUploadFileSize(1), 1);
  assert.equal(validateInvestorUploadFileSize(MAX_INVESTOR_UPLOAD_BYTES), MAX_INVESTOR_UPLOAD_BYTES);
});

test('rejects files larger than 10 MB and files whose size cannot be verified', () => {
  assert.throws(() => validateInvestorUploadFileSize(MAX_INVESTOR_UPLOAD_BYTES + 1), /10 MB or smaller/);
  assert.throws(() => validateInvestorUploadFileSize(0), /size could not be checked/);
  assert.throws(() => validateInvestorUploadFileSize(Number.NaN), /size could not be checked/);
});

test('classifies supported buyer chat images, videos, and voice notes', () => {
  assert.equal(buyerChatMediaKind('photo.webp', 'image/webp'), 'image');
  assert.equal(buyerChatMediaKind('shipment.mov', 'video/quicktime'), 'video');
  assert.equal(buyerChatMediaKind('voice-note.m4a', 'audio/mp4'), 'audio');
  assert.equal(buyerChatMediaKind('document.pdf', 'application/pdf'), null);
});

test('enforces separate image, video, and audio size limits for buyer chat', () => {
  assert.equal(validateBuyerChatMediaFile('photo.jpg', 'image/jpeg', MAX_BUYER_CHAT_IMAGE_BYTES), 'image');
  assert.equal(validateBuyerChatMediaFile('clip.mp4', 'video/mp4', MAX_BUYER_CHAT_VIDEO_BYTES), 'video');
  assert.equal(validateBuyerChatMediaFile('voice.m4a', 'audio/mp4', MAX_BUYER_CHAT_AUDIO_BYTES), 'audio');
  assert.throws(() => validateBuyerChatMediaFile('photo.jpg', 'image/jpeg', MAX_BUYER_CHAT_IMAGE_BYTES + 1), /8 MB/);
  assert.throws(() => validateBuyerChatMediaFile('clip.mp4', 'video/mp4', MAX_BUYER_CHAT_VIDEO_BYTES + 1), /20 MB/);
  assert.throws(() => validateBuyerChatMediaFile('voice.m4a', 'audio/mp4', MAX_BUYER_CHAT_AUDIO_BYTES + 1), /10 MB/);
});

test('limits one buyer chat send batch to ten attachments', () => {
  assert.equal(MAX_BUYER_CHAT_ATTACHMENTS, 10);
});
