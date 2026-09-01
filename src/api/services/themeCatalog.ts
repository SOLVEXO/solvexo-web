import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Section } from './storefrontTypes';
import type { StorefrontColors, StorefrontHeader, StorefrontFooter, IdentityBanner } from './storeTheme';
import type { StoreThemeData } from './storeTheme';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Mirrors `THEME_CATALOG_CATEGORIES` in the backend's
// `theme-catalog/schemas/theme-definition.schema.ts` exactly.
export const THEME_CATALOG_CATEGORIES = [
  'fashion', 'beauty', 'electronics', 'jewelry', 'furniture', 'food',
  'restaurant', 'education', 'digital_products', 'services', 'general',
] as const;
export type ThemeCatalogCategory = (typeof THEME_CATALOG_CATEGORIES)[number];

export const THEME_CATALOG_CATEGORY_LABELS: Record<ThemeCatalogCategory, string> = {
  fashion: 'Fashion', beauty: 'Beauty', electronics: 'Electronics', jewelry: 'Jewelry',
  furniture: 'Furniture', food: 'Food', restaurant: 'Restaurant', education: 'Education',
  digital_products: 'Digital Products', services: 'Services', general: 'General',
};

export type ThemeCatalogStatus = 'draft' | 'published' | 'archived';
export type ThemeCatalogTier = 'free' | 'premium';

/** One global, admin-managed theme in the marketplace — a seller never
 *  mutates this directly; "Use Theme" copies its fields into the seller's
 *  own `StoreTheme`/home `StorePage` (see `apiApplyThemeDefinition`). */
export interface ThemeDefinition {
  _id:         string;
  slug:        string;
  name:        string;
  description: string;
  category:    ThemeCatalogCategory;
  tags:        string[];
  version:     number;
  thumbnail:   string | null;
  screenshots: string[];
  status:      ThemeCatalogStatus;
  featured:    boolean;
  tier:        ThemeCatalogTier;
  badge:       'new' | 'popular' | 'trending' | null;
  theme:           StorefrontColors;
  header:          StorefrontHeader;
  footer:          StorefrontFooter;
  identityBanner:  IdentityBanner;
  /** The home-page composition seeded on apply — what makes this theme
   *  structurally distinct (section choice/order/copy), not just a
   *  color/style recolor. Omitted from the list endpoint (list cards don't
   *  need it), present on the single-theme fetch. */
  homePageSections?: Section[];
  viewCount:   number;
  applyCount:  number;
}

export interface ListThemeCatalogParams {
  category?: ThemeCatalogCategory;
  tier?:     ThemeCatalogTier;
  search?:   string;
  featured?: boolean;
}

// ── Public / seller browsing ──────────────────────────────────────────────

export function apiListThemeCatalog(params: ListThemeCatalogParams = {}) {
  return client.get<never, ApiResponse<ThemeDefinition[]>>(ENDPOINTS.THEME_CATALOG.PUBLIC_LIST(), { params });
}

export function apiGetThemeCatalogBySlug(slug: string) {
  return client.get<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.PUBLIC_GET(slug));
}

/** Theme Marketplace "Use Theme" — stages the theme's colors/header/footer/
 *  identity-banner and home-page sections into the store's DRAFT only.
 *  Nothing on the live storefront changes until the seller reviews it in
 *  Store Builder and publishes (same as any other draft edit). */
export function apiApplyThemeDefinition(storeId: string, themeDefinitionId: string) {
  return client.post<never, ApiResponse<StoreThemeData>>(ENDPOINTS.STORE_THEME.APPLY(storeId, themeDefinitionId));
}

// ── Admin management ───────────────────────────────────────────────────────

export interface AdminListThemeCatalogParams {
  category?: ThemeCatalogCategory;
  status?:   ThemeCatalogStatus;
  search?:   string;
}

export function apiAdminListThemeCatalog(params: AdminListThemeCatalogParams = {}) {
  return client.get<never, ApiResponse<ThemeDefinition[]>>(ENDPOINTS.THEME_CATALOG.ADMIN_LIST(), { params });
}

export function apiAdminGetThemeCatalog(id: string) {
  return client.get<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.ADMIN_GET(id));
}

export type CreateThemeDefinitionPayload = Partial<Omit<ThemeDefinition, '_id' | 'version' | 'status' | 'viewCount' | 'applyCount'>> & {
  slug: string;
  name: string;
  category: ThemeCatalogCategory;
};

export function apiAdminCreateThemeCatalog(payload: CreateThemeDefinitionPayload) {
  return client.post<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.ADMIN_CREATE(), payload);
}

export function apiAdminUpdateThemeCatalog(id: string, payload: Partial<CreateThemeDefinitionPayload>) {
  return client.patch<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.ADMIN_UPDATE(id), payload);
}

export function apiAdminSetThemeCatalogStatus(id: string, status: ThemeCatalogStatus) {
  return client.patch<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.ADMIN_SET_STATUS(id), { status });
}

export function apiAdminSetThemeCatalogFeatured(id: string, featured: boolean) {
  return client.patch<never, ApiResponse<ThemeDefinition>>(ENDPOINTS.THEME_CATALOG.ADMIN_SET_FEATURED(id), { featured });
}
