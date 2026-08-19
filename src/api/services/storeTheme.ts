import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Block } from './storefrontTypes';

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

export interface IdentityBanner {
  showFollowButton:     boolean;
  showMessageButton:    boolean;
  showLoyaltyButton:    boolean;
  showMembershipButton: boolean;
}

export interface StoreThemeData {
  _id:            string;
  storeId:        string;
  theme:          StorefrontColors;
  header:         StorefrontHeader;
  footer:         StorefrontFooter;
  identityBanner: IdentityBanner;
  // Which curated `themes.ts` definition the `theme`/`header`/`footer`
  // fields were last bulk-applied from — null if never applied one.
  baseThemeId:    string | null;
}

export function apiGetStoreTheme(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.GET(storeId));
}

export function apiGetPublicStoreTheme(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData | null>>(ENDPOINTS.STORE_THEME.PUBLIC(storeId));
}

export function apiUpdateStoreThemeColors(storeId: string, payload: Partial<StorefrontColors> & { baseThemeId?: string | null }) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_THEME(storeId), payload);
}

export function apiUpdateStoreHeader(storeId: string, payload: Partial<Omit<StorefrontHeader, 'blocks'>> & { blocks?: Block[] }) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_HEADER(storeId), payload);
}

export function apiUpdateStoreFooter(storeId: string, blocks: Block[], footerStyle?: ThemeFooterStyle) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_FOOTER(storeId), { blocks, footerStyle });
}

export function apiUpdateIdentityBanner(storeId: string, payload: Partial<IdentityBanner>) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_IDENTITY_BANNER(storeId), payload);
}
