import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — mirrors `ResolvedSeoMeta` in
// `solvexo-api/src/seo/services/seo-resolution.service.ts`. This endpoint is
// one of the SEO module's 4 public delivery controllers, which return the
// raw object directly (no `{ success, data }` envelope) — see that
// controller file's own doc comment / `SeoResponseInterceptor`.
// ─────────────────────────────────────────────────────────────────────────────
export type SeoEntityType = 'product' | 'category' | 'store';

export interface ResolvedSeoMeta {
  entityType:   SeoEntityType;
  entityId:     string;
  url:          string;
  title:        string;
  description:  string;
  canonicalUrl: string;
  noindex:      boolean;
  ogTitle:      string;
  ogDescription:string;
  ogImage:      string | null;
  twitterCard:  string;
  jsonLd:       Record<string, unknown>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (storefront) — real per-page SEO, used by `useStorefrontSeo`
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetSeoMeta(entityType: SeoEntityType, entityId: string) {
  return client.get<never, ResolvedSeoMeta>(ENDPOINTS.SEO.PUBLIC.GET_META(entityType, entityId));
}
