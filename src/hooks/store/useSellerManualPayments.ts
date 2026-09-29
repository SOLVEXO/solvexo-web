import { useState, useEffect, useCallback } from 'react';
import {
  apiSellerListManualPayments, apiSellerApproveManualPayment, apiSellerRejectManualPayment,
  type SellerManualPaymentProof, type ManualPaymentProofStatus,
} from '@/api/services/manualPayment';

export function useSellerManualPayments(storeId: string, status?: ManualPaymentProofStatus) {
  const [proofs,  setProofs]  = useState<SellerManualPaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    if (!storeId) return Promise.resolve();
    setLoading(true);
    return apiSellerListManualPayments(storeId, status)
      .then(res => setProofs(res.data.proofs ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load payment proofs.'))
      .finally(() => setLoading(false));
  }, [storeId, status]);

  useEffect(() => { refetch(); }, [refetch]);

  return { proofs, loading, error, refetch };
}

export function useApproveManualPayment(storeId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const approve = useCallback(async (proofId: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiSellerApproveManualPayment(storeId, proofId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payment.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [storeId]);

  return { approve, submitting, error };
}

export function useRejectManualPayment(storeId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reject = useCallback(async (proofId: string, reason: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiSellerRejectManualPayment(storeId, proofId, reason);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payment.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [storeId]);

  return { reject, submitting, error };
}
