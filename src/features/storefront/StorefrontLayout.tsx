import { useEffect, useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { SkeletonBox, StoreAnnouncementBar } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Store, ArrowLeft } from 'lucide-react';
import { apiGetPublicStore, type PublicStoreData } from '@/api/services/store';
import { apiGetPublicStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { getStoreSlugFromHost, getMainAppUrl } from '@/utils/storefrontUrl';
import { StorefrontProvider, STOREFRONT_CFG_DEFAULT, type StorefrontContextValue } from './StorefrontContext';
import { StorefrontNavbar } from './StorefrontNavbar';
import { StorefrontFooter } from './StorefrontFooter';

const DEFAULT_FAVICON = '/favicon.png';

/** Swaps the browser tab icon to the store's own logo while on any `/:slug*` route, restoring Solvexo's default on unmount — same "zero Solvexo branding on the storefront" principle as the navbar/footer, just for the one piece of chrome that lives outside React's render tree. */
function useStorefrontFavicon(logo: string | null | undefined) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const previousHref = link.href;
    link.href = logo || DEFAULT_FAVICON;
    return () => { link.href = previousHref; };
  }, [logo]);
}

// Root layout for a store's own subdomain (`hello.solvexo.store`) — the
// router only ever mounts this tree when `getStoreSlugFromHost()` resolved a
// slug at boot (see `router/index.tsx`), so the slug comes from the
// hostname, not a `:slug` path param — subdomains carry no such segment.
// Fetches the store + its StoreTheme ONCE, provides both via context to
// every child route (home, custom pages, blog), and renders the seller's
// own zero-Solvexo-branding navbar/footer around them.
export function StorefrontLayout() {
  const slug = getStoreSlugFromHost();
  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [theme, setTheme] = useState<StoreThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetPublicStore(slug)
      .then(res => {
        if (cancelled) return;
        setStore(res.data);
        return apiGetPublicStoreTheme(res.data.storeId).then(r => { if (!cancelled) setTheme(r.data); });
      })
      .catch(() => { if (!cancelled) setError('Store not found'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useStorefrontFavicon(store?.logo);

  const cfg = useMemo(() => ({
    primaryColor: theme?.theme.primaryColor ?? STOREFRONT_CFG_DEFAULT.primaryColor,
    bgColor:      theme?.theme.bgColor      ?? STOREFRONT_CFG_DEFAULT.bgColor,
    textColor:    theme?.theme.textColor    ?? STOREFRONT_CFG_DEFAULT.textColor,
    accentColor:  theme?.theme.accentColor  ?? STOREFRONT_CFG_DEFAULT.accentColor,
    font:         theme?.theme.font         ?? STOREFRONT_CFG_DEFAULT.font,
  }), [theme]);

  const contextValue: StorefrontContextValue | null = useMemo(() => {
    if (!store || !slug) return null;
    return {
      store,
      theme,
      cfg,
      resolveLink: (link) => {
        if (link.linkType === 'external') return { href: link.url };
        if (link.linkType === 'blog') return { to: `/blog` };
        if (link.linkType === 'page' && link.pageSlug) return { to: `/${link.pageSlug}` };
        return { to: `/` }; // 'home' (and any unrecognized fallback) — same subdomain, no slug segment needed
      },
    };
  }, [store, theme, cfg, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-[64px] flex items-center gap-3 px-4 sm:px-6 lg:px-10 border-b border-bone">
          <SkeletonBox width={36} height={36} rounded="8px" />
          <SkeletonBox width={120} height={16} rounded="4px" />
        </div>
      </div>
    );
  }

  if (error || !store || !contextValue) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <Store size={48} className="text-bone" />
        <p className="text-[15px] text-slate">Store not found</p>
        <Button variant="secondary" size="sm" onClick={() => { window.location.href = getMainAppUrl('/marketplace'); }}>
          <ArrowLeft size={13} className="mr-1" /> Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <StorefrontProvider value={contextValue}>
      <div className="min-h-screen" style={{ background: cfg.bgColor, color: cfg.textColor }}>
        <StorefrontNavbar />
        {store.announcementBar?.message && (
          <StoreAnnouncementBar
            storeId={store.storeId}
            message={store.announcementBar.message}
            type={store.announcementBar.type}
            ctaLabel={store.announcementBar.ctaLabel}
            ctaLink={store.announcementBar.ctaLink}
          />
        )}
        <Outlet />
        <StorefrontFooter />
      </div>
    </StorefrontProvider>
  );
}
