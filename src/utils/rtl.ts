import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtlLocale } from '@/i18n/localeConfig';

/** Utility function to check if a language is RTL. */
export function isRTLLanguage(lang: string): boolean {
  return isRtlLocale(lang);
}

/** Sets `dir`/`lang` on <html> for a language. The i18n bootstrap and the storefront call this. */
export function applyDocumentDirection(lang: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('dir', isRtlLocale(lang) ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
}

/** Hook: keeps <html dir/lang> in step with the active UI language; returns whether it is RTL. */
export function useRTL() {
  const { i18n } = useTranslation();
  useEffect(() => { applyDocumentDirection(i18n.language); }, [i18n.language]);
  return isRtlLocale(i18n.language);
}

/** Text alignment based on RTL direction. */
export function getTextAlignment(isRTL: boolean): 'left' | 'right' {
  return isRTL ? 'right' : 'left';
}

/** Opposite text alignment. */
export function getOppositeTextAlignment(isRTL: boolean): 'left' | 'right' {
  return isRTL ? 'left' : 'right';
}
