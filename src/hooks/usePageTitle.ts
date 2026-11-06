import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoOwnsTitle } from '@/seo/seoHost';

// An empty title is a deliberate no-op — lets a page that's sometimes
// rendered standalone and sometimes embedded as a tab inside another page
// (e.g. AdminModeration's `embedded` prop) call this hook unconditionally
// (never skip a hook call itself) while still leaving the parent page's own
// title alone when embedded.
// Public-site pages listed in src/seo/publicPages get their search-friendly title from SeoHead instead.
export function usePageTitle(title: string) {
  const { pathname } = useLocation();
  const seoOwned = seoOwnsTitle(pathname);
  useEffect(() => {
    if (!title || seoOwned) return;
    document.title = `Solvexo - ${title}`;
    return () => { document.title = 'Solvexo'; };
  }, [title, seoOwned]);
}
