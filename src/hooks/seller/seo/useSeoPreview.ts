import { apiPreviewSeoSchema, apiPreviewSeoSocial, type SeoPreviewEntityType } from '@/api/services/seo/seller/preview.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoSchemaPreview(storeId: string, entityType: SeoPreviewEntityType, entityId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string; entityType: SeoPreviewEntityType; entityId: string }) =>
      apiPreviewSeoSchema(p.storeId, p.entityType, p.entityId),
    { storeId, entityType, entityId },
  );
}

export function useSeoSocialPreview(storeId: string, entityType: SeoPreviewEntityType, entityId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string; entityType: SeoPreviewEntityType; entityId: string }) =>
      apiPreviewSeoSocial(p.storeId, p.entityType, p.entityId),
    { storeId, entityType, entityId },
  );
}
