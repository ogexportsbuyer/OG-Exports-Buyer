import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEGAL_DOCUMENTS,
  legalDocumentFilename,
  legalDocumentFileContent,
} from './legal-content.ts';
import {
  LEGAL_DRAFT_TRANSLATIONS,
  getLegalDocumentForPreference,
  legalTranslationMatchesSource,
} from './legal-content-translations.ts';
import { configureUiLanguage, translateUi } from './strings.ts';

const legalRoute = readFileSync(new URL('../app/account/legal/[section].tsx', import.meta.url), 'utf8');

const supportedLegalDraftLanguages = ['ur', 'ar', 'ru', 'zh-CN', 'fr', 'es', 'de'];

test('provides pending-review translations for all seven non-English languages and five legal documents', () => {
  assert.deepEqual(
    Object.keys(LEGAL_DRAFT_TRANSLATIONS).sort(),
    Object.keys(LEGAL_DOCUMENTS).sort(),
  );

  for (const [documentId, source] of Object.entries(LEGAL_DOCUMENTS)) {
    for (const language of supportedLegalDraftLanguages) {
      const translation = LEGAL_DRAFT_TRANSLATIONS[documentId][language];
      assert.equal(translation.reviewStatus, 'pending', `${documentId}/${language} review status`);
      assert.ok(translation.title.trim(), `${documentId}/${language} title`);
      assert.ok(translation.summary.trim(), `${documentId}/${language} summary`);
      assert.ok(
        legalTranslationMatchesSource(source, translation),
        `${documentId}/${language} must preserve every source section, paragraph, and bullet`,
      );
      assert.ok(
        translation.sections.every(section => section.heading.trim()),
        `${documentId}/${language} section headings`,
      );
      assert.ok(
        translation.sections.every(section =>
          [...(section.paragraphs ?? []), ...(section.bullets ?? [])].every(text => text.trim()),
        ),
        `${documentId}/${language} legal copy`,
      );
    }
  }
});

test('legal screen displays the document matching every saved app-language preference', () => {
  assert.equal(Object.keys(LEGAL_DOCUMENTS).length, 5, 'all five legal routes are covered');

  for (const [documentId, source] of Object.entries(LEGAL_DOCUMENTS)) {
    assert.equal(getLegalDocumentForPreference(source, documentId, 'en'), source, `${documentId}/en`);

    for (const language of supportedLegalDraftLanguages) {
      const translation = LEGAL_DRAFT_TRANSLATIONS[documentId][language];
      const displayed = getLegalDocumentForPreference(source, documentId, language);
      assert.equal(displayed, translation, `${documentId}/${language} displays its draft`);
      assert.notEqual(displayed, source, `${documentId}/${language} must not display English`);
      const script = {
        ur: /\p{Script=Arabic}/u,
        ar: /\p{Script=Arabic}/u,
        ru: /\p{Script=Cyrillic}/u,
        'zh-CN': /\p{Script=Han}/u,
        fr: /\p{Script=Latin}/u,
        es: /\p{Script=Latin}/u,
        de: /\p{Script=Latin}/u,
      }[language];
      assert.match(displayed.title, script, `${documentId}/${language} title uses the expected script`);
      assert.match(
        displayed.sections.flatMap(section => [section.heading, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]).join(' '),
        script,
        `${documentId}/${language} legal body uses the expected script`,
      );
    }
  }
});

test('every non-English legal screen switches to the English source and back to its draft', () => {
  for (const [documentId, source] of Object.entries(LEGAL_DOCUMENTS)) {
    for (const language of supportedLegalDraftLanguages) {
      assert.equal(
        getLegalDocumentForPreference(source, documentId, language, true),
        source,
        `${documentId}/${language} shows the English source`,
      );
      assert.equal(
        getLegalDocumentForPreference(source, documentId, language, false),
        LEGAL_DRAFT_TRANSLATIONS[documentId][language],
        `${documentId}/${language} returns to its draft`,
      );
    }
  }
});

test('exports every legal page in the selected language and marks every draft pending review', () => {
  for (const [documentId, source] of Object.entries(LEGAL_DOCUMENTS)) {
    const english = legalDocumentFileContent(source, 'en', false);
    assert.ok(english.includes(source.title), `${documentId}/en title`);
    assert.ok(english.includes(source.sections[0].heading), `${documentId}/en section`);
    assert.ok(english.includes('Approved English source'), `${documentId}/en source label`);
    assert.ok(!english.includes('qualified review pending'), `${documentId}/en is not a draft`);
    assert.equal(legalDocumentFilename(documentId, 'en', false), `og-exports-${documentId}-en.txt`);

    for (const language of supportedLegalDraftLanguages) {
      configureUiLanguage(language);
      const draft = LEGAL_DRAFT_TRANSLATIONS[documentId][language];
      const exported = legalDocumentFileContent(draft, language, true);
      assert.ok(exported.includes(draft.title), `${documentId}/${language} title`);
      assert.ok(exported.includes(draft.sections[0].heading), `${documentId}/${language} section`);
      assert.ok(exported.includes(draft.sections[0].paragraphs[0]), `${documentId}/${language} body`);
      assert.ok(exported.includes(translateUi('Translation draft — qualified review pending. This translation is not approved. The approved English source is available in the app.', language)), `${documentId}/${language} pending review notice`);
      assert.match(legalDocumentFilename(documentId, language, true), new RegExp(`-${language}-draft\\.txt$`));

      const explicitlySelectedEnglish = legalDocumentFileContent(source, 'en', false);
      assert.ok(explicitlySelectedEnglish.includes(source.title), `${documentId}/${language} can export English source`);
      assert.ok(!explicitlySelectedEnglish.includes('Translation draft'), `${documentId}/${language} English source is not labeled as a draft`);
    }
  }
  configureUiLanguage('en');
});

test('the legal route uses the saved language and renders only the selected document', () => {
  assert.match(legalRoute, /const language = preferences\.language;/);
  assert.match(
    legalRoute,
    /getLegalDocumentForPreference\(sourceDocument,\s*sectionName,\s*language,\s*showEnglishSource\)/,
  );
  assert.match(legalRoute, /selectedDocument\.title/);
  assert.match(legalRoute, /selectedDocument\.sections\.map/);
  assert.match(legalRoute, /const isPendingDraft = language !== 'en' && !showEnglishSource/);
  assert.match(legalRoute, /const fileLanguage = isPendingDraft \? language : 'en'/);
  assert.match(legalRoute, /legalDocumentFileContent\(selectedDocument,\s*fileLanguage,\s*isPendingDraft\)/);
  assert.match(legalRoute, /testID="legal-save-document"/);
  assert.match(legalRoute, /if \(!document\) return/);
  assert.match(legalRoute, /if \(!document\) return <Screen title=\{translateUi\('Policy unavailable', language\)\}/);
});

test('unavailable or structurally incomplete drafts are rejected instead of falling back to English', () => {
  const source = LEGAL_DOCUMENTS.terms;
  const valid = LEGAL_DRAFT_TRANSLATIONS.terms.ur;
  const incompleteDrafts = [
    { ...valid, title: '' },
    { ...valid, sections: valid.sections.slice(0, -1) },
    { ...valid, sections: [{ ...valid.sections[0], heading: ' ' }, ...valid.sections.slice(1)] },
    {
      ...valid,
      sections: [{ ...valid.sections[0], paragraphs: [''] }, ...valid.sections.slice(1)],
    },
    {
      ...valid,
      sections: [{ ...valid.sections[0], bullets: 'not an array' }, ...valid.sections.slice(1)],
    },
  ];
  for (const draft of incompleteDrafts) {
    assert.equal(legalTranslationMatchesSource(source, draft), false);
  }

  const originalDrafts = Object.fromEntries(supportedLegalDraftLanguages.map(language => [language, LEGAL_DRAFT_TRANSLATIONS.terms[language]]));
  try {
    for (const language of supportedLegalDraftLanguages) {
      const original = originalDrafts[language];
      delete LEGAL_DRAFT_TRANSLATIONS.terms[language];
      assert.equal(getLegalDocumentForPreference(source, 'terms', language), undefined);
      LEGAL_DRAFT_TRANSLATIONS.terms[language] = { ...original, sections: original.sections.slice(0, -1) };
      assert.equal(getLegalDocumentForPreference(source, 'terms', language), undefined);
    }
  } finally {
    for (const language of supportedLegalDraftLanguages) LEGAL_DRAFT_TRANSLATIONS.terms[language] = originalDrafts[language];
  }
});
