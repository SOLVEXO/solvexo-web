import { LANGUAGE_DATA } from '@/i18n/languageData';

/** Languages a store can publish in (ISO 639-1). The language the store is written in is the source and is never translated. */
export interface LanguageOption { code: string; name: string }

export const LANGUAGE_OPTIONS: LanguageOption[] = LANGUAGE_DATA.map(l => ({ code: l.code, name: l.name }));

const RTL = new Set(LANGUAGE_DATA.filter(l => l.rtl).map(l => l.code));

export function isRtlLanguage(code: string | null | undefined): boolean {
  return !!code && RTL.has(code.toLowerCase());
}

export function languageName(code: string): string {
  return LANGUAGE_OPTIONS.find(l => l.code === code)?.name ?? code.toUpperCase();
}
