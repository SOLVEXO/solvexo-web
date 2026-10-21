import client from '../client';
import { dedupedGet } from '../../utils/dedupedGet';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface TextSourceItem {
  key: string;
  label: string;
  source: string;
  multiline: boolean;
}

export interface TextSourceGroup {
  id: string;
  title: string;
  kind: 'store' | 'announcement' | 'header' | 'footer' | 'page' | 'template' | 'faq' | 'category' | 'blog_post';
  items: TextSourceItem[];
}

/** Seller: everything on the storefront that can be translated, grouped by where it shows. */
export function apiGetTextSources(storeId: string, scope?: string) {
  return client.get<never, ApiResponse<{ groups: TextSourceGroup[] }>>(ENDPOINTS.STORE_TEXT_TRANSLATIONS.SOURCES(storeId), { params: scope ? { scope } : undefined });
}

/** Seller: the saved translations of one language (key → text). */
export function apiGetTextTranslations(storeId: string, locale: string) {
  return client.get<never, ApiResponse<{ strings: Record<string, string> }>>(ENDPOINTS.STORE_TEXT_TRANSLATIONS.LOCALE(storeId, locale));
}

/** Seller: save many at once; an empty value removes that translation. */
export function apiSaveTextTranslations(storeId: string, locale: string, entries: { key: string; value: string }[]) {
  return client.put<never, ApiResponse<{ strings: Record<string, string> }>>(ENDPOINTS.STORE_TEXT_TRANSLATIONS.LOCALE(storeId, locale), { entries });
}

/** Seller: machine translation of up to 40 texts; returns suggestions for review, saves nothing. */
export function apiAutoTranslateText(storeId: string, locale: string, keys: string[]) {
  return client.post<never, ApiResponse<{ translations: Record<string, string> }>>(ENDPOINTS.STORE_TEXT_TRANSLATIONS.AUTO(storeId, locale), { keys });
}

/** Storefront (no auth): the translated texts of one language. */
export function apiGetPublicTextStrings(storeId: string, locale: string) {
  return dedupedGet(`store-text:${storeId}:${locale}`, () => client.get<never, ApiResponse<{ strings: Record<string, string> }>>(ENDPOINTS.STORE_TEXT_TRANSLATIONS.PUBLIC(storeId, locale)));
}
