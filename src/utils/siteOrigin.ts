import { useLocation } from 'react-router-dom';

/**
 * Where the page being rendered lives. In the browser these come from `window.location`; while a page is rendered on the
 * server there is no `window`, so the server sets them once per render (`setServerOrigin`, `setServerPath`).
 */
let serverOrigin = '';
let serverPath = '/';

export function setServerOrigin(origin: string): void {
  serverOrigin = origin;
}

export function setServerPath(path: string): void {
  serverPath = path;
}

/** `https://shop.example.com` */
export function siteOrigin(): string {
  return typeof window === 'undefined' ? serverOrigin : window.location.origin;
}

/** The page's full path as the visitor sees it, language folder included (`/ur/product/x`). Not a hook: safe anywhere in render. */
export function sitePathname(): string {
  return typeof window === 'undefined' ? serverPath : window.location.pathname;
}

/** Hook form of `sitePathname` for code that wants to re-render when the route changes. */
export function useSitePathname(): string {
  const { pathname } = useLocation();
  return typeof window === 'undefined' ? pathname : window.location.pathname;
}
