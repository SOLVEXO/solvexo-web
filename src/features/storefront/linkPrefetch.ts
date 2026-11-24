import { apiGetProductById } from '@/api/services/marketplace';
import { apiGetPublicCollectionBySlug } from '@/api/services/collections';
import { preloadThemeShell } from '@/features/storefront-themes/preloadThemeShell';
import { ssrRouteFor } from '@/features/storefront-themes/ssrRoutes';
import { localeFromPathname } from '@/i18n/localeConfig';

/**
 * Instant navigation, the way the big platforms do it: the moment a shopper points at (mouse) or touches a link to a page of
 * this store, that page's code and its main data start loading. By the time the click lands the CDN already holds the answer,
 * so the page opens at once instead of after a round trip.
 *
 * Quiet by design: only same-origin storefront pages, each address at most once, a short pause before a mouse pointer counts
 * (fly-bys do nothing), nothing on a data-saver connection, and a failed prefetch is simply ignored.
 */
const HOVER_DELAY_MS = 70;
const MAX_PREFETCHES = 40;

type Conn = { saveData?: boolean; effectiveType?: string };

export function startLinkPrefetch(storeId: string, themeId: string | null | undefined): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const conn = (navigator as Navigator & { connection?: Conn }).connection;
  if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return () => undefined;

  const done = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const pathOf = (target: EventTarget | null): string | null => {
    const anchor = target instanceof Element ? target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return null;
    let url: URL;
    try { url = new URL(anchor.href, window.location.href); } catch { return null; }
    if (url.origin !== window.location.origin) return null;
    const prefix = localeFromPathname(url.pathname);
    return prefix ? (url.pathname.slice(prefix.length + 1) || '/') : url.pathname;
  };

  const prefetch = (path: string) => {
    if (done.has(path) || done.size >= MAX_PREFETCHES) return;
    const route = ssrRouteFor(path);
    if (!route) return; // cart, account, checkout...: nothing public to warm
    done.add(path);
    void preloadThemeShell(themeId, path);
    const slug = path.split('/').filter(Boolean)[1];
    if (route.key === 'product' && slug) void apiGetProductById(decodeURIComponent(slug)).catch(() => undefined);
    else if (route.key === 'collection' && slug) void apiGetPublicCollectionBySlug(storeId, decodeURIComponent(slug)).catch(() => undefined);
  };

  const onOver = (e: Event) => {
    const path = pathOf(e.target);
    if (!path) return;
    clearTimeout(timer);
    timer = setTimeout(() => prefetch(path), HOVER_DELAY_MS);
  };
  const onOut = () => clearTimeout(timer);
  // A touch is an intent to open: no pause.
  const onTouch = (e: Event) => { const path = pathOf(e.target); if (path) prefetch(path); };

  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  document.addEventListener('touchstart', onTouch, { passive: true });
  return () => {
    clearTimeout(timer);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerout', onOut);
    document.removeEventListener('touchstart', onTouch);
  };
}
