import { lazy, type ComponentType, type ReactNode } from 'react';
import type { PublicStoreData } from '@/api/services/store';
import type { CookieBannerProps } from '@/features/storefront/CookieConsentBanner';

// Maison (theme-03-fashion) is the single base theme. A theme is: a manifest, a layout, one page per StorefrontRouteKey, a gate page and the three preview registrations below.
import { FashionLayout } from './theme-03-fashion/layout/FashionLayout';
import { FashionHomePage } from './theme-03-fashion/pages/FashionHomePage';
import { FashionProductPage } from './theme-03-fashion/pages/FashionProductPage';
import { FashionCartPage } from './theme-03-fashion/pages/FashionCartPage';
import { FashionCollectionPage } from './theme-03-fashion/pages/FashionCollectionPage';
import { FashionCollectionsPage } from './theme-03-fashion/pages/FashionCollectionsPage';
import { FashionCategoryPage } from './theme-03-fashion/pages/FashionCategoryPage';
import { FashionSearchPage } from './theme-03-fashion/pages/FashionSearchPage';
import { FashionNotFoundPage } from './theme-03-fashion/pages/FashionNotFoundPage';
import { FashionStorefrontGate } from './theme-03-fashion/pages/FashionStorefrontGate';
import { FashionCookieBanner } from './theme-03-fashion/components/FashionCookieBanner';
// Pages a visitor rarely opens first (checkout, account, orders, blog, auth...) load on demand so the storefront opens faster.
const FashionCheckoutPage = lazy(() => import('./theme-03-fashion/pages/FashionCheckoutPage').then(m => ({ default: m.FashionCheckoutPage })));
const FashionCheckoutReturnPage = lazy(() => import('./theme-03-fashion/pages/FashionCheckoutReturnPage').then(m => ({ default: m.FashionCheckoutReturnPage })));
const FashionLoginPage = lazy(() => import('./theme-03-fashion/pages/FashionLoginPage').then(m => ({ default: m.FashionLoginPage })));
const FashionRegisterPage = lazy(() => import('./theme-03-fashion/pages/FashionRegisterPage').then(m => ({ default: m.FashionRegisterPage })));
const FashionVerifyOtpPage = lazy(() => import('./theme-03-fashion/pages/FashionVerifyOtpPage').then(m => ({ default: m.FashionVerifyOtpPage })));
const FashionForgotPasswordPage = lazy(() => import('./theme-03-fashion/pages/FashionForgotPasswordPage').then(m => ({ default: m.FashionForgotPasswordPage })));
const FashionNewPasswordPage = lazy(() => import('./theme-03-fashion/pages/FashionNewPasswordPage').then(m => ({ default: m.FashionNewPasswordPage })));
const FashionAccountPage = lazy(() => import('./theme-03-fashion/pages/FashionAccountPage').then(m => ({ default: m.FashionAccountPage })));
const FashionAddressesPage = lazy(() => import('./theme-03-fashion/pages/FashionAddressesPage').then(m => ({ default: m.FashionAddressesPage })));
const FashionMyReviewsPage = lazy(() => import('./theme-03-fashion/pages/FashionMyReviewsPage').then(m => ({ default: m.FashionMyReviewsPage })));
const FashionOrdersPage = lazy(() => import('./theme-03-fashion/pages/FashionOrdersPage').then(m => ({ default: m.FashionOrdersPage })));
const FashionOrderDetailPage = lazy(() => import('./theme-03-fashion/pages/FashionOrderDetailPage').then(m => ({ default: m.FashionOrderDetailPage })));
const FashionOrderStatusPage = lazy(() => import('./theme-03-fashion/pages/FashionOrderStatusPage').then(m => ({ default: m.FashionOrderStatusPage })));
const FashionReturnsPage = lazy(() => import('./theme-03-fashion/pages/FashionReturnsPage').then(m => ({ default: m.FashionReturnsPage })));
const FashionStoreCreditPage = lazy(() => import('./theme-03-fashion/pages/FashionStoreCreditPage').then(m => ({ default: m.FashionStoreCreditPage })));
const FashionGiftCardsPage = lazy(() => import('./theme-03-fashion/pages/FashionGiftCardsPage').then(m => ({ default: m.FashionGiftCardsPage })));
const FashionGiftCardViewPage = lazy(() => import('./theme-03-fashion/pages/FashionGiftCardViewPage').then(m => ({ default: m.FashionGiftCardViewPage })));
const FashionLoyaltyPage = lazy(() => import('./theme-03-fashion/pages/FashionLoyaltyPage').then(m => ({ default: m.FashionLoyaltyPage })));
const FashionWishlistPage = lazy(() => import('./theme-03-fashion/pages/FashionWishlistPage').then(m => ({ default: m.FashionWishlistPage })));
const FashionNotificationsPage = lazy(() => import('./theme-03-fashion/pages/FashionNotificationsPage').then(m => ({ default: m.FashionNotificationsPage })));
const FashionMessagesPage = lazy(() => import('./theme-03-fashion/pages/FashionMessagesPage').then(m => ({ default: m.FashionMessagesPage })));
const FashionFaqsPage = lazy(() => import('./theme-03-fashion/pages/FashionFaqsPage').then(m => ({ default: m.FashionFaqsPage })));
const FashionBlogIndexPage = lazy(() => import('./theme-03-fashion/pages/FashionBlogIndexPage').then(m => ({ default: m.FashionBlogIndexPage })));
const FashionBlogPostPage = lazy(() => import('./theme-03-fashion/pages/FashionBlogPostPage').then(m => ({ default: m.FashionBlogPostPage })));
const FashionCustomPage = lazy(() => import('./theme-03-fashion/pages/FashionCustomPage').then(m => ({ default: m.FashionCustomPage })));
import './theme-03-fashion/theme.manifest';
import './theme-03-fashion/theme.preview';
import './theme-03-fashion/theme.demoPreview';

/** Every storefront route a theme can implement. A route a theme does not cover falls back to the default theme's page, so a theme that is still being built never renders a blank screen. */
export type StorefrontRouteKey =
  | 'home' | 'product' | 'category' | 'collection' | 'collections' | 'faqs' | 'search'
  | 'cart' | 'checkout' | 'checkoutReturn' | 'login' | 'register' | 'verifyOtp' | 'account' | 'wishlist'
  | 'loyalty' | 'messages' | 'notifications' | 'returns' | 'giftCards' | 'giftCardView' | 'storeCredit' | 'orders' | 'orderDetail' | 'orderStatus' | 'addresses' | 'myReviews'
  | 'blogIndex' | 'blogPost' | 'customPage'
  | 'forgotPassword' | 'newPassword' | 'notFound';

/** The theme-specific colour defaults sent at install time; they match what the theme's own `applyMerchantThemeOverrides` reads. */
export interface ThemeInstallColorDefaults {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  font: string;
  buttonStyle: 'solid' | 'outline' | 'soft';
  buttonRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
}

interface NewThemeImpl {
  Layout: ComponentType<{ children: ReactNode }>;
  pages: Partial<Record<StorefrontRouteKey, ComponentType>>;
  /** Rendered instead of `Layout`/`pages` while the store is password/coming-soon gated and this tab has not unlocked it. */
  GatePage: ComponentType<{ store: PublicStoreData; onUnlocked: () => void }>;
  /** The visitor's cookie-consent banner in this theme's own look. A theme without one gets the platform banner. */
  CookieBanner?: ComponentType<CookieBannerProps>;
  /** Theme Library card metadata; `builtRouteCount` is the honest build progress shown on the card. */
  display: { name: string; description: string; builtRouteCount: number; totalRouteCount: number };
  /** Sent as `theme` in `apiInstallTheme(...)` so a fresh install starts with this theme's own look, not the backend schema defaults. */
  installDefaults: ThemeInstallColorDefaults;
}

/** Every store's `themeDefinitionId` is checked against this registry; an unknown id (e.g. a removed theme) renders `DEFAULT_THEME_ID` instead - see `ThemedRoute`. */
export const DEFAULT_THEME_ID = 'theme-03-fashion';

export const NEW_THEME_REGISTRY: Record<string, NewThemeImpl> = {
  'theme-03-fashion': {
    Layout: FashionLayout,
    GatePage: FashionStorefrontGate,
    CookieBanner: FashionCookieBanner,
    pages: {
      home: FashionHomePage,
      product: FashionProductPage,
      cart: FashionCartPage,
      collection: FashionCollectionPage,
      collections: FashionCollectionsPage,
      category: FashionCategoryPage,
      search: FashionSearchPage,
      checkout: FashionCheckoutPage,
      checkoutReturn: FashionCheckoutReturnPage,
      login: FashionLoginPage,
      register: FashionRegisterPage,
      verifyOtp: FashionVerifyOtpPage,
      forgotPassword: FashionForgotPasswordPage,
      newPassword: FashionNewPasswordPage,
      account: FashionAccountPage,
      addresses: FashionAddressesPage,
      myReviews: FashionMyReviewsPage,
      orders: FashionOrdersPage,
      orderDetail: FashionOrderDetailPage,
      orderStatus: FashionOrderStatusPage,
      returns: FashionReturnsPage,
      storeCredit: FashionStoreCreditPage,
      giftCards: FashionGiftCardsPage,
      giftCardView: FashionGiftCardViewPage,
      loyalty: FashionLoyaltyPage,
      wishlist: FashionWishlistPage,
      notifications: FashionNotificationsPage,
      messages: FashionMessagesPage,
      faqs: FashionFaqsPage,
      blogIndex: FashionBlogIndexPage,
      blogPost: FashionBlogPostPage,
      customPage: FashionCustomPage,
      notFound: FashionNotFoundPage,
    },
    display: {
      name: 'Maison',
      description: 'Fashion and apparel - modern, image-led and rounded, with a big headline, pill buttons, clean product cards and a polished buy box.',
      builtRouteCount: 33,
      totalRouteCount: 33,
    },
    installDefaults: {
      primaryColor: '#09090B',
      bgColor: '#FFFFFF',
      textColor: '#09090B',
      font: 'Inter',
      buttonStyle: 'solid',
      buttonRadius: 'full',
    },
  },
};

export function listNewThemeEntries() {
  return Object.entries(NEW_THEME_REGISTRY).map(([id, impl]) => ({ id, ...impl.display, installDefaults: impl.installDefaults }));
}

/** After the first page is on screen, fetch the chunks a shopper opens next (login, checkout, account) while the browser is idle. */
export function prefetchLikelyStorefrontPages(): void {
  const run = () => {
    for (const load of [
      () => import('./theme-03-fashion/pages/FashionCheckoutPage'),
      () => import('./theme-03-fashion/pages/FashionLoginPage'),
      () => import('./theme-03-fashion/pages/FashionAccountPage'),
    ]) void load().catch(() => {});
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 6000 }); else setTimeout(run, 3000);
}
