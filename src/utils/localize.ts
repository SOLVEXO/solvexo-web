/**
 * Seller-content localization. Every helper returns the translated value when
 * `translations[locale]` has a NON-EMPTY value for it and otherwise the source
 * field - never blank. Routing is never touched: `slug` stays the source slug;
 * a translated handle is exposed separately as `localizedHandle`.
 */
export interface ContentTranslation {
  title?: string | null;
  description?: string | null;
  handle?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}
export type ContentTranslations = Record<string, ContentTranslation | undefined> | null | undefined;

export interface LocalizedExtras {
  localizedHandle?: string;
  localizedMetaTitle?: string;
  localizedMetaDescription?: string;
}

function nonEmpty(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function entry(translations: ContentTranslations, locale: string): ContentTranslation | undefined {
  if (!translations || !locale) return undefined;
  return translations[locale] ?? undefined;
}

function extras(tr: ContentTranslation | undefined): LocalizedExtras {
  const out: LocalizedExtras = {};
  const h = nonEmpty(tr?.handle); if (h) out.localizedHandle = h;
  const mt = nonEmpty(tr?.metaTitle); if (mt) out.localizedMetaTitle = mt;
  const md = nonEmpty(tr?.metaDescription); if (md) out.localizedMetaDescription = md;
  return out;
}

/** Product: `name`, `description` (+ extras). Returns the SAME object when nothing is translated. */
export function localizeProduct<T extends { name?: string; description?: string | null; translations?: ContentTranslations }>(
  product: T, locale: string,
): T & LocalizedExtras {
  const tr = entry(product?.translations, locale);
  if (!tr) return product;
  const name = nonEmpty(tr.title); const description = nonEmpty(tr.description);
  const ex = extras(tr);
  if (!name && !description && Object.keys(ex).length === 0) return product;
  return { ...product, ...(name ? { name } : {}), ...(description ? { description } : {}), ...ex };
}

/** Collection: `name`, `description` (+ extras). */
export function localizeCollection<T extends { name?: string; description?: string | null; translations?: ContentTranslations }>(
  collection: T, locale: string,
): T & LocalizedExtras {
  const tr = entry(collection?.translations, locale);
  if (!tr) return collection;
  const name = nonEmpty(tr.title); const description = nonEmpty(tr.description);
  const ex = extras(tr);
  if (!name && !description && Object.keys(ex).length === 0) return collection;
  return { ...collection, ...(name ? { name } : {}), ...(description ? { description } : {}), ...ex };
}

/** Custom page: `title` (+ extras). Page body sections are not translated. */
export function localizePage<T extends { title?: string; translations?: ContentTranslations }>(
  page: T, locale: string,
): T & LocalizedExtras {
  const tr = entry(page?.translations, locale);
  if (!tr) return page;
  const title = nonEmpty(tr.title);
  const ex = extras(tr);
  if (!title && Object.keys(ex).length === 0) return page;
  return { ...page, ...(title ? { title } : {}), ...ex };
}

/** Menu / nav item label (`labelTranslations[locale]`), falling back to the source label. */
export function localizeMenuItemLabel(
  item: { label?: string; labelTranslations?: Record<string, string | undefined> | null } | null | undefined,
  locale: string,
): string {
  const source = item?.label ?? '';
  return nonEmpty(item?.labelTranslations?.[locale]) ?? source;
}
