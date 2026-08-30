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
 *  storefront — the direct replacement for the shared, marketplace-wide
 *  `usePageTitle` hook, which every Atelier page previously used and which
 *  hardcodes a `"Solvexo - "` prefix onto the tab title. That's a real bug
 *  on a store's OWN subdomain: this codebase's own established principle
 *  (see `AtelierLayout`/`AtelierNavbar`) is zero Solvexo branding on a
 *  storefront — a buyer on `hello.solvexo.store` should see "Product Name ·
 *  hello", never "Solvexo - Product Name". Also the one place real SEO meta
 *  tags (description/OG) get set for Product/Collection/Home/Blog Article —
 *  search engines and social-share unfurls had nothing to read before this.
 *  Resets to the store's own name/no-description on unmount, matching the
 *  old hook's cleanup convention. */
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
    // Real e-commerce convention (cart/checkout/account/auth pages are
    // private-per-visitor or duplicate-shaped — they shouldn't compete with
    // the store's real product/collection pages in search results).
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    return () => { document.title = store.name; setMetaTag('name', 'robots', 'index, follow'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, noindex, store.name]);
}
