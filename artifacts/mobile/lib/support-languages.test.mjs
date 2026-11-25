import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSupportLanguageForCountry,
  matchSupportSpeechVoice,
  supportLanguageLabel,
  supportSpeechLocale,
} from './support-languages.ts';

test('chat language defaults by country and keeps English as a safe fallback', () => {
  assert.equal(defaultSupportLanguageForCountry('Pakistan'), 'ur');
  assert.equal(defaultSupportLanguageForCountry('United Arab Emirates'), 'ar');
  assert.equal(defaultSupportLanguageForCountry('Türkiye'), 'tr');
  assert.equal(defaultSupportLanguageForCountry('unknown market'), 'en');
});

test('language label uses the complete server language catalogue when available', () => {
  assert.equal(supportLanguageLabel('fr', [{ code: 'fr', name: 'French' }]), 'French');
  assert.equal(supportLanguageLabel('fr-CA', []), 'FR-CA');
});

test('speech locales preserve explicit regions and map common buyer languages', () => {
  assert.equal(supportSpeechLocale('ur'), 'ur-PK');
  assert.equal(supportSpeechLocale('ar'), 'ar-SA');
  assert.equal(supportSpeechLocale('zh_TW'), 'zh-TW');
  assert.equal(supportSpeechLocale('fr-CA'), 'fr-CA');
  assert.equal(supportSpeechLocale('sv'), 'sv');
  assert.equal(supportSpeechLocale(''), 'en-US');
});

test('device speech voice selection prefers an exact locale and then the same language', () => {
  const voices = [
    { language: 'ur-IN', identifier: 'urdu-india' },
    { language: 'en-GB', identifier: 'english-uk' },
    { language: 'en-US', identifier: 'english-us' },
  ];

  assert.equal(matchSupportSpeechVoice(voices, 'en')?.identifier, 'english-us');
  assert.equal(matchSupportSpeechVoice(voices, 'ur-PK')?.identifier, 'urdu-india');
  assert.equal(matchSupportSpeechVoice(voices, 'ar')?.identifier, undefined);
});
