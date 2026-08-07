import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Block } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface StorefrontColors {
  primaryColor: string;
  bgColor:      string;
  textColor:    string;
  accentColor:  string;
  font:         string;
}

export interface StorefrontHeader {
  logoSource:    'store' | 'custom';
  customLogoUrl: string | null;
  blocks:        Block[]; // nav_link blocks
}

export interface StorefrontFooter {
  blocks: Block[]; // footer_column / social_link / copyright_text blocks
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
}

export function apiGetStoreTheme(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.GET(storeId));
}

export function apiGetPublicStoreTheme(storeId: string) {
  return client.get<never, ApiResponse<StoreThemeData | null>>(ENDPOINTS.STORE_THEME.PUBLIC(storeId));
}

export function apiUpdateStoreThemeColors(storeId: string, payload: Partial<StorefrontColors>) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_THEME(storeId), payload);
}

export function apiUpdateStoreHeader(storeId: string, payload: { logoSource?: 'store' | 'custom'; customLogoUrl?: string | null; blocks?: Block[] }) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_HEADER(storeId), payload);
}

export function apiUpdateStoreFooter(storeId: string, blocks: Block[]) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_FOOTER(storeId), { blocks });
}

export function apiUpdateIdentityBanner(storeId: string, payload: Partial<IdentityBanner>) {
  return client.patch<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.UPDATE_IDENTITY_BANNER(storeId), payload);
}
