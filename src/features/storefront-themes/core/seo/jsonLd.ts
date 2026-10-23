import { localeFromPathname } from '@/i18n/localeConfig';

/** Pure schema.org builders (Shopify-style structured data). Output is plain JSON-safe objects with no empty fields. */
type Json = Record<string, unknown>;

export const ITEM_LIST_CAP = 24;
export const BLOG_ENTRY_CAP = 12;

/** Removes undefined / null / empty strings / empty arrays and empty objects, recursively. */
export function clean<T>(value: T): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return (value.trim() === '' ? undefined : value) as T | undefined;
  if (typeof value === 'number') return (Number.isFinite(value) ? value : undefined) as T | undefined;
  if (Array.isArray(value)) {
    const arr = value.map(clean).filter(v => v !== undefined);
    return (arr.length ? arr : undefined) as T | undefined;
  }
  if (typeof value === 'object') {
    const out: Json = {};
    for (const [k, v] of Object.entries(value as Json)) {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    }
    return (Object.keys(out).length ? out : undefined) as T | undefined;
  }
  return value;
}

/** Plain text from seller HTML/rich text: no tags, collapsed whitespace, optional length cap. */
export function plainText(input: string | null | undefined, max = 300): string | undefined {
  if (!input) return undefined;
  const text = input.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : undefined;
}

/** JSON text that can never close the surrounding <script> tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Absolute URL builder on the page's own host; keeps the language prefix (`/ur`) of the page being viewed. */
export function pageUrlBuilder(origin: string, pathname: string) {
  const l = localeFromPathname(pathname);
  const prefix = l ? `/${l}` : '';
  const host = origin.replace(/\/$/, '');
  return (barePath: string) => `${host}${prefix}${barePath.startsWith('/') ? barePath : `/${barePath}`}`;
}

/** Absolute http(s) image URL, or undefined when it cannot be made absolute. */
export function absImage(url: string | null | undefined, origin: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${origin.replace(/\/$/, '')}${url}`;
  return undefined;
}

const ctx = '@context';
const SCHEMA = 'https://schema.org';

export function breadcrumbJsonLd(trail: { name: string; url: string }[]): Json | null {
  const items = trail.filter(t => t.name && t.url);
  if (items.length < 2) return null;
  return {
    [ctx]: SCHEMA, '@type': 'BreadcrumbList',
    itemListElement: items.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: t.url })),
  };
}

export interface ListProduct { slug: string; name: string; images?: string[] }

export function collectionJsonLd(o: { name: string; description?: string | null; image?: string | null; url: string; origin: string; products: ListProduct[]; urlFor: (barePath: string) => string }): Json {
  const products = o.products.slice(0, ITEM_LIST_CAP);
  return clean({
    [ctx]: SCHEMA, '@type': 'CollectionPage', name: o.name, description: plainText(o.description), url: o.url,
    image: absImage(o.image, o.origin),
    mainEntity: products.length ? {
      '@type': 'ItemList', numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem', position: i + 1, url: o.urlFor(`/product/${p.slug}`), name: p.name, image: absImage(p.images?.[0], o.origin),
      })),
    } : undefined,
  }) as Json;
}

export interface ProductLdInput {
  name: string; description?: string | null; images: string[]; sku?: string | null; vendor?: string | null;
  price: number; currency?: string | null; inStock: boolean; url: string; origin: string;
  rating?: { value: number; count: number } | null;
}

export function productJsonLd(o: ProductLdInput): Json {
  const currency = (o.currency ?? '').toString().trim().toUpperCase();
  return clean({
    [ctx]: SCHEMA, '@type': 'Product', name: o.name, description: plainText(o.description), url: o.url,
    image: o.images.map(i => absImage(i, o.origin)).filter(Boolean).slice(0, 6),
    sku: o.sku || undefined,
    brand: o.vendor ? { '@type': 'Brand', name: o.vendor } : undefined,
    offers: currency && Number.isFinite(o.price) ? {
      '@type': 'Offer', url: o.url, price: Math.round(o.price * 100) / 100, priceCurrency: currency,
      availability: o.inStock ? `${SCHEMA}/InStock` : `${SCHEMA}/OutOfStock`,
    } : undefined,
    aggregateRating: o.rating && o.rating.count > 0 && o.rating.value > 0
      ? { '@type': 'AggregateRating', ratingValue: Math.round(o.rating.value * 10) / 10, reviewCount: o.rating.count } : undefined,
  }) as Json;
}

export function articleJsonLd(o: {
  headline: string; description?: string | null; image?: string | null; datePublished?: string | null; dateModified?: string | null;
  author?: string | null; storeName: string; logo?: string | null; url: string; origin: string;
}): Json {
  return clean({
    [ctx]: SCHEMA, '@type': 'Article', headline: o.headline.slice(0, 110), description: plainText(o.description),
    image: absImage(o.image, o.origin), datePublished: o.datePublished, dateModified: o.dateModified || o.datePublished,
    author: o.author ? { '@type': 'Person', name: o.author } : { '@type': 'Organization', name: o.storeName },
    publisher: { '@type': 'Organization', name: o.storeName, logo: o.logo ? { '@type': 'ImageObject', url: absImage(o.logo, o.origin) } : undefined },
    mainEntityOfPage: { '@type': 'WebPage', '@id': o.url },
  }) as Json;
}

export interface BlogEntry { slug: string; title: string; excerpt?: string | null; coverImage?: string | null; publishedAt?: string | null; authorName?: string }

export function blogJsonLd(o: { name: string; description?: string | null; url: string; origin: string; posts: BlogEntry[]; postUrl: (slug: string) => string }): Json {
  return clean({
    [ctx]: SCHEMA, '@type': 'Blog', name: o.name, description: plainText(o.description), url: o.url,
    blogPost: o.posts.slice(0, BLOG_ENTRY_CAP).map(p => ({
      '@type': 'BlogPosting', headline: p.title.slice(0, 110), url: o.postUrl(p.slug), description: plainText(p.excerpt),
      image: absImage(p.coverImage, o.origin), datePublished: p.publishedAt,
      author: p.authorName ? { '@type': 'Person', name: p.authorName } : undefined,
    })),
  }) as Json;
}
