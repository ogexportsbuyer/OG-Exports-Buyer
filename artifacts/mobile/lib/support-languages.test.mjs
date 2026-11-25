import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSupportLanguageForCountry, supportLanguageLabel } from './support-languages.ts';

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
