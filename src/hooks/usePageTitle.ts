import { useEffect } from 'react';

// An empty title is a deliberate no-op — lets a page that's sometimes
// rendered standalone and sometimes embedded as a tab inside another page
// (e.g. AdminModeration's `embedded` prop) call this hook unconditionally
// (never skip a hook call itself) while still leaving the parent page's own
// title alone when embedded.
export function usePageTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    document.title = `Solvexo - ${title}`;
    return () => { document.title = 'Solvexo'; };
  }, [title]);
}
