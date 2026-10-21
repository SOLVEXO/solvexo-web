import { localizeFields, type TextIndex } from './storeText';

/**
 * The storefront's active language and seller translations, for code that fetches content outside React (the API
 * service functions). StorefrontLayout sets it; everywhere else (seller dashboard, admin) it stays empty, so those
 * screens always see the original text.
 */
let activeLocale = ''; // '' = the store's own (source) language: nothing to translate
let activeIndex: TextIndex = new Map();

export function setActiveStoreText(locale: string, index: TextIndex) {
  activeLocale = locale;
  activeIndex = index;
}

export function getActiveStoreLocale(): string {
  return activeLocale;
}

/** The URL segment of a product / collection / page / blog post in the active language: the handle saved in Translate & adapt, else its slug (else its id). */
export function handleOf(item: { slug?: string | null; _id?: string; translations?: Record<string, { handle?: string | null } | undefined> | null }): string {
  const own = activeLocale ? item.translations?.[activeLocale]?.handle : null;
  return (own && own.trim()) || item.slug || item._id || '';
}

type Translated = { title?: string; description?: string | null; metaTitle?: string | null; metaDescription?: string | null };

/** A blog post (list item or full post) in the active language: title, excerpt, SEO fields, and the body text. */
export function localizeBlogPost<T extends { _id?: string; title?: string; excerpt?: string; seoTitle?: string | null; seoDescription?: string | null; translations?: Record<string, Translated> | null }>(post: T): T {
  if (!activeLocale) return post;
  const tr = post.translations?.[activeLocale];
  let next: T = tr
    ? {
        ...post,
        ...(tr.title ? { title: tr.title } : {}),
        ...(tr.description ? { excerpt: tr.description } : {}),
        ...(tr.metaTitle ? { seoTitle: tr.metaTitle } : {}),
        ...(tr.metaDescription ? { seoDescription: tr.metaDescription } : {}),
      }
    : post;
  if (post._id) next = localizeFields(next, `bp:${post._id}`, activeIndex);
  return next;
}

/** A category (and its subtree) in the active language: name and description. */
export function localizeCategory<T extends { _id?: string; children?: T[] }>(category: T): T {
  if (!activeLocale || !activeIndex.size) return category;
  const own = category._id ? localizeFields(category, `cat:${category._id}`, activeIndex) : category;
  return own.children ? { ...own, children: own.children.map(localizeCategory) } : own;
}

/** A delivery option (shipping zone) in the active language: name, region and pickup instructions. */
export function localizeShippingZone<T extends { _id?: string }>(zone: T): T {
  if (!activeLocale || !activeIndex.size || !zone._id) return zone;
  return localizeFields(zone, `ship:${zone._id}`, activeIndex);
}

/** A store-defined payment method in the active language (its `displayName` is the seller's method name). */
export function localizePaymentMethod<T extends { methodId?: string; displayName?: string; instructions?: string }>(method: T): T {
  if (!activeLocale || !activeIndex.size || !method.methodId) return method;
  const local = localizeFields({ name: method.displayName, instructions: method.instructions }, `pay:${method.methodId}`, activeIndex);
  return { ...method, displayName: local.name ?? method.displayName, instructions: local.instructions ?? method.instructions };
}
