import client from '../client';

// ── Types — mirror solvexo-api `src/merchandising` ──────────────────────────────────────────────────────────

export interface BundleComponentInput { productId: string; variantId: string; quantity: number }
export interface BundleView {
  isBundle: boolean;
  components: { productId: string; variantId: string; quantity: number; name: string; image: string | null; available: boolean }[];
  /** Whole bundles that can be sold now (min over components); null = unlimited. */
  available: number | null;
  /** Sum of component prices × qty (display only). */
  compareAtPrice: number | null;
}
export interface PreorderSettings { enabled: boolean; expectedDate: string | null; limit: number | null; message: string | null; sold?: number }
export interface RecommendationCard { id: string; slug: string | null; name: string; image: string | null; price: number; compareAtPrice: number | null; source: 'manual' | 'auto' }
export interface RecommendationsView {
  related: { id: string; name: string; image: string | null }[];
  complementary: { id: string; name: string; image: string | null }[];
  autoPreview: RecommendationCard[];
}
export interface CartUpsellSettings { enabled: boolean; title: string; maxItems: number; mode: 'complementary' | 'related' | 'best_sellers' }
export interface PreorderRow { variantId: string; productId: string; productName: string; sku: string; preorder: PreorderSettings; onHand: number; reserved: number }

interface ApiResponse<T> { success: boolean; message?: string; data: T }
const base = (storeId: string) => `/api/merchandising/${storeId}`;

export const apiGetBundle = (storeId: string, productId: string) => client.get<never, ApiResponse<BundleView>>(`${base(storeId)}/bundle/${productId}`);
export const apiSetBundle = (storeId: string, productId: string, components: BundleComponentInput[]) => client.put<never, ApiResponse<BundleView>>(`${base(storeId)}/bundle/${productId}`, { components });
export const apiRemoveBundle = (storeId: string, productId: string) => client.delete<never, ApiResponse<null>>(`${base(storeId)}/bundle/${productId}`);
export const apiSetPreorder = (storeId: string, variantId: string, preorder: PreorderSettings | null) => client.put<never, ApiResponse<{ preorder: PreorderSettings | null }>>(`${base(storeId)}/preorder/${variantId}`, { preorder });
export const apiListPreorders = (storeId: string) => client.get<never, ApiResponse<PreorderRow[]>>(`${base(storeId)}/preorders`);
export const apiGetRecommendations = (storeId: string, productId: string) => client.get<never, ApiResponse<RecommendationsView>>(`${base(storeId)}/recommendations/${productId}`);
export const apiSetRecommendations = (storeId: string, productId: string, body: { relatedProductIds?: string[]; complementaryProductIds?: string[] }) => client.put<never, ApiResponse<RecommendationsView>>(`${base(storeId)}/recommendations/${productId}`, body);
export const apiGetCartUpsell = (storeId: string) => client.get<never, ApiResponse<CartUpsellSettings>>(`${base(storeId)}/cart-upsell`);
export const apiSetCartUpsell = (storeId: string, body: Partial<CartUpsellSettings>) => client.put<never, ApiResponse<CartUpsellSettings>>(`${base(storeId)}/cart-upsell`, body);

/** Public storefront: recommendations for a product (manual picks first, then automatic fallback). */
export const apiPublicRecommendations = (storeId: string, productId: string, excludeIds: string[] = [], limit = 6) =>
  client.get<never, ApiResponse<{ items: RecommendationCard[] }>>(`/api/public/merchandising/${storeId}/recommendations/${productId}`, { params: { limit, exclude: excludeIds.join(',') } });
/** Public storefront: cart upsell suggestions; `items` is empty when the store has it switched off. */
export const apiPublicCartUpsell = (storeId: string, productIds: string[]) =>
  client.post<never, ApiResponse<{ enabled: boolean; title: string; items: RecommendationCard[] }>>(`/api/public/merchandising/${storeId}/cart-upsell`, { productIds });
