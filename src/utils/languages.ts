/** Languages a store can offer on a market (ISO 639-1). `en` is the store's own language and is never translated. */
export interface LanguageOption { code: string; name: string }

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English' }, { code: 'ur', name: 'Urdu' }, { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' }, { code: 'de', name: 'German' }, { code: 'es', name: 'Spanish' },
  { code: 'fa', name: 'Persian' }, { code: 'fr', name: 'French' }, { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' }, { code: 'id', name: 'Indonesian' }, { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' }, { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' }, { code: 'pa', name: 'Punjabi' }, { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' }, { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' }, { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' }, { code: 'zh', name: 'Chinese' },
];

const RTL = new Set(['ur', 'ar', 'he', 'fa']);

export function isRtlLanguage(code: string | null | undefined): boolean {
  return !!code && RTL.has(code.toLowerCase());
}

export function languageName(code: string): string {
  return LANGUAGE_OPTIONS.find(l => l.code === code)?.name ?? code.toUpperCase();
}
