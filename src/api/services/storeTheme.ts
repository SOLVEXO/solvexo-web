import client from '../client';
import { dedupedGet } from '../../utils/dedupedGet';
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
export type ThemeProductImageRatio  = 'square' | 'portrait' | 'landscape' | 'adapt';
export type ThemeProductImageHover  = 'none' | 'zoom' | 'second-image';
export type ThemeProductGridDensity = 'cozy' | 'relaxed';
export type ThemeTestimonialStyle   = 'cards' | 'minimal';
export type ThemeFaqStyle           = 'accordion' | 'list';
export type ThemeHeaderStyle        = 'standard' | 'centered' | 'split' | 'inline';
export type ThemeFooterStyle        = 'columns' | 'minimal';

export interface StorefrontColors {
  primaryColor: string;
  bgColor:      string;
  textColor:    string;
  accentColor:  string;
  font:         string;
  headingFont?: string | null;
  /** Optional colour overrides; null/absent = derived by the theme. */
  mutedColor?:  string | null;
  borderColor?: string | null;
  saleColor?:   string | null;
  /** Typography / shape options; a theme ignores any it does not support. */
  headingWeight?:   'regular' | 'medium' | 'semibold' | 'bold';
  headingCase?:     'none' | 'uppercase';
  headingTracking?: 'auto' | 'tight' | 'normal' | 'wide';
  buttonCase?:      'normal' | 'uppercase';
  sectionRadius?:   'none' | 'small' | 'medium' | 'large';
  inputRadius?:     'none' | 'small' | 'medium' | 'large' | 'full';
  badgeStyle?:      'pill' | 'square';
  cardRating?:      'show' | 'hide';
  cardTag?:         'show' | 'hide';
  cardButton?:      'show' | 'hide';
  headingScale?: 'small' | 'medium' | 'large' | 'xlarge';
  bodyScale?: 'small' | 'medium' | 'large';
  headingLineHeight?: 'auto' | 'tight' | 'normal' | 'loose';
  linkUnderline?: 'auto' | 'always' | 'never';
  pagePadding?: 'narrow' | 'standard' | 'wide';
  gridGap?: 'tight' | 'standard' | 'airy';
  buttonHover?: 'fade' | 'lift' | 'grow';
  buttonShadow?: 'none' | 'soft';
  cardHover?: 'shadow' | 'lift' | 'none';
  cardTextAlign?: 'left' | 'center';
  showBreadcrumbs?: 'show' | 'hide';
  showStockStatus?: 'show' | 'hide';
  showVendor?: 'show' | 'hide';
  showReviews?: 'show' | 'hide';
  stickyBuyBar?: 'show' | 'hide';
  animations?: 'on' | 'off';
  focusRing?: 'auto' | 'accent' | 'ink';
  bodyWeight?: 'regular' | 'medium';
  sectionDividers?: 'none' | 'line';
  selection?: 'auto' | 'accent';
  cardWishlist?: 'show' | 'hide';
  cardViewLink?: 'show' | 'hide';
  saleBadgeText?: 'percent' | 'label';
  showDelivery?: 'show' | 'hide';
  headingColor?: string | null;
  linkColor?: string | null;
  priceColor?: string | null;
  starColor?: string | null;
  successColor?: string | null;
  buttonTextColor?: string | null;
  cardBgColor?: string | null;
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
  saleBadge?:         'show' | 'hide';
  quickView?:         'show' | 'hide';
  colorSwatches?:     'show' | 'hide';
  /** Settings a theme declares in its manifest (`custom.<name>` fields); see themeManifest.ts. */
  themeSettings?:     Record<string, string | number | boolean>;
  soldOutBadge?:      'show' | 'hide';
  cardStyle?:         'theme' | 'flat' | 'outlined' | 'elevated';
  cartType?:          'drawer' | 'page';
  productGridDensity: ThemeProductGridDensity;
  testimonialStyle:   ThemeTestimonialStyle;
  /** Testimonials scope — independent from product cards. */
  testimonialCardStyle:  ThemeCardStyle;
  testimonialCardRadius: ThemeBorderRadius;
  faqStyle:           ThemeFaqStyle;
  /** Named, reusable saved palettes. "Apply" still copies one's 3 colors
   *  onto bgColor/textColor/primaryColor above (draft), same fields the
   *  color pickers edit directly — theme-wide, unchanged. A scheme can ALSO
   *  be assigned to one individual `Section` via `Section.colorSchemeId`
   *  (e.g. a single Newsletter section rendered dark while the rest of the
   *  page stays light) — resolved per-section by each theme's own
   *  `resolveSectionColors()` in `theme.config.ts`, not here. */
  colorSchemes: ColorScheme[];
}

export interface ColorScheme {
  id:           string;
  name:         string;
  bgColor:      string;
  textColor:    string;
  primaryColor: string;
  mutedColor?:  string | null;
  borderColor?: string | null;
  saleColor?:   string | null;
}

/**
 * Phase 7 — the reusable "section group" contract `StorefrontHeader` and
 * `StorefrontFooter` (below) already satisfy structurally, named explicitly
 * here as this phase's required extension point rather than left implicit.
 *
 * A real Shopify `header-group.json`/`footer-group.json` is an ARRAY of
 * independently addable/removable/reorderable SECTIONS (e.g. a separate
 * "logo" section, a separate "menu" section, stackable in any order) — a
 * genuinely different shape from what exists here today: one fixed
 * `blocks: Block[]` list plus a few scalar layout fields. Converting to that
 * shape was evaluated and deliberately NOT done this pass, because it would
 * buy no real merchant capability in this codebase specifically:
 * `FashionNavbar` (and another theme's equivalents) render a FIXED
 * layout — one logo slot, one flat nav-link row; one columns/social/
 * copyright arrangement — with no place in their render tree for a second,
 * independently-positioned section, and `headerStyle`/`footerStyle` are
 * deliberately NOT swappable-by-the-merchant today (see
 * `ThemeHeaderFooterPage.tsx`'s own doc comment). Forcing a `Section[]`
 * wrapper around a group that can only ever meaningfully hold ONE section
 * would be exactly the "abstraction for its own sake" this phase's own
 * instructions warn against — there is nothing real to add/remove/reorder
 * at the SECTION level, only at the block level (which already works).
 *
 * So: a `SectionGroupLike` group is what Header/Footer already are — an
 * ordered list of independently addable/removable/reorderable `Block`s
 * (hide/duplicate were the one genuinely missing capability, closed this
 * pass in `ThemeHeaderFooterPage.tsx`'s `BlockRow`) plus the group's own
 * settings. A future theme that DOES need multiple independently-orderable
 * header/footer sections can extend this to `sections: SectionGroupLike[]`
 * without this shape changing — the clean extension point this phase's
 * requirements ask for, without inventing unused code today.
 */
export interface SectionGroupLike {
  blocks: Block[];
  settings: Record<string, unknown>;
}

export interface StorefrontHeader {
  /** Extra full-width sections shown under the header bar. */
  sections?:     Section[];
  logoSource:    'store' | 'custom';
  customLogoUrl: string | null;
  blocks:        Block[]; // nav_link blocks — the fallback content when no menu is attached
  navAlignment:  'left' | 'center' | 'right';
  headerStyle:   ThemeHeaderStyle;
  /** Independent layout controls; missing/null = derived from `headerStyle`. */
  logoPosition?: 'left' | 'center' | 'right' | null;
  menuPosition?: 'beside' | 'below' | null;
  /** A Menu id to render instead of `blocks` on the real storefront — `blocks` stays as the fallback, untouched. */
  menuId:        string | null;
  // Retailer-controlled chrome. Optional because a store saved before these existed omits them — a missing value means today's look.
  logoWidth?:           number | null;
  mobileLogoWidth?:     number | null;
  sticky?:              boolean;
  showSearch?:          boolean;
  showAccount?:         boolean;
  showWishlist?:        boolean;
  showShopMenu?:        boolean;
  shopMenuLabel?:       string | null;
  includePagesInNav?:   boolean;
  showDefaultBlogLink?: boolean;
  blogLinkLabel?:       string | null;
  bgColor?:             string | null;
  textColor?:           string | null;
  paddingY?:            'compact' | 'normal' | 'spacious';
  showDivider?:         boolean;
  stickyMode?:          'off' | 'always' | 'scroll-up' | null;
  transparentOnHome?:   boolean;
  transparentTextColor?: string | null;
  navFontSize?:         'sm' | 'md' | 'lg';
  navUppercase?:        boolean;
  navHoverStyle?:       'none' | 'underline' | 'pill';
  searchStyle?:         'icon' | 'bar';
  /** Search box only: next to the icons, or centered on its own row. */
  /** A choice the active theme offers (see its manifest `headerOptionChoices`); unknown values read as the default. */
  searchPosition?:      string;
  ctaLabel?:            string | null;
  ctaLink?:             string | null;
  topBarEnabled?:       boolean;
  topBarText?:          string | null;
  topBarPhone?:         string | null;
  topBarEmail?:         string | null;
  topBarBg?:            string | null;
  topBarTextColor?:     string | null;
  preset?:              string | null;
}

export interface StorefrontFooter {
  /** Extra full-width sections shown above the footer panel. */
  sections?:   Section[];
  blocks:      Block[]; // footer_column / social_link / copyright_text blocks
  footerStyle: ThemeFooterStyle;
  /** A Menu id whose items become one synthetic footer_column block on the
   *  real storefront, alongside the footer's own social_link/copyright_text
   *  blocks — `blocks`' own footer_column content stays as the fallback,
   *  untouched. See the backend's `StoreThemeService.resolveFooterMenu`. */
  menuId:      string | null;
  logoSource?:           'none' | 'store' | 'custom';
  logoUrl?:              string | null;
  logoWidth?:            number | null;
  showNewsletter?:       boolean;
  newsletterHeading?:    string | null;
  newsletterText?:       string | null;
  showDefaultColumns?:   boolean;
  shopColumnHeading?:    string | null;
  accountColumnHeading?: string | null;
  blogLinkLabel?:        string | null;
  bgColor?:              string | null;
  textColor?:            string | null;
  /** true once saved as an ordered block list (brand + newsletter are blocks). */
  blockLayout?:          boolean;
  paddingY?:             'compact' | 'normal' | 'spacious';
  bgImageUrl?:           string | null;
  bgOverlay?:            number;
  align?:                'left' | 'center';
  headingUppercase?:     boolean;
  socialStyle?:          'plain' | 'circle' | 'square' | null;
  newsletterTop?:        boolean;
  mobileAccordion?:      boolean;
  showPolicyLinks?:      boolean;
  showCurrency?:         boolean;
  showBackToTop?:        boolean;
  preset?:               string | null;
}

/** The footer settings the editor can save alongside its blocks. */
export type FooterSettingsPatch = Partial<Pick<StorefrontFooter,
  'logoSource' | 'logoUrl' | 'logoWidth' | 'showNewsletter' | 'newsletterHeading' | 'newsletterText' |
  'showDefaultColumns' | 'shopColumnHeading' | 'accountColumnHeading' | 'blogLinkLabel' | 'bgColor' | 'textColor' | 'blockLayout' | 'paddingY' | 'bgImageUrl' | 'bgOverlay' | 'align' | 'headingUppercase' | 'socialStyle' |
  'newsletterTop' | 'mobileAccordion' | 'showPolicyLinks' | 'showCurrency' | 'showBackToTop' | 'preset' | 'sections'>>;

export type IdentityBannerLayout = 'standard' | 'compact' | 'immersive';

export interface IdentityBanner {
  showFollowButton:     boolean;
  showMessageButton:    boolean;
  showLoyaltyButton:    boolean;
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
  sourcePackageVersion?: number | null;
  status:         InstalledThemeStatus;
  installedAt:    string;
  /** Merchant override for this row's display name (e.g. "Copy of Maison") — null means "just show the theme package's own name". */
  name:           string | null;
  // Live/published — read by the public storefront exactly as before the
  // draft/publish split existed.
  theme:          StorefrontColors;
  header:         StorefrontHeader;
  footer:         StorefrontFooter;
  identityBanner: IdentityBanner;
  // Which curated `themes.ts` definition the `theme`/`header`/`footer`
  // fields were last bulk-applied from — null if never applied one.
  baseThemeId:    string | null;
  // The seller's working copy — what every `apiUpdateStoreXxx` call below
  // now writes to. Mirrors the live shape exactly; only `apiPublishStoreTheme`
  // ever copies this over the live fields above.
  draft: {
    theme:          StorefrontColors;
    header:         StorefrontHeader;
    footer:         StorefrontFooter;
    identityBanner: IdentityBanner;
    baseThemeId:    string | null;
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

export function apiDuplicateTheme(storeId: string, installedThemeId: string, name?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.DUPLICATE(storeId, installedThemeId), { name });
}

export function apiRenameTheme(storeId: string, installedThemeId: string, name: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.RENAME(storeId, installedThemeId), { name });
}

export interface PreviewLinkData { token: string; expiresAt: string; themeDefinitionId: string | null }

export function apiCreatePreviewLink(storeId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<PreviewLinkData>>(withInstance(ENDPOINTS.STORE_THEME.PREVIEW_LINK(storeId), installedThemeId));
}

export function apiRevokePreviewLink(storeId: string, installedThemeId?: string) {
  return client.delete<never, ApiResponse<null>>(withInstance(ENDPOINTS.STORE_THEME.PREVIEW_LINK(storeId), installedThemeId));
}

export interface PreviewByTokenData {
  theme: StorefrontColors;
  header: StorefrontHeader;
  footer: StorefrontFooter;
  identityBanner: IdentityBanner;
  themeDefinitionId: string | null;
  storeSlug: string | null;
  homeSections: import('./storefrontTypes').Section[];
}

export function apiGetPreviewByToken(storeId: string, token: string) {
  return client.get<never, ApiResponse<PreviewByTokenData>>(ENDPOINTS.STORE_THEME.PREVIEW_BY_TOKEN(storeId, token));
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
  return dedupedGet(`theme:${storeId}`, () => client.get<never, ApiResponse<StoreThemeData | null>>(ENDPOINTS.STORE_THEME.PUBLIC(storeId)));
}

export function apiUpdateStoreThemeColors(storeId: string, payload: Partial<StorefrontColors> & { baseThemeId?: string | null }, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_THEME(storeId), installedThemeId), payload);
}

export function apiUpdateStoreHeader(storeId: string, payload: Partial<Omit<StorefrontHeader, 'blocks'>> & { blocks?: Block[] }, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_HEADER(storeId), installedThemeId), payload);
}

export function apiUpdateStoreFooter(storeId: string, blocks: Block[], footerStyle?: ThemeFooterStyle, installedThemeId?: string, menuId?: string | null, settings?: FooterSettingsPatch) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_FOOTER(storeId), installedThemeId), { blocks, footerStyle, ...(menuId !== undefined ? { menuId } : {}), ...(settings ?? {}) });
}

export function apiUpdateIdentityBanner(storeId: string, payload: Partial<IdentityBanner>, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.UPDATE_IDENTITY_BANNER(storeId), installedThemeId), payload);
}

// ── Color Schemes — named, reusable saved palettes ──────────────────────
export function apiCreateColorScheme(storeId: string, payload: { name: string; bgColor: string; textColor: string; primaryColor: string; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null }, installedThemeId?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.COLOR_SCHEMES(storeId), installedThemeId), payload);
}
export function apiDeleteColorScheme(storeId: string, schemeId: string, installedThemeId?: string) {
  return client.delete<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.DELETE_COLOR_SCHEME(storeId, schemeId), installedThemeId));
}
export function apiApplyColorScheme(storeId: string, schemeId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(withInstance(ENDPOINTS.STORE_THEME.APPLY_COLOR_SCHEME(storeId, schemeId), installedThemeId));
}

