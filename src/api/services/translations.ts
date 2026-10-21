import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type TranslationResource = 'products' | 'collections' | 'pages' | 'menus' | 'blog_posts';

export interface TranslationValues {
  title?: string;
  description?: string;
  handle?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface TranslatableMenuItem {
  id: string;
  label: string;
  depth: number;
  labelTranslations: Record<string, string>;
}

export interface TranslatableItem {
  id: string;
  source: { title: string; description?: string; handle?: string };
  translations: Record<string, TranslationValues>;
  menuItems?: TranslatableMenuItem[];
}

export interface TranslationsPage {
  items: TranslatableItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function apiListTranslatable(storeId: string, resource: TranslationResource, params: { page: number; limit: number; q?: string }) {
  return client.get<never, ApiResponse<TranslationsPage>>(ENDPOINTS.TRANSLATIONS.LIST(storeId, resource), { params });
}

/** Menus send `{ labels: { [menuItemId]: string } }`; everything else sends the field values. */
export function apiSaveTranslation(storeId: string, resource: TranslationResource, id: string, locale: string, body: TranslationValues | { labels: Record<string, string> }) {
  return client.put<never, ApiResponse<TranslatableItem>>(ENDPOINTS.TRANSLATIONS.ONE(storeId, resource, id, locale), body);
}

export function apiDeleteTranslation(storeId: string, resource: TranslationResource, id: string, locale: string) {
  return client.delete<never, { success: boolean }>(ENDPOINTS.TRANSLATIONS.ONE(storeId, resource, id, locale));
}
