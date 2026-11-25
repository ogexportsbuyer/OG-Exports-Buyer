import test from 'node:test';
import assert from 'node:assert/strict';
import { supportTextForSelectedLanguage } from './buyer-support-chat-language.ts';

test('chat and voice text prefer the translation for the currently selected buyer language', () => {
  assert.equal(supportTextForSelectedLanguage({
    original: 'مرحبا',
    selectedTranslation: 'Bonjour',
    selectedLanguage: 'fr-CA',
    legacyTranslation: 'سلام',
    legacyLanguage: 'ur',
    language: 'fr-CA',
  }), 'Bonjour');

  assert.equal(supportTextForSelectedLanguage({
    original: 'Please send the price list.',
    selectedTranslation: 'Veuillez envoyer la liste des prix.',
    selectedLanguage: 'fr-CA',
    legacyTranslation: 'براہ کرم قیمت بھیجیں۔',
    legacyLanguage: 'ur',
    language: 'fr-CA',
  }), 'Veuillez envoyer la liste des prix.');
});

test('chat does not show a stale translation when the buyer changes language', () => {
  assert.equal(supportTextForSelectedLanguage({
    original: 'Hello',
    selectedTranslation: 'Bonjour',
    selectedLanguage: 'fr',
    legacyTranslation: 'سلام',
    legacyLanguage: 'ur',
    language: 'ar',
  }), 'Hello');
});

test('matching language codes are compared without case differences', () => {
  assert.equal(supportTextForSelectedLanguage({
    original: 'Hello',
    selectedTranslation: 'مرحبا',
    selectedLanguage: 'AR',
    language: 'ar',
  }), 'مرحبا');
});
