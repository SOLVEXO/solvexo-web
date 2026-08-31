import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Block, Section } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type ThemeBorderRadius       = 'none' | 'small' | 'medium' | 'large' | 'full';
export type ThemeButtonStyle        = 'solid' | 'outline' | 'soft';
export type ThemeButtonWidth        = 'auto' | 'full';
export type ThemeScale              = 'compact' | 'comfortable' | 'spacious';
export type ThemeContainerWidth     = 'narrow' | 'standard' | 'wide';
export type ThemeCardStyle          = 'flat' | 'outlined' | 'elevated';
export type ThemeButtonSize         = 'sm' | 'md' | 'lg';
export type ThemeHeroStyle          = 'overlay' | 'split';
export type ThemeHeroAlignment      = 'left' | 'center';
export type ThemeProductImageRatio  = 'square' | 'portrait';
export type ThemeProductImageHover  = 'none' | 'zoom';
export type ThemeProductGridDensity = 'cozy' | 'relaxed';
export type ThemeTestimonialStyle   = 'cards' | 'minimal';
export type ThemeFaqStyle           = 'accordion' | 'list';
export type ThemeHeaderStyle        = 'standard' | 'centered';
export type ThemeFooterStyle        = 'columns' | 'minimal';

export interface StorefrontColors {
  primaryColor: string;
  bgColor:      string;
  textColor:    string;
  accentColor:  string;
  font:         string;
  buttonStyle:  ThemeButtonStyle;
  /** Buttons scope — independent from product/testimonial cards and images. */
  buttonRadius: ThemeBorderRadius;
  buttonWidth:  ThemeButtonWidth;
  /** Images scope — standalone content images only (never buttons/cards). */
  imageRadius:  ThemeBorderRadius;
  typeScale:          ThemeScale;
  containerWidth:     ThemeContainerWidth;
  sectionSpacing:     ThemeScale;
  buttonSize:         ThemeButtonSize;
  heroStyle:          ThemeHeroStyle;
  heroAlignment:      ThemeHeroAlignment;
  /** Product Cards scope — independent from testimonial cards. */
  productCardStyle:   ThemeCardStyle;
  productCardRadius:  ThemeBorderRadius;
  productImageRatio:  ThemeProductImageRatio;
  productImageHover:  ThemeProductImageHover;
  productGridDensity: ThemeProductGridDensity;
  testimonialStyle:   ThemeTestimonialStyle;
  /** Testimonials scope — independent from product cards. */
  testimonialCardStyle:  ThemeCardStyle;
  testimonialCardRadius: ThemeBorderRadius;
  faqStyle:           ThemeFaqStyle;
}

export interface StorefrontHeader {
  logoSource:    'store' | 'custom';
  customLogoUrl: string | null;
  blocks:        Block[]; // nav_link blocks
  navAlignment:  'left' | 'center' | 'right';
  headerStyle:   ThemeHeaderStyle;
}

export interface StorefrontFooter {
  blocks:      Block[]; // footer_column / social_link / copyright_text blocks
  footerStyle: ThemeFooterStyle;
}

export type IdentityBannerLayout = 'standard' | 'compact' | 'immersive';

export interface IdentityBanner {
  showFollowButton:     boolean;
  showMessageButton:    boolean;
  showLoyaltyButton:    boolean;
  showMembershipButton: boolean;
  layout:               IdentityBannerLayout;
  showBadges:           boolean;
  showFollowerCount:    boolean;
  showProductCount:     boolean;
  showRating:           boolean;
  descriptionMaxLines:  number | null;
}

export type InstalledThemeStatus = 'installed' | 'active';

export interface StoreThemeData {
  _id:            string;
  storeId:        string;
  // Which code-shipped theme package (`builder/themes/<id>/`) this row is an
  // installation of, and whether it's the one the public storefront renders.
  // See the Theme Definition ⟷ Installed Theme Instance split.
  themeDefinitionId: string | null;
  status:         InstalledThemeStatus;
  installedAt:    string;
  // Live/published — read by the public storefront exactly as before the
  // draft/publish split existed.
  theme:          StorefrontColors;
  header:         StorefrontHeader;
  footer:         StorefrontFooter;
  identityBanner: IdentityBanner;
  // Which curated `themes.ts` definition the `theme`/`header`/`footer`
  // fields were last bulk-applied from — null if never applied one.
  baseThemeId:    string | null;
  customCss:      string | null;
  // The seller's working copy — what every `apiUpdateStoreXxx` call below
  // now writes to. Mirrors the live shape exactly; only `apiPublishStoreTheme`
  // ever copies this over the live fields above.
  draft: {
    theme:          StorefrontColors;
    header:         StorefrontHeader;
    footer:         StorefrontFooter;
    identityBanner: IdentityBanner;
    baseThemeId:    string | null;
    customCss:      string | null;
  };
  lastPublishedAt: string | null;
}

/** The seller's working copy — what Store Builder's Theme/Header/Footer tabs
 *  read/edit and what Live Preview renders. Same shape as the public payload
 *  plus `lastPublishedAt`, so "unpublished changes" can be diffed against
 *  `apiGetStoreTheme`'s live root fields without a second round trip. */
export interface StoreThemeDraftData {
  theme:          StorefrontColors;
  header:         StorefrontHeader;
  footer:         StorefrontFooter;
  identityBanner: IdentityBanner;
  baseThemeId:    string | null;
  themeDefinitionId: string | null;
  customCss:      string | null;
  lastPublishedAt: string | null;
}

/** Appends `?instance=<installedThemeId>` when targeting a non-active installed theme (Theme Library "Customize" on something other than the live theme) — every existing caller omits it and keeps operating on the store's active row, unchanged. */
function withInstance(path: string, installedThemeId?: string) {
  return installedThemeId ? `${path}?instance=${installedThemeId}` : path;
}

export function apiGetStoreTheme(storeId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.GET(storeId), installedThemeId));
}

export function apiGetStoreThemeDraft(storeId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<StoreThemeDraftData>>(withInstance(ENDPOINTS.STORE_THEME.DRAFT(storeId), installedThemeId));
}

export function apiPublishStoreTheme(storeId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.PUBLISH(storeId), installedThemeId));
}

export function apiRevertStoreThemeDraft(storeId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.REVERT_DRAFT(storeId), installedThemeId));
}

// ── Theme Library — installed theme instances ───────────────────────────

export function apiListInstalledThemes(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData[]>>(ENDPOINTS.STORE_THEME.LIST_INSTALLED(storeId));
}

export function apiInstallTheme(storeId: string, payload: { themeDefinitionId: string; theme?: Partial<StorefrontColors>; header?: Partial<StorefrontHeader>; footer?: Partial<StorefrontFooter>; identityBanner?: Partial<IdentityBanner> }) {
  return client.post<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.INSTALL(storeId), payload);
}

export function apiActivateTheme(storeId: string, installedThemeId: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.ACTIVATE(storeId, installedThemeId));
}

export function apiUninstallTheme(storeId: string, installedThemeId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_THEME.UNINSTALL(storeId, installedThemeId));
}

/** A real, immutable snapshot of the live theme taken at the moment of
 *  every publish — see `ThemeVersion` on the backend. Newest first. */
export interface ThemeVersionData {
  _id:            string;
  theme:          StorefrontColors;
  header:         StorefrontHeader;
  footer:         StorefrontFooter;
  identityBanner: IdentityBanner;
  baseThemeId:    string | null;
  customCss:      string | null;
  publishedAt:    string;
}

export function apiListStoreThemeVersions(storeId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<ThemeVersionData[]>>(withInstance(ENDPOINTS.STORE_THEME.VERSIONS(storeId), installedThemeId));
}

/** Restores a past version into the DRAFT slot for review — the seller still
 *  has to hit Publish afterward, same as any other draft edit. */
export function apiRestoreStoreThemeVersion(storeId: string, versionId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.RESTORE_VERSION(storeId, versionId), installedThemeId));
}

export function apiGetPublicStoreTheme(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData | null>>(ENDPOINTS.STORE_THEME.PUBLIC(storeId));
}

export function apiUpdateStoreThemeColors(storeId: string, payload: Partial<StorefrontColors> & { baseThemeId?: string | null }, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_THEME(storeId), installedThemeId), payload);
}

export function apiUpdateStoreHeader(storeId: string, payload: Partial<Omit<StorefrontHeader, 'blocks'>> & { blocks?: Block[] }, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_HEADER(storeId), installedThemeId), payload);
}

export function apiUpdateStoreFooter(storeId: string, blocks: Block[], footerStyle?: ThemeFooterStyle, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_FOOTER(storeId), installedThemeId), { blocks, footerStyle });
}

export function apiUpdateIdentityBanner(storeId: string, payload: Partial<IdentityBanner>, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_IDENTITY_BANNER(storeId), installedThemeId), payload);
}

/** Real, bounded "developer/advanced authoring" capability — raw CSS
 *  injected into the storefront. See the backend `StoreTheme.customCss`
 *  schema comment for the full safety rationale (CSS-only, no custom JS). */
export function apiUpdateStoreCustomCss(storeId: string, customCss: string | null, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_CUSTOM_CSS(storeId), installedThemeId), { customCss });
}

/** Code editor (Phase 5) — server re-sanitizes independently of whatever the client already checked. */
export function apiUpdateCustomCss(storeId: string, customCss: string | null) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_CUSTOM_CSS(storeId), { customCss });
}
