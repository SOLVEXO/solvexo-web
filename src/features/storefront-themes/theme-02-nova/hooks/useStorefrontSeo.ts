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
 *  canonical/JSON-LD for the storefront. Theme-agnostic (reads only
 *  `useStorefront()`, no Nova- or Atelier-specific state) — this is a
 *  byte-for-byte copy of `theme-01-atelier/hooks/useStorefrontSeo.ts`, kept
 *  as each theme's own file (rather than a shared import) so every theme's
 *  file tree is fully self-contained and independently readable/exportable
 *  in Edit Code, matching this theme system's "no theme reaches into
 *  another theme's folder" convention. See that file's own doc comment for
 *  the full rationale (per-store-subdomain title, real backend-resolved
 *  SEO via `SeoResolutionService`, noindex on private/duplicate-shaped
 *  pages). */
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
