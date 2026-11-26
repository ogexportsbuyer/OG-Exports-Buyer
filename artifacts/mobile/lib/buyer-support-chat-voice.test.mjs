import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = new URL('../', import.meta.url);

function source(path) {
  return readFileSync(new URL(path, appRoot), 'utf8');
}

test('buyer chat removes voice translation while keeping voice notes usable', () => {
  const experience = source('components/BuyerSupportChatExperience.tsx');
  const panel = source('components/BuyerSupportChatPanel.tsx');

  assert.doesNotMatch(experience, /useTranscribeBuyerVoiceMessage|useUpdateBuyerVoiceTranslationConsent|voiceTranslationEnabled|transcribeVoiceMessage/);
  assert.doesNotMatch(panel, /Translate voice to|Translate voice notes automatically|transcriptionStatus|buyer-chat-retry-transcription/);
  assert.match(experience, /useAudioRecorder/);
  assert.match(experience, /attachment_mime: uploaded\.mime/);
  assert.match(panel, /buyer-chat-play-sent-audio/);
  assert.match(panel, /buyer-chat-start-recording/);
  assert.match(panel, /buyer-chat-send/);
  assert.match(experience, /useUpdateBuyerSupportLanguage/);
  assert.match(panel, /Choose chat language/);
  assert.match(panel, /supportTextForSelectedLanguage/);
});
