import { useEffect, useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { SkeletonBox } from '@/components/comman/ui';
import { Store } from 'lucide-react';
import { apiGetPublicStore, apiResolveStoreByDomain, apiSuggestLocationForStore, type PublicStoreData } from '@/api/services/store';
import { apiGetPublicStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { getStoreSlugFromHost } from '@/utils/storefrontUrl';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { useCurrencyPreference, CURRENCY_STORAGE_KEY } from '@/contexts/CurrencyPreferenceContext';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from './StorefrontContext';
import { NEW_THEME_REGISTRY, DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

const DEFAULT_FAVICON = '/favicon.png';

/** Swaps the browser tab icon while on any `/:slug*` route, restoring Solvexo's default on unmount — same "zero Solvexo branding on the storefront" principle as the navbar/footer, just for the one piece of chrome that lives outside React's render tree. Prefers the store's dedicated `faviconUrl` (a real tab-icon-shaped asset) over its `logo` (often a wide wordmark that renders poorly shrunk to 16-32px) — falls back to `logo` for a store that never set one, unchanged from before this field existed. */
function useStorefrontFavicon(faviconUrl: string | null | undefined, logo: string | null | undefined) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const previousHref = link.href;
    link.href = faviconUrl || logo || DEFAULT_FAVICON;
    return () => { link.href = previousHref; };
  }, [faviconUrl, logo]);
}

// Root layout for a store's own subdomain (`hello.solvexo.store`) OR a
// seller-connected Custom Domain — the router mounts this tree whenever
// EITHER `getStoreSlugFromHost()` resolved a slug at boot, OR the hostname
// is a non-platform domain (`isCustomDomainCandidate()`, see
// `router/index.tsx`). A subdomain's slug comes straight from the hostname
// (synchronous, no network call); a custom domain has no slug to parse, so
// it's resolved here via `apiResolveStoreByDomain` against the store whose
// domain has actually been DNS-verified (`DomainWhiteLabelCard`) — an
// unverified/unconnected domain lands on the "Store not found" state below,
// never a random store.
// Fetches the store + its StoreTheme ONCE, provides both via context to
// every child route (home, custom pages, blog), and renders the seller's
// own zero-Solvexo-branding navbar/footer around them.
export function StorefrontLayout() {
  const slug = getStoreSlugFromHost();
  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [theme, setTheme] = useState<StoreThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Real Shopify-style storefront gate (`Store.privacyMode`) — a per-tab
  // unlock, checked the instant the store loads so a password-protected
  // store never flashes its real content first. See `AtelierStorefrontGate`/
  // `NovaStorefrontGate`'s own doc comments for the full rationale.
  const [unlocked, setUnlocked] = useState(false);
  const { setCurrency } = useCurrencyPreference();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const load = slug ? apiGetPublicStore(slug) : apiResolveStoreByDomain(window.location.hostname);
    load
      .then(res => {
        if (cancelled) return;
        setStore(res.data);
        setUnlocked(sessionStorage.getItem(`storefront_unlock_${res.data.storeId}`) === '1');
        return apiGetPublicStoreTheme(res.data.storeId).then(r => { if (!cancelled) setTheme(r.data); });
      })
      .catch(() => { if (!cancelled) setError('Store not found'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  // Real IP-based currency default — Shopify-style: a first-time visitor to
  // this store sees prices in their own local currency automatically, no
  // click needed. Only ever fires when there's genuinely no existing
  // preference yet (a fresh browser/tab, guest or not-yet-logged-in) — an
  // explicit choice (this tab) or a logged-in account's own saved preference
  // (handled inside CurrencyPreferenceContext itself) always wins and this
  // never overrides either. Best-effort only: any failure (geolocation
  // unavailable, offline, etc.) silently leaves the existing default in
  // place, same fail-open convention as every other currency-suggestion call
  // in this app.
  useEffect(() => {
    if (!store?.storeId) return;
    if (localStorage.getItem(CURRENCY_STORAGE_KEY)) return;
    let cancelled = false;
    apiSuggestLocationForStore(store.storeId)
      .then(res => {
        if (cancelled) return;
        const suggested = res.data.suggestedCurrency;
        if (suggested && !localStorage.getItem(CURRENCY_STORAGE_KEY)) {
          setCurrency(suggested);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [store?.storeId, setCurrency]);

  useStorefrontFavicon(store?.faviconUrl, store?.logo);

  const cfg = useMemo(() => resolveStorefrontCfg(theme), [theme]);

  const contextValue: StorefrontContextValue | null = useMemo(() => {
    if (!store) return null;
    return {
      store,
      theme,
      cfg,
      resolveLink: resolveStorefrontLink,
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
    // No "Back to Marketplace" link — the marketplace is being retired as a
    // buyer-facing surface entirely (standalone stores only), so a broken
    // storefront domain has nowhere marketplace-shaped to send anyone back to.
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <Store size={48} className="text-bone" />
        <p className="text-[15px] text-slate">{slug ? 'Store not found' : "This domain isn't connected to a store yet"}</p>
      </div>
    );
  }

  // Every store now renders through a genuinely independent theme (see
  // `storefront-themes/registry.ts`) — the legacy 12-theme shared engine
  // has been removed. A store whose `themeDefinitionId` doesn't match a
  // registered theme (e.g. a pre-migration row still pointing at a deleted
  // legacy theme id) falls back to `DEFAULT_THEME_ID` rather than crashing.
  // Each theme owns its own chrome entirely — no shared navbar/footer, no
  // `cfg`-driven inline styles. `store`/`theme`/`cfg` are still provided via
  // context (real store data + cart are legitimate shared infra) for any
  // theme that wants them, but nothing about this component's own rendering
  // reaches the page any more.
  const themeId = theme?.themeDefinitionId;
  const impl = (themeId && NEW_THEME_REGISTRY[themeId]) || NEW_THEME_REGISTRY[DEFAULT_THEME_ID];
  const Layout = impl.Layout;

  // The gate replaces the ENTIRE tree (no navbar/cart/footer/Outlet) — every
  // real route, including `notFound`, is meaningless on a store nobody but
  // the seller should be browsing yet.
  if (store.privacyMode !== 'public' && !unlocked) {
    const Gate = impl.GatePage;
    return (
      <StorefrontProvider value={contextValue}>
        <Gate store={store} onUnlocked={() => setUnlocked(true)} />
      </StorefrontProvider>
    );
  }
  return (
    <StorefrontProvider value={contextValue}>
      <CartProvider storeId={store.storeId}>
        <WishlistProvider storeId={store.storeId}>
          <Layout>
            <Outlet />
          </Layout>
        </WishlistProvider>
      </CartProvider>
    </StorefrontProvider>
  );
}
