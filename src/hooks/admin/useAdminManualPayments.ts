import { useState, useEffect, useCallback } from 'react';
import {
  apiAdminListManualPayments, apiAdminApproveManualPayment, apiAdminRejectManualPayment,
  type AdminManualPaymentProof, type ManualPaymentProofStatus,
} from '@/api/services/manualPayment';

export function useAdminManualPayments(status?: ManualPaymentProofStatus) {
  const [proofs,  setProofs]  = useState<AdminManualPaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiAdminListManualPayments(status)
      .then(res => setProofs(res.data.proofs ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load manual payments.'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { refetch(); }, [refetch]);

  return { proofs, loading, error, refetch };
}

export function useApproveManualPayment() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const approve = useCallback(async (proofId: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiAdminApproveManualPayment(proofId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payment.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { approve, submitting, error };
}

export function useRejectManualPayment() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reject = useCallback(async (proofId: string, reason: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiAdminRejectManualPayment(proofId, reason);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payment.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { reject, submitting, error };
}
