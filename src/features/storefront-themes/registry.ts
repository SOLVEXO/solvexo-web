import { Suspense, createElement, lazy, type ComponentType, type ReactNode } from 'react';
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
import { FashionAuthGateModal } from './theme-03-fashion/components/FashionAuthGateModal';
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
const FashionLibraryPage = lazy(() => import('./theme-03-fashion/pages/FashionDigitalPages').then(m => ({ default: m.FashionLibraryPage })));
const FashionMembershipsPage = lazy(() => import('./theme-03-fashion/pages/FashionDigitalPages').then(m => ({ default: m.FashionMembershipsPage })));
const FashionLicensesPage = lazy(() => import('./theme-03-fashion/pages/FashionDigitalPages').then(m => ({ default: m.FashionLicensesPage })));
const FashionLearnPage = lazy(() => import('./theme-03-fashion/pages/FashionDigitalPages').then(m => ({ default: m.FashionLearnPage })));
const FashionBlogIndexPage = lazy(() => import('./theme-03-fashion/pages/FashionBlogIndexPage').then(m => ({ default: m.FashionBlogIndexPage })));
const FashionBlogPostPage = lazy(() => import('./theme-03-fashion/pages/FashionBlogPostPage').then(m => ({ default: m.FashionBlogPostPage })));
const FashionCustomPage = lazy(() => import('./theme-03-fashion/pages/FashionCustomPage').then(m => ({ default: m.FashionCustomPage })));
import './theme-03-fashion/theme.manifest';
import './theme-03-fashion/theme.preview';
import './theme-03-fashion/theme.demoPreview';

// Tech Store (theme-04-tech) is loaded on demand: a Maison store never downloads its code. Its Layout and every page are lazy chunks; its editor registrations (manifest, preview, demo) live in `editorThemes.ts`, imported only by seller pages.
// Native routes: home, product, cart, collection, category, search, customPage, checkout, checkoutReturn, login, register, verifyOtp, forgotPassword, newPassword, account, orders, addresses. Every route has a native Tech page.
const TechLayout = lazy(() => import('./theme-04-tech/layout/TechLayout').then(m => ({ default: m.TechLayout })));
const TechHomePage = lazy(() => import('./theme-04-tech/pages/TechContentPages').then(m => ({ default: m.TechHomePage })));
const TechCustomPage = lazy(() => import('./theme-04-tech/pages/TechContentPages').then(m => ({ default: m.TechCustomPage })));
const TechCollectionPage = lazy(() => import('./theme-04-tech/pages/TechListingPages').then(m => ({ default: m.TechCollectionPage })));
const TechCategoryPage = lazy(() => import('./theme-04-tech/pages/TechListingPages').then(m => ({ default: m.TechCategoryPage })));
const TechSearchPage = lazy(() => import('./theme-04-tech/pages/TechListingPages').then(m => ({ default: m.TechSearchPage })));
const TechProductPage = lazy(() => import('./theme-04-tech/pages/TechProductPage').then(m => ({ default: m.TechProductPage })));
const TechCartPage = lazy(() => import('./theme-04-tech/pages/TechCartPage').then(m => ({ default: m.TechCartPage })));
const TechCheckoutPage = lazy(() => import('./theme-04-tech/pages/TechCheckoutPage').then(m => ({ default: m.TechCheckoutPage })));
const TechCheckoutReturnPage = lazy(() => import('./theme-04-tech/pages/TechCheckoutReturnPage').then(m => ({ default: m.TechCheckoutReturnPage })));
const TechLoginPage = lazy(() => import('./theme-04-tech/pages/TechAuthPages').then(m => ({ default: m.TechLoginPage })));
const TechRegisterPage = lazy(() => import('./theme-04-tech/pages/TechAuthPages').then(m => ({ default: m.TechRegisterPage })));
const TechVerifyOtpPage = lazy(() => import('./theme-04-tech/pages/TechAuthPages').then(m => ({ default: m.TechVerifyOtpPage })));
const TechForgotPasswordPage = lazy(() => import('./theme-04-tech/pages/TechAuthPages').then(m => ({ default: m.TechForgotPasswordPage })));
const TechNewPasswordPage = lazy(() => import('./theme-04-tech/pages/TechAuthPages').then(m => ({ default: m.TechNewPasswordPage })));
const TechAccountPage = lazy(() => import('./theme-04-tech/pages/TechAccountPages').then(m => ({ default: m.TechAccountPage })));
const TechOrdersPage = lazy(() => import('./theme-04-tech/pages/TechAccountPages').then(m => ({ default: m.TechOrdersPage })));
const TechAddressesPage = lazy(() => import('./theme-04-tech/pages/TechAccountPages').then(m => ({ default: m.TechAddressesPage })));
const TechOrderDetailPage = lazy(() => import('./theme-04-tech/pages/TechOrderDetailPage').then(m => ({ default: m.TechOrderDetailPage })));
const TechOrderStatusPage = lazy(() => import('./theme-04-tech/pages/TechOrderStatusPage').then(m => ({ default: m.TechOrderStatusPage })));
const TechReturnsPage = lazy(() => import('./theme-04-tech/pages/TechReturnsPage').then(m => ({ default: m.TechReturnsPage })));
const TechWishlistPage = lazy(() => import('./theme-04-tech/pages/TechWishlistPage').then(m => ({ default: m.TechWishlistPage })));
const TechMyReviewsPage = lazy(() => import('./theme-04-tech/pages/TechMyReviewsPage').then(m => ({ default: m.TechMyReviewsPage })));
const TechGiftCardsPage = lazy(() => import('./theme-04-tech/pages/TechGiftCardsPage').then(m => ({ default: m.TechGiftCardsPage })));
const TechGiftCardViewPage = lazy(() => import('./theme-04-tech/pages/TechGiftCardViewPage').then(m => ({ default: m.TechGiftCardViewPage })));
const TechStoreCreditPage = lazy(() => import('./theme-04-tech/pages/TechStoreCreditPage').then(m => ({ default: m.TechStoreCreditPage })));
const TechLoyaltyPage = lazy(() => import('./theme-04-tech/pages/TechLoyaltyPage').then(m => ({ default: m.TechLoyaltyPage })));
const TechMessagesPage = lazy(() => import('./theme-04-tech/pages/TechMessagesPage').then(m => ({ default: m.TechMessagesPage })));
const TechNotificationsPage = lazy(() => import('./theme-04-tech/pages/TechNotificationsPage').then(m => ({ default: m.TechNotificationsPage })));
const TechBlogIndexPage = lazy(() => import('./theme-04-tech/pages/TechBlogIndexPage').then(m => ({ default: m.TechBlogIndexPage })));
const TechBlogPostPage = lazy(() => import('./theme-04-tech/pages/TechBlogPostPage').then(m => ({ default: m.TechBlogPostPage })));
const TechFaqsPage = lazy(() => import('./theme-04-tech/pages/TechFaqsPage').then(m => ({ default: m.TechFaqsPage })));
const TechCollectionsPage = lazy(() => import('./theme-04-tech/pages/TechCollectionsPage').then(m => ({ default: m.TechCollectionsPage })));
const TechNotFoundPage = lazy(() => import('./theme-04-tech/pages/TechNotFoundPage').then(m => ({ default: m.TechNotFoundPage })));
const TechLibraryPage = lazy(() => import('./theme-04-tech/pages/TechDigitalPages').then(m => ({ default: m.TechLibraryPage })));
const TechMembershipsPage = lazy(() => import('./theme-04-tech/pages/TechDigitalPages').then(m => ({ default: m.TechMembershipsPage })));
const TechLicensesPage = lazy(() => import('./theme-04-tech/pages/TechDigitalPages').then(m => ({ default: m.TechLicensesPage })));
const TechLearnPage = lazy(() => import('./theme-04-tech/pages/TechDigitalPages').then(m => ({ default: m.TechLearnPage })));
const LazyTechGate = lazy(() => import('./theme-04-tech/pages/TechStorefrontGate').then(m => ({ default: m.TechStorefrontGate })));
const LazyTechCookie = lazy(() => import('./theme-04-tech/components/TechCookieBanner').then(m => ({ default: m.TechCookieBanner })));
const LazyTechAuthGate = lazy(() => import('./theme-04-tech/components/TechAuthGateModal').then(m => ({ default: m.TechAuthGateModal })));
const TechCookie: ComponentType<CookieBannerProps> = props => createElement(Suspense, { fallback: null }, createElement(LazyTechCookie, props));
const TechAuthGate: ComponentType = () => createElement(Suspense, { fallback: null }, createElement(LazyTechAuthGate));
/** The password / coming-soon page is outside the pages' Suspense boundary, so it brings its own. */
const TechGate: NewThemeImpl['GatePage'] = props => createElement(Suspense, { fallback: null }, createElement(LazyTechGate, props));

// Ledup (theme-05-ledup) - Architectural & Commercial LED Lighting
const LedupLayout = lazy(() => import('./theme-05-ledup/layout/LedupLayout').then(m => ({ default: m.LedupLayout })));
const LedupHomePage = lazy(() => import('./theme-05-ledup/pages/LedupContentPages').then(m => ({ default: m.LedupHomePage })));
const LedupCustomPage = lazy(() => import('./theme-05-ledup/pages/LedupContentPages').then(m => ({ default: m.LedupCustomPage })));
const LedupCollectionPage = lazy(() => import('./theme-05-ledup/pages/LedupListingPages').then(m => ({ default: m.LedupCollectionPage })));
const LedupCategoryPage = lazy(() => import('./theme-05-ledup/pages/LedupListingPages').then(m => ({ default: m.LedupCategoryPage })));
const LedupSearchPage = lazy(() => import('./theme-05-ledup/pages/LedupListingPages').then(m => ({ default: m.LedupSearchPage })));
const LedupProductPage = lazy(() => import('./theme-05-ledup/pages/LedupProductPage').then(m => ({ default: m.LedupProductPage })));
const LedupCartPage = lazy(() => import('./theme-05-ledup/pages/LedupCartPage').then(m => ({ default: m.LedupCartPage })));
const LedupCheckoutPage = lazy(() => import('./theme-05-ledup/pages/LedupCheckoutPage').then(m => ({ default: m.LedupCheckoutPage })));
const LedupCheckoutReturnPage = lazy(() => import('./theme-05-ledup/pages/LedupCheckoutReturnPage').then(m => ({ default: m.LedupCheckoutReturnPage })));
const LedupLoginPage = lazy(() => import('./theme-05-ledup/pages/LedupAuthPages').then(m => ({ default: m.LedupLoginPage })));
const LedupRegisterPage = lazy(() => import('./theme-05-ledup/pages/LedupAuthPages').then(m => ({ default: m.LedupRegisterPage })));
const LedupVerifyOtpPage = lazy(() => import('./theme-05-ledup/pages/LedupAuthPages').then(m => ({ default: m.LedupVerifyOtpPage })));
const LedupForgotPasswordPage = lazy(() => import('./theme-05-ledup/pages/LedupAuthPages').then(m => ({ default: m.LedupForgotPasswordPage })));
const LedupNewPasswordPage = lazy(() => import('./theme-05-ledup/pages/LedupAuthPages').then(m => ({ default: m.LedupNewPasswordPage })));
const LedupAccountPage = lazy(() => import('./theme-05-ledup/pages/LedupAccountPages').then(m => ({ default: m.LedupAccountPage })));
const LedupOrdersPage = lazy(() => import('./theme-05-ledup/pages/LedupAccountPages').then(m => ({ default: m.LedupOrdersPage })));
const LedupAddressesPage = lazy(() => import('./theme-05-ledup/pages/LedupAccountPages').then(m => ({ default: m.LedupAddressesPage })));
const LedupOrderDetailPage = lazy(() => import('./theme-05-ledup/pages/LedupOrderDetailPage').then(m => ({ default: m.LedupOrderDetailPage })));
const LedupOrderStatusPage = lazy(() => import('./theme-05-ledup/pages/LedupOrderStatusPage').then(m => ({ default: m.LedupOrderStatusPage })));
const LedupReturnsPage = lazy(() => import('./theme-05-ledup/pages/LedupReturnsPage').then(m => ({ default: m.LedupReturnsPage })));
const LedupWishlistPage = lazy(() => import('./theme-05-ledup/pages/LedupWishlistPage').then(m => ({ default: m.LedupWishlistPage })));
const LedupMyReviewsPage = lazy(() => import('./theme-05-ledup/pages/LedupMyReviewsPage').then(m => ({ default: m.LedupMyReviewsPage })));
const LedupGiftCardsPage = lazy(() => import('./theme-05-ledup/pages/LedupGiftCardsPage').then(m => ({ default: m.LedupGiftCardsPage })));
const LedupGiftCardViewPage = lazy(() => import('./theme-05-ledup/pages/LedupGiftCardViewPage').then(m => ({ default: m.LedupGiftCardViewPage })));
const LedupStoreCreditPage = lazy(() => import('./theme-05-ledup/pages/LedupStoreCreditPage').then(m => ({ default: m.LedupStoreCreditPage })));
const LedupLoyaltyPage = lazy(() => import('./theme-05-ledup/pages/LedupLoyaltyPage').then(m => ({ default: m.LedupLoyaltyPage })));
const LedupMessagesPage = lazy(() => import('./theme-05-ledup/pages/LedupMessagesPage').then(m => ({ default: m.LedupMessagesPage })));
const LedupNotificationsPage = lazy(() => import('./theme-05-ledup/pages/LedupNotificationsPage').then(m => ({ default: m.LedupNotificationsPage })));
const LedupBlogIndexPage = lazy(() => import('./theme-05-ledup/pages/LedupBlogFaqPages').then(m => ({ default: m.LedupBlogIndexPage })));
const LedupBlogPostPage = lazy(() => import('./theme-05-ledup/pages/LedupBlogFaqPages').then(m => ({ default: m.LedupBlogPostPage })));
const LedupFaqsPage = lazy(() => import('./theme-05-ledup/pages/LedupBlogFaqPages').then(m => ({ default: m.LedupFaqsPage })));
const LedupCollectionsPage = lazy(() => import('./theme-05-ledup/pages/LedupCollectionsPage').then(m => ({ default: m.LedupCollectionsPage })));
const LedupNotFoundPage = lazy(() => import('./theme-05-ledup/pages/LedupContentPages').then(m => ({ default: m.LedupNotFoundPage })));
const LedupLibraryPage = lazy(() => import('./theme-05-ledup/pages/LedupDigitalPages').then(m => ({ default: m.LedupLibraryPage })));
const LedupMembershipsPage = lazy(() => import('./theme-05-ledup/pages/LedupDigitalPages').then(m => ({ default: m.LedupMembershipsPage })));
const LedupLicensesPage = lazy(() => import('./theme-05-ledup/pages/LedupDigitalPages').then(m => ({ default: m.LedupLicensesPage })));
const LedupLearnPage = lazy(() => import('./theme-05-ledup/pages/LedupDigitalPages').then(m => ({ default: m.LedupLearnPage })));
const LazyLedupGate = lazy(() => import('./theme-05-ledup/pages/LedupStorefrontGate').then(m => ({ default: m.LedupStorefrontGate })));
const LazyLedupCookie = lazy(() => import('./theme-05-ledup/components/LedupCookieBanner').then(m => ({ default: m.LedupCookieBanner })));
const LazyLedupAuthGate = lazy(() => import('./theme-05-ledup/components/LedupAuthGateModal').then(m => ({ default: m.LedupAuthGateModal })));
const LedupCookie: ComponentType<CookieBannerProps> = props => createElement(Suspense, { fallback: null }, createElement(LazyLedupCookie, props));
const LedupAuthGate: ComponentType = () => createElement(Suspense, { fallback: null }, createElement(LazyLedupAuthGate));
const LedupGate: NewThemeImpl['GatePage'] = props => createElement(Suspense, { fallback: null }, createElement(LazyLedupGate, props));

/** Every storefront route a theme can implement. A route a theme does not cover falls back to the default theme's page, so a theme that is still being built never renders a blank screen. */
export type StorefrontRouteKey =
  | 'home' | 'product' | 'category' | 'collection' | 'collections' | 'faqs' | 'search'
  | 'cart' | 'checkout' | 'checkoutReturn' | 'login' | 'register' | 'verifyOtp' | 'account' | 'wishlist'
  | 'loyalty' | 'messages' | 'notifications' | 'returns' | 'giftCards' | 'giftCardView' | 'storeCredit' | 'orders' | 'orderDetail' | 'library' | 'memberships' | 'licenses' | 'learn' | 'wholesale' | 'codConfirm' | 'messagingPrefs' | 'orderStatus' | 'addresses' | 'myReviews'
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
  /** The "sign in to continue" pop-up in this theme's own look. A theme without one gets the platform pop-up. */
  AuthGateModal?: ComponentType;
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
    AuthGateModal: FashionAuthGateModal,
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
      library: FashionLibraryPage,
      memberships: FashionMembershipsPage,
      licenses: FashionLicensesPage,
      learn: FashionLearnPage,
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
  'theme-04-tech': {
    Layout: TechLayout,
    GatePage: TechGate,
    CookieBanner: TechCookie,
    AuthGateModal: TechAuthGate,
    pages: {
      home: TechHomePage,
      product: TechProductPage,
      cart: TechCartPage,
      collection: TechCollectionPage,
      category: TechCategoryPage,
      search: TechSearchPage,
      customPage: TechCustomPage,
      checkout: TechCheckoutPage,
      checkoutReturn: TechCheckoutReturnPage,
      login: TechLoginPage,
      register: TechRegisterPage,
      verifyOtp: TechVerifyOtpPage,
      forgotPassword: TechForgotPasswordPage,
      newPassword: TechNewPasswordPage,
      account: TechAccountPage,
      orders: TechOrdersPage,
      addresses: TechAddressesPage,
      orderDetail: TechOrderDetailPage,
      orderStatus: TechOrderStatusPage,
      returns: TechReturnsPage,
      wishlist: TechWishlistPage,
      myReviews: TechMyReviewsPage,
      giftCards: TechGiftCardsPage,
      giftCardView: TechGiftCardViewPage,
      storeCredit: TechStoreCreditPage,
      loyalty: TechLoyaltyPage,
      messages: TechMessagesPage,
      notifications: TechNotificationsPage,
      blogIndex: TechBlogIndexPage,
      blogPost: TechBlogPostPage,
      faqs: TechFaqsPage,
      collections: TechCollectionsPage,
      notFound: TechNotFoundPage,
      library: TechLibraryPage,
      memberships: TechMembershipsPage,
      licenses: TechLicensesPage,
      learn: TechLearnPage,
    },
    display: {
      name: 'Tech Store',
      description: 'Electronics and computers: bright blue accents, dark feature bands, a filter sidebar and compact product cards.',
      builtRouteCount: 37,
      totalRouteCount: 37,
    },
    installDefaults: { primaryColor: '#0156FF', bgColor: '#FFFFFF', textColor: '#020203', font: 'Poppins', buttonStyle: 'solid', buttonRadius: 'full' },
  },
  'theme-05-ledup': {
    Layout: LedupLayout,
    GatePage: LedupGate,
    CookieBanner: LedupCookie,
    AuthGateModal: LedupAuthGate,
    pages: {
      home: LedupHomePage,
      product: LedupProductPage,
      cart: LedupCartPage,
      collection: LedupCollectionPage,
      category: LedupCategoryPage,
      search: LedupSearchPage,
      customPage: LedupCustomPage,
      checkout: LedupCheckoutPage,
      checkoutReturn: LedupCheckoutReturnPage,
      login: LedupLoginPage,
      register: LedupRegisterPage,
      verifyOtp: LedupVerifyOtpPage,
      forgotPassword: LedupForgotPasswordPage,
      newPassword: LedupNewPasswordPage,
      account: LedupAccountPage,
      orders: LedupOrdersPage,
      addresses: LedupAddressesPage,
      orderDetail: LedupOrderDetailPage,
      orderStatus: LedupOrderStatusPage,
      returns: LedupReturnsPage,
      wishlist: LedupWishlistPage,
      myReviews: LedupMyReviewsPage,
      giftCards: LedupGiftCardsPage,
      giftCardView: LedupGiftCardViewPage,
      storeCredit: LedupStoreCreditPage,
      loyalty: LedupLoyaltyPage,
      messages: LedupMessagesPage,
      notifications: LedupNotificationsPage,
      blogIndex: LedupBlogIndexPage,
      blogPost: LedupBlogPostPage,
      faqs: LedupFaqsPage,
      collections: LedupCollectionsPage,
      notFound: LedupNotFoundPage,
      library: LedupLibraryPage,
      memberships: LedupMembershipsPage,
      licenses: LedupLicensesPage,
      learn: LedupLearnPage,
    },
    display: {
      name: 'Ledup',
      description: 'Architectural and commercial LED lighting: warm metallic bronze header, curved tab navigation, technical spec pills, and curved espresso footer.',
      builtRouteCount: 37,
      totalRouteCount: 37,
    },
    installDefaults: {
      primaryColor: '#8C7355',
      bgColor: '#FFFFFF',
      textColor: '#1C1917',
      font: 'Poppins',
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
