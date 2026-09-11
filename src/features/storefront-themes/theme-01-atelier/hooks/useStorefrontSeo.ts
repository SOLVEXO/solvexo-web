import { useEffect, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetSeoMeta, type ResolvedSeoMeta, type SeoEntityType } from '@/api/services/publicSeo';

function setMetaTag(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonicalLink(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeCanonicalLink() {
  document.querySelector('link[rel="canonical"]')?.remove();
}

function setJsonLd(blocks: Record<string, unknown>[]) {
  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
  blocks.forEach(block => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', '1');
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  });
}

function removeJsonLd() {
  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
}

/** Real per-page `<title>`/meta description/Open Graph/Twitter Card/
 *  canonical/JSON-LD for the storefront — the direct replacement for the
 *  shared, marketplace-wide `usePageTitle` hook, which every Atelier page
 *  previously used and which hardcodes a `"Solvexo - "` prefix onto the tab
 *  title. That's a real bug on a store's OWN subdomain: this codebase's own
 *  established principle (see `AtelierLayout`/`AtelierNavbar`) is zero
 *  Solvexo branding on a storefront — a buyer on `hello.solvexo.store`
 *  should see "Product Name · hello", never "Solvexo - Product Name".
 *
 *  When `entityType`/`entityId` are given (product/category/store — every
 *  real call site has one), this fetches the REAL resolved SEO for that
 *  entity from the backend's already-built `SeoResolutionService` (seller
 *  overrides → parent fallback → platform template chain) and applies it
 *  verbatim: title, description, canonical URL, robots, full Open Graph +
 *  Twitter Card, and JSON-LD structured data (product/breadcrumb/store
 *  schema) — none of which existed on the storefront before this. The raw
 *  `title`/`description`/`image` params are only the instant, no-network
 *  fallback shown while that fetch is in flight (or if it ever fails), so a
 *  page never ships with a blank tab title. Resets everything on unmount,
 *  matching the old hook's cleanup convention. */
export function useStorefrontSeo({ entityType, entityId, title, description, image, noindex }: {
  entityType?: SeoEntityType;
  entityId?: string;
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
}) {
  const { store } = useStorefront();
  const [resolved, setResolved] = useState<ResolvedSeoMeta | null>(null);

  useEffect(() => {
    setResolved(null);
    if (!entityType || !entityId) return;
    let cancelled = false;
    apiGetSeoMeta(entityType, entityId)
      .then(meta => { if (!cancelled) setResolved(meta); })
      .catch(() => { if (!cancelled) setResolved(null); });
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  useEffect(() => {
    if (resolved) {
      // Real, backend-resolved SEO — title/description/canonical are
      // already fully computed (override chain + platform templates), used
      // as-is rather than re-templated here.
      document.title = resolved.title;
      setMetaTag('name', 'description', resolved.description);
      setMetaTag('property', 'og:title', resolved.ogTitle);
      setMetaTag('property', 'og:description', resolved.ogDescription);
      setMetaTag('property', 'og:type', resolved.entityType === 'product' ? 'product' : 'website');
      setMetaTag('property', 'og:url', resolved.url);
      if (resolved.ogImage) setMetaTag('property', 'og:image', resolved.ogImage);
      setMetaTag('name', 'twitter:card', resolved.twitterCard);
      setMetaTag('name', 'twitter:title', resolved.ogTitle);
      setMetaTag('name', 'twitter:description', resolved.ogDescription);
      if (resolved.ogImage) setMetaTag('name', 'twitter:image', resolved.ogImage);
      setCanonicalLink(resolved.canonicalUrl);
      setMetaTag('name', 'robots', resolved.noindex ? 'noindex, nofollow' : 'index, follow');
      setJsonLd(resolved.jsonLd ?? []);
      return () => {
        document.title = store.name;
        setMetaTag('name', 'robots', 'index, follow');
        removeCanonicalLink();
        removeJsonLd();
      };
    }

    // Fallback — used while the real fetch above is in flight, and if it
    // ever fails (e.g. offline), so a page never ships with a blank
    // title/description. Real e-commerce convention: cart/checkout/
    // account/auth pages are private-per-visitor or duplicate-shaped — they
    // shouldn't compete with the store's real product/collection pages in
    // search results.
    const fullTitle = title ? `${title} · ${store.name}` : store.name;
    document.title = fullTitle;
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:type', 'website');
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
    }
    if (image) setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    return () => { document.title = store.name; setMetaTag('name', 'robots', 'index, follow'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, title, description, image, noindex, store.name]);
}
