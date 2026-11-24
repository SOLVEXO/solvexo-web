/**
 * Server-side rendering of a storefront page (used by `api/storefront-document.js`, never by the browser).
 *
 * Given a store, its live theme and a path, it renders the SAME React theme the browser would, with the page's data already
 * in hand, and returns the HTML plus the data it used (the browser starts from that data, so it shows no skeleton and makes
 * no request for it). Public, anonymous output only: it is cached for everyone, so nothing here may depend on who the visitor is.
 *
 * Anything it is not sure about returns `null` and the caller serves the normal app shell instead - SSR is an enhancement,
 * never a requirement for a page to load.
 */
import { Suspense, type ReactNode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { Route, Routes } from 'react-router-dom';
import { ssrRouteFor as routeFor, type SsrRoute } from '@/features/storefront-themes/ssrRoutes';
import i18n, { registerThemeTranslations, localeFromPathname } from '@/i18n';
import { NEW_THEME_REGISTRY, type StorefrontRouteKey } from '@/features/storefront-themes/registry';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import { StorefrontMarketProvider } from '@/features/storefront/StorefrontMarketContext';
import { StoreTextCtx } from '@/features/storefront/storeTextContext';
import { indexTextStrings } from '@/utils/storeText';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CurrencyPreferenceProvider } from '@/contexts/CurrencyPreferenceContext';
import { AuthGateProvider } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { beginCollect, endCollect, dropSsr, dumpSsr, failSsr, putSsr } from '@/utils/ssrData';
import { setServerOrigin, setServerPath } from '@/utils/siteOrigin';
import { resetSavedSectionsCache } from '@/features/storefront-themes/useSavedSections';
import { resetStoreSectionDefsCache } from '@/features/storefront-themes/storeSections/useStoreSectionDefs';
import { resetBrowseConfigCache } from '@/features/storefront/browse/useBrowseConfig';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';

/**
 * The server has no browser storage. Some providers read it while rendering (the saved currency, the cookie choice), so an
 * always-empty, read-only stand-in keeps them on their defaults. Writes are ignored on purpose: one visitor's value must
 * never reach another visitor's page.
 */
const emptyStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined, clear: () => undefined, key: () => null, length: 0 };
for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof (globalThis as Record<string, unknown>)[name] === 'undefined') {
    Object.defineProperty(globalThis, name, { value: emptyStorage, configurable: true });
  }
}

export interface RenderInput {
  /** The page's own host (`shop.example.com`). */
  host: string;
  /** Path only, no query (`/`, `/product/blue-shirt`). */
  path: string;
  store: PublicStoreData;
  theme: StoreThemeData;
  /** The home page data the bootstrap already fetched. */
  home?: unknown;
}

export interface RenderOutput {
  html: string;
  /** Everything the page used, to be inlined as `window.__SX_DATA__`. */
  data: Record<string, unknown>;
  /** Which theme layout + page chunks this page needs (for the stylesheet / modulepreload links). */
  themeId: string;
  routeKey: StorefrontRouteKey;
}

/**
 * How long a visitor may wait for the server to gather the page's data. Short on purpose: whatever is not ready in time stays
 * a skeleton in the HTML and the browser loads it itself, so a slow API can never make the first byte slow for long.
 */
const TOTAL_BUDGET_MS = 1800;
const MAX_PASSES = 4;
const MAX_HTML_BYTES = 1_500_000;
const MAX_DATA_BYTES = 600_000;

/** Why a page is NOT rendered on the server (null = it can be). Conservative on purpose. */
export function ssrSkipReason(input: Pick<RenderInput, 'path' | 'store' | 'theme'>): string | null {
  const { store, theme, path } = input;
  if (!store?.storeId || !theme) return 'no store or theme';
  if (store.privacyMode && store.privacyMode !== 'public') return 'store is not public';
  if (theme.sourcePackageVersion != null) return 'imported (Liquid) theme';
  if (!theme.themeDefinitionId || !NEW_THEME_REGISTRY[theme.themeDefinitionId]) return 'unknown theme';
  if (localeFromPathname(path)) return 'language folder in the address';
  if ((store.defaultLanguage ?? 'en') !== 'en') return 'store language is not English';
  if (Array.isArray(store.enabledCurrencies) && store.enabledCurrencies.length > 1) return 'store sells in several currencies';
  if (!routeFor(path)) return 'page is not server-rendered yet';
  return null;
}

/**
 * One complete render pass. `prerender` waits for every lazy part (a theme's layout chunk, a lazy page) and returns finished
 * HTML with no streaming scripts in it. If the deadline passes first, what is not ready yet stays as its Suspense fallback.
 */
async function renderOnce(tree: ReactNode, deadline: number): Promise<string> {
  const controller = new AbortController();
  after(Math.max(50, deadline - Date.now()), () => controller.abort());
  const { prelude } = await prerender(tree, {
    signal: controller.signal,
    onError() { /* a failing part shows its own fallback; the page as a whole still renders */ },
  });
  const html = await new Response(prelude).text();
  if (html.length > MAX_HTML_BYTES) throw new Error('page too large');
  // React adds a tiny timing script to every document it starts; the page does not need it.
  return html.replace(/<script>requestAnimationFrame\(function\(\)\{\$RT=performance\.now\(\)\}\);<\/script>/g, '');
}

/** setTimeout that never keeps a server process alive (works with both the DOM and the Node typings). */
function after(ms: number, fn: () => void): void {
  const timer = setTimeout(fn, ms) as unknown as { unref?: () => void };
  timer.unref?.();
}

function buildTree(input: RenderInput, route: SsrRoute): ReactNode {
  const { store, theme } = input;
  const impl = NEW_THEME_REGISTRY[theme.themeDefinitionId as string];
  const Layout = impl.Layout;
  const Page = impl.pages[route.key]!;
  const value: StorefrontContextValue = { store, theme, cfg: resolveStorefrontCfg(theme), resolveLink: resolveStorefrontLink };
  return (
    <ToastProvider><AuthGateProvider><CurrencyPreferenceProvider><NotificationProvider>
      <StaticRouter location={input.path}>
        <div className="fixed inset-x-0 top-0 bottom-0 overflow-y-auto" data-sx-ssr="">
          <StoreTextCtx.Provider value={indexTextStrings(null)}>
            <StorefrontProvider value={value}>
              <StorefrontMarketProvider storeId={store.storeId} allowedCurrencies={store.enabledCurrencies} baseCurrency={store.baseCurrency} sourceLanguage="en">
                <CartProvider storeId={store.storeId}>
                  <WishlistProvider storeId={store.storeId}>
                    <Suspense fallback={null}>
                      <Layout>
                        <Suspense fallback={null}>
                          <Routes><Route path={route.path} element={<Page />} /></Routes>
                        </Suspense>
                      </Layout>
                    </Suspense>
                  </WishlistProvider>
                </CartProvider>
              </StorefrontMarketProvider>
            </StorefrontProvider>
          </StoreTextCtx.Provider>
        </div>
      </StaticRouter>
    </NotificationProvider></CurrencyPreferenceProvider></AuthGateProvider></ToastProvider>
  );
}

/** Module-level caches that the browser fills over time must start EMPTY for every page on the server (one store's data never reaches another page). */
function resetServerState(): void {
  dropSsr();
  resetSavedSectionsCache();
  resetStoreSectionDefsCache();
  resetBrowseConfigCache();
}

// Rendering shares module-level state (the data store, the origin): one page at a time per process.
let queue: Promise<unknown> = Promise.resolve();

/** Renders one storefront page. Resolves `null` when the page should be served by the normal app instead. */
export function renderStorefront(input: RenderInput): Promise<RenderOutput | null> {
  const run = queue.then(() => renderLocked(input), () => renderLocked(input));
  queue = run.catch(() => undefined);
  return run;
}

async function renderLocked(input: RenderInput): Promise<RenderOutput | null> {
  if (ssrSkipReason(input)) return null;
  const route = routeFor(input.path)!;
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const themeId = input.theme.themeDefinitionId as string;
  resetServerState();
  try {
    setServerOrigin(`https://${input.host}`);
    setServerPath(input.path);
    registerThemeTranslations(themeId);
    if (i18n.language !== 'en') await i18n.changeLanguage('en');
    if (input.home) putSsr(`home:${input.store.storeId}`, input.home);
    const tree = buildTree(input, route);
    let html = '';
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const wanted = beginCollect();
      try { html = await renderOnce(tree, deadline); } finally { endCollect(); }
      if (wanted.size === 0) break;
      await Promise.all([...wanted].map(async ([key, load]) => {
        try {
          const timeout = new Promise<never>((_, rej) => after(Math.max(50, deadline - Date.now()), () => rej(new Error('data timed out'))));
          putSsr(key, await Promise.race([load(), timeout]));
        } catch (error) {
          // This part stays a skeleton on the server; the browser loads it itself.
          failSsr(key);
          console.warn(`[ssr] data for "${key.slice(0, 80)}" not loaded:`, (error as Error)?.message);
        }
      }));
      if (Date.now() >= deadline) break;
    }
    const data = dumpSsr();
    if (JSON.stringify(data).length > MAX_DATA_BYTES) return { html, data: {}, themeId, routeKey: route.key };
    return { html, data, themeId, routeKey: route.key };
  } catch (error) {
    console.error('[ssr] render failed:', (error as Error)?.message);
    return null;
  } finally {
    resetServerState();
  }
}
