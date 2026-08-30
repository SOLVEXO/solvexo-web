import type { ComponentType, ReactNode } from 'react';
import { AtelierLayout } from './theme-01-atelier/layout/AtelierLayout';
import { AtelierHomePage } from './theme-01-atelier/pages/AtelierHomePage';
import { AtelierProductPage } from './theme-01-atelier/pages/AtelierProductPage';
import { AtelierCartPage } from './theme-01-atelier/pages/AtelierCartPage';
import { AtelierCheckoutPage } from './theme-01-atelier/pages/AtelierCheckoutPage';
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

// Theme 02 — "Nova": the reusability-proof second theme. Its own real,
// independent implementation (own components/sections/pages), registered
// through the exact same three generic contracts Atelier uses above — see
// `theme-02-nova/theme.config.ts`'s README for its disclosed 7/16-route
// scope and why that's safe (this file's own `ThemedRoute` fallback, below).
import { NovaLayout } from './theme-02-nova/layout/NovaLayout';
import { NovaHomePage } from './theme-02-nova/pages/NovaHomePage';
import { NovaProductPage } from './theme-02-nova/pages/NovaProductPage';
import { NovaCategoryPage } from './theme-02-nova/pages/NovaCategoryPage';
import { NovaCollectionPage } from './theme-02-nova/pages/NovaCollectionPage';
import { NovaSearchPage } from './theme-02-nova/pages/NovaSearchPage';
import { NovaBlogIndexPage } from './theme-02-nova/pages/NovaBlogIndexPage';
import { NovaBlogPostPage } from './theme-02-nova/pages/NovaBlogPostPage';
import './theme-02-nova/theme.manifest';
import './theme-02-nova/theme.devFiles';

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
  | 'cart' | 'checkout' | 'login' | 'register' | 'verifyOtp' | 'account'
  | 'blogIndex' | 'blogPost' | 'customPage'
  | 'forgotPassword' | 'newPassword';

interface NewThemeImpl {
  Layout: ComponentType<{ children: ReactNode }>;
  pages: Partial<Record<StorefrontRouteKey, ComponentType>>;
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
    pages: {
      home: AtelierHomePage,
      product: AtelierProductPage,
      cart: AtelierCartPage,
      checkout: AtelierCheckoutPage,
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
    },
    display: {
      name: 'Atelier',
      description: 'Premium editorial fashion & lifestyle — asymmetric layouts, large photography, and a quiet, confident typographic voice. Its own independent storefront implementation, not a re-skin.',
      builtRouteCount: 16,
      totalRouteCount: 16,
    },
  },
  'theme-02-nova': {
    Layout: NovaLayout,
    pages: {
      home: NovaHomePage,
      product: NovaProductPage,
      category: NovaCategoryPage,
      collection: NovaCollectionPage,
      search: NovaSearchPage,
      blogIndex: NovaBlogIndexPage,
      blogPost: NovaBlogPostPage,
      // cart/checkout/login/register/verifyOtp/forgotPassword/newPassword/
      // account/customPage are deliberately NOT implemented yet — see
      // `theme-02-nova/theme.config.ts`'s README. `ThemedRoute` falls back
      // to Atelier's real page for each of those, so a Nova store is fully
      // usable end-to-end today.
    },
    display: {
      name: 'Nova',
      description: 'Bold, energetic, commerce-first — vivid color, confident geometric type, and punchy pill buttons. Its own independent storefront implementation, not a re-skin.',
      builtRouteCount: 7,
      totalRouteCount: 16,
    },
  },
};

export function listNewThemeEntries() {
  return Object.entries(NEW_THEME_REGISTRY).map(([id, impl]) => ({ id, ...impl.display }));
}
