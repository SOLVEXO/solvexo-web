import { useEffect } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';

/** Shopify-style tab title ("Page – Store", home = the store's own title) plus description / social tags / noindex. */
export function useStorefrontSeo({ title, description, image, noindex }: { title?: string; description?: string | null; image?: string | null; noindex?: boolean }) {
  const { store } = useStorefront();
  const storeName = store.name;
  const fallbackDescription = store.description ?? store.tagline ?? '';

  useEffect(() => {
    const previousTitle = document.title;
    const full = title ? (title === storeName ? title : `${title} – ${storeName}`) : storeName;
    document.title = full;
    const desc = (description ?? fallbackDescription ?? '').trim();
    const restore: (() => void)[] = [];
    const meta = (attr: 'name' | 'property', key: string, content: string | null) => {
      if (!content) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      const created = !el;
      const before = el?.content ?? null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = content;
      restore.push(() => { if (created) el!.remove(); else if (before !== null) el!.content = before; });
    };
    meta('name', 'description', desc || null);
    meta('property', 'og:title', full);
    meta('property', 'og:description', desc || null);
    meta('property', 'og:image', image ?? store.logo ?? null);
    meta('name', 'robots', noindex ? 'noindex, nofollow' : null);
    return () => { document.title = previousTitle; restore.forEach(fn => fn()); };
  }, [title, description, image, noindex, storeName, fallbackDescription, store.logo]);
}
