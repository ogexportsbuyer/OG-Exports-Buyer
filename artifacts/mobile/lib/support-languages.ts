export type SupportLanguage = {
  code: string;
  name: string;
};

const supportSpeechLocales: Record<string, string> = {
  ar: 'ar-SA',
  bn: 'bn-BD',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  nl: 'nl-NL',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
  id: 'id-ID',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ms: 'ms-MY',
  fa: 'fa-IR',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ru: 'ru-RU',
  es: 'es-ES',
  th: 'th-TH',
  tr: 'tr-TR',
  ur: 'ur-PK',
  vi: 'vi-VN',
  uk: 'uk-UA',
};

export const FALLBACK_SUPPORT_LANGUAGES: SupportLanguage[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ms', name: 'Malay' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
];

export function supportSpeechLocale(languageCode: string): string {
  const normalized = languageCode.trim().replaceAll('_', '-');
  if (!normalized) return 'en-US';
  if (normalized.includes('-')) return normalized;
  return supportSpeechLocales[normalized.toLocaleLowerCase()] ?? normalized;
}

export function matchSupportSpeechVoice<T extends { language: string }>(
  voices: readonly T[],
  languageCode: string,
): T | undefined {
  const locale = supportSpeechLocale(languageCode).toLocaleLowerCase();
  const exact = voices.find((voice) => voice.language.replaceAll('_', '-').toLocaleLowerCase() === locale);
  if (exact) return exact;

  const baseLanguage = locale.split('-')[0];
  return voices.find((voice) => voice.language.replaceAll('_', '-').toLocaleLowerCase().split('-')[0] === baseLanguage);
}

export function defaultSupportLanguageForCountry(countryValue: string): string {
  const country = countryValue.trim().toLocaleLowerCase();

  if (['pakistan', 'pak'].includes(country)) return 'ur';
  if ([
    'saudi arabia', 'saudi', 'uae', 'united arab emirates', 'qatar', 'oman',
    'kuwait', 'bahrain', 'egypt', 'jordan', 'iraq', 'lebanon', 'morocco',
    'algeria', 'tunisia',
  ].includes(country)) return 'ar';
  if (['turkey', 'türkiye'].includes(country)) return 'tr';
  if (['china', 'mainland china'].includes(country)) return 'zh-CN';
  if (['taiwan'].includes(country)) return 'zh-TW';
  if (['japan'].includes(country)) return 'ja';
  if (['south korea', 'korea, republic of'].includes(country)) return 'ko';
  if (['bangladesh'].includes(country)) return 'bn';
  if (['india'].includes(country)) return 'hi';
  if (['iran'].includes(country)) return 'fa';
  if (['russia'].includes(country)) return 'ru';
  if (['germany', 'austria'].includes(country)) return 'de';
  if (['france', 'belgium'].includes(country)) return 'fr';
  if (['spain', 'mexico', 'colombia', 'argentina', 'chile', 'peru'].includes(country)) return 'es';
  if (['italy'].includes(country)) return 'it';
  if (['brazil', 'portugal'].includes(country)) return 'pt';
  if (['netherlands'].includes(country)) return 'nl';
  if (['poland'].includes(country)) return 'pl';
  if (['indonesia'].includes(country)) return 'id';
  if (['thailand'].includes(country)) return 'th';
  if (['vietnam'].includes(country)) return 'vi';
  if (['ukraine'].includes(country)) return 'uk';
  return 'en';
}

export function supportLanguageLabel(code: string, languages: SupportLanguage[]): string {
  return languages.find((language) => language.code === code)?.name ?? code.toUpperCase();
}
