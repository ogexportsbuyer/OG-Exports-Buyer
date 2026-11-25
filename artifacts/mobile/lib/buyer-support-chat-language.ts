type LanguageText = {
  original?: string | null;
  selectedTranslation?: string | null;
  selectedLanguage?: string | null;
  legacyTranslation?: string | null;
  legacyLanguage?: string | null;
  language: string;
};

export function supportTextForSelectedLanguage({
  original,
  selectedTranslation,
  selectedLanguage,
  legacyTranslation,
  legacyLanguage,
  language,
}: LanguageText): string {
  const wanted = language.trim().toLowerCase();
  if (!wanted) return original || '';

  if (selectedTranslation && selectedLanguage?.trim().toLowerCase() === wanted) {
    return selectedTranslation;
  }
  if (legacyTranslation && legacyLanguage?.trim().toLowerCase() === wanted) {
    return legacyTranslation;
  }

  return original || '';
}
