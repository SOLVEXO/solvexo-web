import { useCallback, useState } from 'react';
import {
  apiGetVerification,
  apiGetVerificationRequirements,
  apiPreviewVerificationRequirementsStandalone,
  apiUpdateVerification,
  apiAttachVerificationDocument,
  apiSubmitVerification,
  type SellerVerificationData,
  type VerificationRequirements,
  type UpdateVerificationPayload,
  type VerificationDocumentType,
  type BusinessType,
} from '@/api/services/storeVerification';

export function useStoreVerification(storeId: string | null | undefined) {
  const [data, setData] = useState<SellerVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(() => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    apiGetVerification(storeId)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load verification status.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  return { data, loading, error, refetch, setData };
}

/** Live "what would apply" preview — the backend, not the frontend, decides
 *  which fields/documents are required for a given country + business
 *  type. Call `preview()` whenever either changes, before anything is saved. */
export function useVerificationRequirementsPreview(storeId: string | null | undefined) {
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useCallback((params?: { country?: string; businessType?: BusinessType }) => {
    if (!storeId) return;
    setLoading(true);
    apiGetVerificationRequirements(storeId, params)
      .then(res => setRequirements(res.data))
      .catch(() => {}) // non-critical — the checklist just keeps its last known shape
      .finally(() => setLoading(false));
  }, [storeId]);

  return { requirements, loading, preview };
}

/** Same live preview, but for onboarding — no store exists yet at the point
 *  this is used (Business Info / Documents steps), so it can't be scoped by
 *  storeId the way `useVerificationRequirementsPreview` above is. */
export function useStandaloneRequirementsPreview() {
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useCallback((params?: { country?: string; businessType?: BusinessType }) => {
    setLoading(true);
    apiPreviewVerificationRequirementsStandalone(params)
      .then(res => setRequirements(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { requirements, loading, preview };
}

export function useVerificationActions(storeId: string | null | undefined) {
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<VerificationDocumentType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const save = useCallback(async (payload: UpdateVerificationPayload) => {
    if (!storeId) return false;
    setSaving(true);
    setError('');
    try {
      await apiUpdateVerification(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save verification details.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [storeId]);

  const attachDocument = useCallback(async (type: VerificationDocumentType, doc: { publicId: string; resourceType: string; fileName: string }) => {
    if (!storeId) return false;
    setUploadingType(type);
    setError('');
    try {
      await apiAttachVerificationDocument(storeId, type, doc);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save uploaded document.');
      return false;
    } finally {
      setUploadingType(null);
    }
  }, [storeId]);

  const submit = useCallback(async () => {
    if (!storeId) return false;
    setSubmitting(true);
    setError('');
    try {
      await apiSubmitVerification(storeId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [storeId]);

  return { save, attachDocument, submit, saving, uploadingType, submitting, error, setError };
}
