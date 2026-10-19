import type { ComponentType, ReactNode } from 'react';
import type { PublicStoreData } from '@/api/services/store';

// Maison (theme-03-fashion) is the single base theme. A theme is: a manifest, a layout, one page per StorefrontRouteKey, a gate page and the three preview registrations below.
import { FashionLayout } from './theme-03-fashion/layout/FashionLayout';
import { FashionHomePage } from './theme-03-fashion/pages/FashionHomePage';
import { FashionProductPage } from './theme-03-fashion/pages/FashionProductPage';
import { FashionCartPage } from './theme-03-fashion/pages/FashionCartPage';
import { FashionCollectionPage } from './theme-03-fashion/pages/FashionCollectionPage';
import { FashionCollectionsPage } from './theme-03-fashion/pages/FashionCollectionsPage';
import { FashionCategoryPage } from './theme-03-fashion/pages/FashionCategoryPage';
import { FashionSearchPage } from './theme-03-fashion/pages/FashionSearchPage';
import { FashionCustomPage } from './theme-03-fashion/pages/FashionCustomPage';
import { FashionNotFoundPage } from './theme-03-fashion/pages/FashionNotFoundPage';
import { FashionCheckoutPage } from './theme-03-fashion/pages/FashionCheckoutPage';
import { FashionCheckoutReturnPage } from './theme-03-fashion/pages/FashionCheckoutReturnPage';
import { FashionLoginPage } from './theme-03-fashion/pages/FashionLoginPage';
import { FashionRegisterPage } from './theme-03-fashion/pages/FashionRegisterPage';
import { FashionVerifyOtpPage } from './theme-03-fashion/pages/FashionVerifyOtpPage';
import { FashionForgotPasswordPage } from './theme-03-fashion/pages/FashionForgotPasswordPage';
import { FashionNewPasswordPage } from './theme-03-fashion/pages/FashionNewPasswordPage';
import { FashionAccountPage } from './theme-03-fashion/pages/FashionAccountPage';
import { FashionAddressesPage } from './theme-03-fashion/pages/FashionAddressesPage';
import { FashionMyReviewsPage } from './theme-03-fashion/pages/FashionMyReviewsPage';
import { FashionOrdersPage } from './theme-03-fashion/pages/FashionOrdersPage';
import { FashionOrderDetailPage } from './theme-03-fashion/pages/FashionOrderDetailPage';
import { FashionOrderStatusPage } from './theme-03-fashion/pages/FashionOrderStatusPage';
import { FashionReturnsPage } from './theme-03-fashion/pages/FashionReturnsPage';
import { FashionStoreCreditPage } from './theme-03-fashion/pages/FashionStoreCreditPage';
import { FashionGiftCardsPage } from './theme-03-fashion/pages/FashionGiftCardsPage';
import { FashionLoyaltyPage } from './theme-03-fashion/pages/FashionLoyaltyPage';
import { FashionWishlistPage } from './theme-03-fashion/pages/FashionWishlistPage';
import { FashionNotificationsPage } from './theme-03-fashion/pages/FashionNotificationsPage';
import { FashionMessagesPage } from './theme-03-fashion/pages/FashionMessagesPage';
import { FashionFaqsPage } from './theme-03-fashion/pages/FashionFaqsPage';
import { FashionBlogIndexPage } from './theme-03-fashion/pages/FashionBlogIndexPage';
import { FashionBlogPostPage } from './theme-03-fashion/pages/FashionBlogPostPage';
import { FashionStorefrontGate } from './theme-03-fashion/pages/FashionStorefrontGate';
import './theme-03-fashion/theme.manifest';
import './theme-03-fashion/theme.preview';
import './theme-03-fashion/theme.demoPreview';

/** Every storefront route a theme can implement. A route a theme does not cover falls back to the default theme's page, so a theme that is still being built never renders a blank screen. */
export type StorefrontRouteKey =
  | 'home' | 'product' | 'category' | 'collection' | 'collections' | 'faqs' | 'search'
  | 'cart' | 'checkout' | 'checkoutReturn' | 'login' | 'register' | 'verifyOtp' | 'account' | 'wishlist'
  | 'loyalty' | 'messages' | 'notifications' | 'returns' | 'giftCards' | 'storeCredit' | 'orders' | 'orderDetail' | 'orderStatus' | 'addresses' | 'myReviews'
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
      builtRouteCount: 32,
      totalRouteCount: 32,
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
