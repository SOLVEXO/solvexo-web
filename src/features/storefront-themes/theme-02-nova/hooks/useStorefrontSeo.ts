import { useEffect } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';

function setMetaTag(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/** Real per-page `<title>`/meta description/Open Graph tags for the
 *  storefront. Theme-agnostic (reads only `useStorefront()`, no Nova- or
 *  Atelier-specific state) — this is a byte-for-byte copy of
 *  `theme-01-atelier/hooks/useStorefrontSeo.ts`, kept as each theme's own
 *  file (rather than a shared import) so every theme's file tree is fully
 *  self-contained and independently readable/exportable in Edit Code,
 *  matching this theme system's "no theme reaches into another theme's
 *  folder" convention. See that file's own doc comment for the full
 *  rationale (per-store-subdomain title, real SEO meta, noindex on
 *  private/duplicate-shaped pages). */
export function useStorefrontSeo({ title, description, image, noindex }: { title?: string; description?: string; image?: string; noindex?: boolean }) {
  const { store } = useStorefront();
  useEffect(() => {
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
  }, [title, description, image, noindex, store.name]);
}
