import { useCallback, useState } from 'react';
import {
  apiGetVerification,
  apiUpdateVerification,
  apiAttachVerificationDocument,
  apiSubmitVerification,
  type SellerVerificationData,
  type UpdateVerificationPayload,
  type VerificationDocumentType,
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
