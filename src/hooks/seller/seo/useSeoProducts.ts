import { useCallback, useState } from 'react';
import {
  apiSeoProductsList,
  apiSeoProductGetById,
  apiUpdateSeoProduct,
  apiBulkApplySeoProductTemplate,
  apiExportSeoProducts,
  type SeoProductsListParams,
  type UpdateSeoMetaDto,
  type BulkApplyProductTemplateDto,
} from '@/api/services/seo/seller/products.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoProducts(storeId: string, params: SeoProductsListParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & SeoProductsListParams) => apiSeoProductsList(p.storeId, p),
    { storeId, ...params },
  );
}

export function useSeoProduct(storeId: string, productId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string; productId: string }) => apiSeoProductGetById(p.storeId, p.productId),
    { storeId, productId },
  );
}

export function useUpdateSeoProduct() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateProduct = useCallback(async (storeId: string, productId: string, payload: UpdateSeoMetaDto) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoProduct(storeId, productId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product SEO.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateProduct, submitting, error };
}

export function useSeoProductBulkActions() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const bulkApplyTemplate = useCallback(async (storeId: string, payload: BulkApplyProductTemplateDto) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiBulkApplySeoProductTemplate(storeId, payload);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply bulk SEO template.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const exportCsv = useCallback(async (storeId: string, params: SeoProductsListParams = {}) => {
    setSubmitting(true);
    setError('');
    try {
      await apiExportSeoProducts(storeId, params);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export product SEO CSV.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { bulkApplyTemplate, exportCsv, submitting, error };
}
