import { useEffect } from 'react';

const DEFAULT_FAVICON = '/favicon.png';

/**
 * Swaps the browser tab's favicon to `url` (falling back to `fallbackUrl`,
 * then the platform default) for as long as the calling component is
 * mounted — restores whatever favicon was there before on unmount. Shared
 * by the public storefront (`StorefrontLayout`'s per-store favicon) and the
 * seller's own store workspace (`StoreLayout`) so a store's real favicon
 * shows in the browser tab in both places, not just on its public site.
 */
export function useFavicon(url: string | null | undefined, fallbackUrl?: string | null | undefined) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const previousHref = link.href;
    link.href = url || fallbackUrl || DEFAULT_FAVICON;
    return () => { link.href = previousHref; };
  }, [url, fallbackUrl]);
}
