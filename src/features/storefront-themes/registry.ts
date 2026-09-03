import type { ComponentType, ReactNode } from 'react';
import type { PublicStoreData } from '@/api/services/store';
import { AtelierLayout } from './theme-01-atelier/layout/AtelierLayout';
import { AtelierHomePage } from './theme-01-atelier/pages/AtelierHomePage';
import { AtelierProductPage } from './theme-01-atelier/pages/AtelierProductPage';
import { AtelierCartPage } from './theme-01-atelier/pages/AtelierCartPage';
import { AtelierCheckoutPage } from './theme-01-atelier/pages/AtelierCheckoutPage';
import { AtelierCheckoutReturnPage } from './theme-01-atelier/pages/AtelierCheckoutReturnPage';
import { AtelierLoginPage } from './theme-01-atelier/pages/AtelierLoginPage';
import { AtelierRegisterPage } from './theme-01-atelier/pages/AtelierRegisterPage';
import { AtelierVerifyOtpPage } from './theme-01-atelier/pages/AtelierVerifyOtpPage';
import { AtelierForgotPasswordPage } from './theme-01-atelier/pages/AtelierForgotPasswordPage';
import { AtelierNewPasswordPage } from './theme-01-atelier/pages/AtelierNewPasswordPage';
import { AtelierAccountPage } from './theme-01-atelier/pages/AtelierAccountPage';
import { AtelierCategoryPage } from './theme-01-atelier/pages/AtelierCategoryPage';
import { AtelierCollectionPage } from './theme-01-atelier/pages/AtelierCollectionPage';
import { AtelierSearchPage } from './theme-01-atelier/pages/AtelierSearchPage';
import { AtelierBlogIndexPage } from './theme-01-atelier/pages/AtelierBlogIndexPage';
import { AtelierBlogPostPage } from './theme-01-atelier/pages/AtelierBlogPostPage';
import { AtelierCustomPage } from './theme-01-atelier/pages/AtelierCustomPage';
import { AtelierNotFoundPage } from './theme-01-atelier/pages/AtelierNotFoundPage';
import { AtelierStorefrontGate } from './theme-01-atelier/pages/AtelierStorefrontGate';
// Registers this theme's `ThemeManifest` (see `themeManifest.ts`) as a side
// effect of importing this module — pure addition, nothing reads
// `THEME_MANIFESTS` yet, so this cannot change any existing behavior. It's
// wired here (not left for some future page to remember to import) so the
// manifest is guaranteed live wherever the theme registry itself is.
import './theme-01-atelier/theme.manifest';
// Same pattern, for the Edit Code developer workspace's real read-only
// source files (see `themeDevFiles.ts` for why this is a separate registry
// from `theme.manifest.ts` rather than folded into it — a Vite
// `import.meta.glob` constraint, not a design choice).
import './theme-01-atelier/theme.devFiles';
// Same pattern again, for the live-preview panel shared by Customize and
// Header & Footer (see `themePreviewComponents.ts` — this closes a real gap
// found while building Nova: that panel used to import Atelier's section
// renderer/navbar/footer/theme.config directly by name).
import './theme-01-atelier/theme.preview';
// Same pattern again, for the Theme Library's static, dummy-content demo
// preview (see `themeDemoPreview.ts` — this is what makes a preview always
// look like a complete, finished theme instead of the real-store-content
// cross-theme rendering that used to silently drop unsupported section types).
import './theme-01-atelier/theme.demoPreview';

// Theme 02 — "Nova": the reusability-proof second theme. Its own real,
// independent implementation (own components/sections/pages), registered
// through the exact same three generic contracts Atelier uses above — see
// `theme-02-nova/theme.config.ts`'s README (now dated: written when Nova
// was still an 8/18-route proof-of-concept) for the "why" of the original
// design. Nova has since reached full 18/18 route parity with Atelier —
// see the `pages` map's own comment below.
import { NovaLayout } from './theme-02-nova/layout/NovaLayout';
import { NovaHomePage } from './theme-02-nova/pages/NovaHomePage';
import { NovaProductPage } from './theme-02-nova/pages/NovaProductPage';
import { NovaCartPage } from './theme-02-nova/pages/NovaCartPage';
import { NovaCheckoutPage } from './theme-02-nova/pages/NovaCheckoutPage';
import { NovaCheckoutReturnPage } from './theme-02-nova/pages/NovaCheckoutReturnPage';
import { NovaLoginPage } from './theme-02-nova/pages/NovaLoginPage';
import { NovaRegisterPage } from './theme-02-nova/pages/NovaRegisterPage';
import { NovaVerifyOtpPage } from './theme-02-nova/pages/NovaVerifyOtpPage';
import { NovaForgotPasswordPage } from './theme-02-nova/pages/NovaForgotPasswordPage';
import { NovaNewPasswordPage } from './theme-02-nova/pages/NovaNewPasswordPage';
import { NovaAccountPage } from './theme-02-nova/pages/NovaAccountPage';
import { NovaCategoryPage } from './theme-02-nova/pages/NovaCategoryPage';
import { NovaCollectionPage } from './theme-02-nova/pages/NovaCollectionPage';
import { NovaSearchPage } from './theme-02-nova/pages/NovaSearchPage';
import { NovaBlogIndexPage } from './theme-02-nova/pages/NovaBlogIndexPage';
import { NovaBlogPostPage } from './theme-02-nova/pages/NovaBlogPostPage';
import { NovaCustomPage } from './theme-02-nova/pages/NovaCustomPage';
import { NovaNotFoundPage } from './theme-02-nova/pages/NovaNotFoundPage';
import { NovaStorefrontGate } from './theme-02-nova/pages/NovaStorefrontGate';
import './theme-02-nova/theme.manifest';
import './theme-02-nova/theme.devFiles';
import './theme-02-nova/theme.preview';
import './theme-02-nova/theme.demoPreview';

/** Every storefront route a theme can implement. The legacy shared-engine's
 *  per-key fallback (silently rendering nothing for an unbuilt key) has been
 *  removed along with the legacy rendering code — but `ThemedRoute` (below)
 *  keeps a real, deliberate replacement for it: a route a theme's `pages`
 *  map doesn't cover falls back to `DEFAULT_THEME_ID`'s own real,
 *  fully-functional page for that route, rather than a blank screen or a
 *  crash. A theme is expected to disclose its real build progress honestly
 *  (`display.builtRouteCount`/`totalRouteCount`, shown on its Theme Library
 *  card) rather than claim completeness it doesn't have — see
 *  `theme-02-nova`'s own manifest/README for a real theme that uses this.
 *  `forgotPassword`/`newPassword` were added alongside `login`/`register`/
 *  `verifyOtp` — a storefront's own account-recovery flow is as required as
 *  being able to sign in at all, not a later nice-to-have. */
export type StorefrontRouteKey =
  | 'home' | 'product' | 'category' | 'collection' | 'search'
  | 'cart' | 'checkout' | 'checkoutReturn' | 'login' | 'register' | 'verifyOtp' | 'account'
  | 'blogIndex' | 'blogPost' | 'customPage'
  | 'forgotPassword' | 'newPassword' | 'notFound';

/** The subset of `StorefrontColors` (see `api/services/storeTheme.ts`) that
 *  actually varies between themes and is worth sending at install time —
 *  matches exactly what each theme's own `applyMerchantThemeOverrides`
 *  reads (`bgColor`/`textColor`/`primaryColor`/`font`/`buttonStyle`/
 *  `buttonRadius`). `buttonWidth`/`sectionSpacing`/`containerWidth` are
 *  deliberately omitted — every theme's own default for those is already
 *  'auto'/'comfortable'/'standard' by construction (see either theme's
 *  `SECTION_PAD_Y_PRESET`/`MAX_WIDTH_PRESET` — the 'comfortable'/'standard'
 *  entry always equals that theme's own `STATIC_DEFAULTS`), so there's
 *  nothing theme-specific to carry for those three. */
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
  /** Real storefront access gate ('password'/'coming_soon' — see
   *  `Store.privacyMode`) — rendered by `StorefrontLayout.tsx` INSTEAD of
   *  `Layout`/`pages` while the store is gated and this tab hasn't unlocked
   *  it yet. Every registered theme must implement this (unlike `pages`,
   *  there is no cross-theme fallback need since it's simple enough for
   *  every theme to own outright). */
  GatePage: ComponentType<{ store: PublicStoreData; onUnlocked: () => void }>;
  /** Seller-facing Theme Library card metadata — deliberately separate from
   *  the legacy `ThemeDefinition` shape (no `colors`/`headerStyle` fields
   *  the new theme doesn't use for rendering), and deliberately NOT run
   *  through the old `ThemeCard`/`ThemeStorefrontPreview` synthetic-preview
   *  mechanism, which renders through the legacy shared engine and would
   *  misrepresent a genuinely independent theme's real layout. */
  display: {
    name: string;
    description: string;
    /** Which storefront route keys (see `StorefrontRouteKey`) this theme
     *  has a real, finished implementation for — shown as build progress
     *  on its Theme Library card so "installed" never silently implies
     *  "production-ready" before it actually is. */
    builtRouteCount: number;
    totalRouteCount: number;
  };
  /** Sent as `theme` in `apiInstallTheme(...)` when a seller installs this
   *  theme — this is the real fix for a genuine bug found via a live
   *  install+customize walkthrough: `ThemeLibraryPage.tsx`'s install call
   *  used to omit `theme` entirely, so the BACKEND's own `StorefrontColors`
   *  Mongoose schema defaults (`#D97757`/`Poppins`/etc — leftovers from the
   *  old pre-Atelier/Nova legacy shared-theme-engine, not either real
   *  theme's own design) silently got persisted onto every newly-installed
   *  theme row instead of that theme's OWN accent/font/button identity.
   *  Concretely: a fresh Nova install rendered its Customize preview (and,
   *  identically, its real published storefront — both read this exact
   *  same `theme` document) with the platform's generic orange accent and
   *  a medium button radius, never Nova's own vivid indigo + full-pill
   *  buttons — this is the actual reason the preview looked "generic"
   *  rather than a Nova/Atelier rendering difference. See `install-theme.dto.ts`'s
   *  own doc comment: "the frontend theme-definition package is the single
   *  source of truth for what a theme's defaults look like" — this field is
   *  what finally makes that true; the backend's schema-level defaults are
   *  now only a safety net for a malformed/omitted payload, never the
   *  normal path. NOTE: this does not repair already-installed rows created
   *  before this fix (their `theme.primaryColor` etc. already has the stale
   *  values persisted) — those need either a one-time backend migration or
   *  a seller manually re-entering their theme's real colors in Theme
   *  Settings; flagged separately, not silently patched here. */
  installDefaults: ThemeInstallColorDefaults;
}

/** The single registry every store's `themeDefinitionId` is checked against.
 *  The legacy 12-theme shared-engine system (`src/features/storefront/` +
 *  `src/features/seller/.../builder/themes/`) has been fully removed — a
 *  snapshot is archived under `_legacy-theme-backup/` at the repo root, not
 *  reachable from the app. A store whose `themeDefinitionId` doesn't match
 *  an entry here (e.g. a pre-migration row still pointing at an old,
 *  deleted theme id) falls back to `DEFAULT_THEME_ID` — see `ThemedRoute`. */
export const DEFAULT_THEME_ID = 'theme-01-atelier';

export const NEW_THEME_REGISTRY: Record<string, NewThemeImpl> = {
  'theme-01-atelier': {
    Layout: AtelierLayout,
    GatePage: AtelierStorefrontGate,
    pages: {
      home: AtelierHomePage,
      product: AtelierProductPage,
      cart: AtelierCartPage,
      checkout: AtelierCheckoutPage,
      checkoutReturn: AtelierCheckoutReturnPage,
      login: AtelierLoginPage,
      register: AtelierRegisterPage,
      verifyOtp: AtelierVerifyOtpPage,
      forgotPassword: AtelierForgotPasswordPage,
      newPassword: AtelierNewPasswordPage,
      account: AtelierAccountPage,
      category: AtelierCategoryPage,
      collection: AtelierCollectionPage,
      search: AtelierSearchPage,
      blogIndex: AtelierBlogIndexPage,
      blogPost: AtelierBlogPostPage,
      customPage: AtelierCustomPage,
      notFound: AtelierNotFoundPage,
    },
    display: {
      name: 'Atelier',
      description: 'Premium editorial fashion & lifestyle — asymmetric layouts, large photography, and a quiet, confident typographic voice. Its own independent storefront implementation, not a re-skin.',
      builtRouteCount: 18,
      totalRouteCount: 18,
    },
    // Matches `theme-01-atelier/theme.config.ts`'s own `STATIC_DEFAULTS`
    // exactly (brass accent, warm ivory ground, near-black ink, Inter body
    // font, sharp outline buttons) — see `ThemeInstallColorDefaults`'s doc
    // comment above for why this exists.
    installDefaults: {
      primaryColor: '#9C7A3C',
      bgColor: '#FAF8F4',
      textColor: '#161412',
      font: 'Inter',
      buttonStyle: 'outline',
      buttonRadius: 'none',
    },
  },
  'theme-02-nova': {
    Layout: NovaLayout,
    GatePage: NovaStorefrontGate,
    pages: {
      home: NovaHomePage,
      product: NovaProductPage,
      cart: NovaCartPage,
      checkout: NovaCheckoutPage,
      checkoutReturn: NovaCheckoutReturnPage,
      login: NovaLoginPage,
      register: NovaRegisterPage,
      verifyOtp: NovaVerifyOtpPage,
      forgotPassword: NovaForgotPasswordPage,
      newPassword: NovaNewPasswordPage,
      account: NovaAccountPage,
      category: NovaCategoryPage,
      collection: NovaCollectionPage,
      search: NovaSearchPage,
      blogIndex: NovaBlogIndexPage,
      blogPost: NovaBlogPostPage,
      customPage: NovaCustomPage,
      notFound: NovaNotFoundPage,
      // Nova reached full 18/18 route parity with Atelier in this pass —
      // cart/checkout/checkoutReturn/login/register/verifyOtp/
      // forgotPassword/newPassword/account/customPage (the 10 that used to
      // fall back to Atelier's page via `ThemedRoute`) are now real,
      // independent Nova implementations, ported functionally 1:1 from
      // their Atelier counterparts with Nova's own rounded/pill/
      // accent-forward presentation. `ThemedRoute`'s cross-theme fallback
      // stays in place as a safety net for any FUTURE theme that's still
      // mid-build, not because Nova needs it any more.
    },
    display: {
      name: 'Nova',
      description: 'Bold, energetic, commerce-first — vivid color, confident geometric type, and punchy pill buttons. Its own independent storefront implementation, not a re-skin.',
      builtRouteCount: 18,
      totalRouteCount: 18,
    },
    // Matches `theme-02-nova/theme.config.ts`'s own `STATIC_DEFAULTS`
    // exactly (vivid indigo accent, white ground, cool near-black ink,
    // DM Sans body font, solid full-pill buttons).
    installDefaults: {
      primaryColor: '#4B3BFF',
      bgColor: '#FFFFFF',
      textColor: '#14121F',
      font: 'DM Sans',
      buttonStyle: 'solid',
      buttonRadius: 'full',
    },
  },
};

export function listNewThemeEntries() {
  return Object.entries(NEW_THEME_REGISTRY).map(([id, impl]) => ({ id, ...impl.display, installDefaults: impl.installDefaults }));
}
