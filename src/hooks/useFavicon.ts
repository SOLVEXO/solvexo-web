import { useEffect } from 'react';

const DEFAULT_FAVICON = '/favicon.png';
const BLANK_FAVICON = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Swaps the browser tab's favicon to `url` (falling back to `fallbackUrl`,
 * then the platform default) for as long as the calling component is
 * mounted — restores whatever favicon was there before on unmount. Shared
 * by the public storefront (`StorefrontLayout`'s per-store favicon) and the
 * seller's own store workspace (`StoreLayout`) so a store's real favicon
 * shows in the browser tab in both places, not just on its public site.
 */
export function useFavicon(url: string | null | undefined, fallbackUrl?: string | null | undefined, opts?: { blankWhenMissing?: boolean }) {
  const blank = !!opts?.blankWhenMissing;
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const previousHref = link.href;
    const previousType = link.getAttribute('type');
    // Public storefront: only the seller's own favicon, otherwise no icon (never the logo or the platform's).
    link.href = url || (blank ? BLANK_FAVICON : fallbackUrl || DEFAULT_FAVICON);
    if (url || blank) link.removeAttribute('type');
    return () => { link.href = previousHref; if (previousType) link.setAttribute('type', previousType); };
  }, [url, fallbackUrl, blank]);
}
