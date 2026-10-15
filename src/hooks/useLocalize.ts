import { useMemo } from 'react';
import { useContentLocale } from '@/features/storefront/storefrontMarket';
import {
  localizeCollection, localizeMenuItemLabel, localizePage, localizeProduct,
  type ContentTranslations, type LocalizedExtras,
} from '@/utils/localize';

/** Storefront content localizers bound to the active language (source text when there is no translation). */
export function useLocalize() {
  const locale = useContentLocale();
  return useMemo(() => ({
    locale,
    product: <T extends { name?: string; description?: string | null; translations?: ContentTranslations }>(p: T): T & LocalizedExtras => localizeProduct(p, locale),
    collection: <T extends { name?: string; description?: string | null; translations?: ContentTranslations }>(c: T): T & LocalizedExtras => localizeCollection(c, locale),
    page: <T extends { title?: string; translations?: ContentTranslations }>(p: T): T & LocalizedExtras => localizePage(p, locale),
    menuLabel: (item: { label?: string; labelTranslations?: Record<string, string | undefined> | null } | null | undefined): string => localizeMenuItemLabel(item, locale),
  }), [locale]);
}
