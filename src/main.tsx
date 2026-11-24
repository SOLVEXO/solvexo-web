import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CurrencyPreferenceProvider } from '@/contexts/CurrencyPreferenceContext';
import { AuthGateProvider } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { captureSellerAcquisitionAttribution } from '@/utils/sellerAcquisitionAttribution';
import { reloadOnceForChunkError } from '@/components/comman/ErrorBoundary';
import { i18nReady } from './i18n';
import { HOME_HERO_SHELL_ID } from '@/seo/homeHeroShell';
import { captureSsrSnapshot } from '@/utils/ssrSnapshot';
import './index.css';

// Phase 9 — Merchant Acquisition Tracking. Must run here, once, on the
// very first page load of a fresh visit (before the router mounts) so a
// visitor arriving straight from an ad/campaign link with ?utm_* params —
// on ANY page, not only /register — has that touch captured immediately.
// Read back later, at seller-registration submit time, by RegisterPage.tsx.
captureSellerAcquisitionAttribution();

// Vite fires this when a lazy chunk/CSS fails to load (typically right after a deploy replaced the old files).
window.addEventListener('vite:preloadError', (e) => {
  if (reloadOnceForChunkError()) e.preventDefault();
});

// The home page's pre-built hero (homeHeroShell.ts) normally gives way when the real hero mounts. If this visit ends up
// on another page instead (a signed-in redirect, a link clicked early), take it away at once.
const dropHomeShell = (path: string) => { if ((path.replace(/\/+$/, '') || '/') !== '/') document.getElementById(HOME_HERO_SHELL_ID)?.remove(); };
dropHomeShell(router.state.location.pathname);
router.subscribe(state => dropHomeShell(state.location.pathname));

/**
 * A server-rendered store page is already on screen. React replaces it when it mounts, so first load what the first render needs
 * (the storefront shell, the theme's layout and the chunk of this page): then nothing has to be waited for after the swap.
 * Capped, so a slow connection never delays the app for long; the snapshot fallbacks cover whatever is still loading.
 */
function serverRenderedPageReady(): Promise<unknown> {
  if (window.__SX_DATA__ === undefined) return Promise.resolve();
  captureSsrSnapshot();
  const themeId = window.__SX_BOOT__?.theme?.themeDefinitionId;
  const loaded = Promise.all([
    import('@/features/storefront/StorefrontLayout'),
    import('@/features/storefront-themes/ThemedRoute'),
    import('@/features/storefront-themes/preloadThemeShell').then(m => m.preloadThemeShell(themeId, window.location.pathname)),
  ]).catch(() => undefined);
  return Promise.race([loaded, new Promise(resolve => setTimeout(resolve, 3000))]);
}

void Promise.all([i18nReady, serverRenderedPageReady()]).then(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthGateProvider>
        <CurrencyPreferenceProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <RouterProvider router={router} />
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyPreferenceProvider>
      </AuthGateProvider>
    </ToastProvider>
  </StrictMode>,
));
