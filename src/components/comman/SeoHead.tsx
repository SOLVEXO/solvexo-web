import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalUrl, seoForPath } from '@/seo/publicPages';
import { ON_STORE_HOST, PRIVATE_HOST } from '@/seo/seoHost';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Title, description, canonical URL, Open Graph and robots tags for Solvexo's public site, from `src/seo/publicPages`.
 * - Country addresses (`/pk/pricing`) canonicalise to the plain page (`https://www.solvexo.store/pricing`).
 * - Sign-in/sign-up steps, unknown addresses and every dashboard are `noindex`.
 * Mounted once in RootLayout.
 */
export function SeoHead() {
  const { pathname } = useLocation(); // already without the country prefix (router basename)

  useEffect(() => {
    if (ON_STORE_HOST) return;
    if (PRIVATE_HOST) { setMeta('name', 'robots', 'noindex, nofollow'); setCanonical(null); return; }

    const page = seoForPath(pathname);
    if (!page) {
      setMeta('name', 'robots', 'noindex, follow');
      setCanonical(null);
      return;
    }
    document.title = page.title;
    setMeta('name', 'description', page.description);
    setMeta('name', 'robots', page.index ? 'index, follow, max-image-preview:large' : 'noindex, follow');
    const url = canonicalUrl(page.path);
    setCanonical(page.index ? url : null);
    setMeta('property', 'og:title', page.title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
  }, [pathname]);

  return null;
}
