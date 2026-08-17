import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// `faq.seo` is an embedded sub-document that may never have been set —
// `getSeo` returns `{}` in that case, so every field is optional here rather
// than mirroring the schema's non-null defaults.
export interface FaqSeoMeta {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  twitterCard?: 'summary' | 'summary_large_image' | string;
  canonicalUrlOverride?: string | null;
  noindex?: boolean;
  keywords?: string[];
  aiGenerated?: boolean;
  updatedAt?: string | null;
}

export interface UpdateSeoMetaPayload {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrlOverride?: string;
  noindex?: boolean;
  keywords?: string[];
}

export function apiGetFaqSeo(faqId: string) {
  return client.get<never, ApiResponse<FaqSeoMeta>>(ENDPOINTS.SEO.ADMIN.FAQ.GET_SEO(faqId));
}

/**
 * `FaqService.updateSeo` (src/faqs/faq.service.ts) already returns its own
 * `{ success: true, data: faq.seo }` envelope, which the SeoResponseInterceptor
 * then wraps a second time — unlike every other SEO admin endpoint, the
 * resolved `data` here is `{ success, data: FaqSeoMeta }`, not `FaqSeoMeta`
 * directly. Preserved as-is rather than "fixed" client-side since it's the
 * real response shape.
 */
export function apiUpdateFaqSeo(faqId: string, payload: UpdateSeoMetaPayload) {
  return client.patch<never, ApiResponse<{ success: boolean; data: FaqSeoMeta }>>(ENDPOINTS.SEO.ADMIN.FAQ.UPDATE_SEO(faqId), payload);
}
