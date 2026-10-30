import { useState } from 'react';
import { apiMyInvoices, apiMyProofUrl, apiSubmitProof, type RenewalInvoice } from '@/api/services/memberships';
import { errorMessage } from '@/api/errorMessage';
import { useLoad } from './pageHooks';

export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

/** Headless logic of the "Payments due" section (every theme draws its own UI on top). */
export function useRenewalInvoices(storeId: string) {
  const { data, loading, error, retry } = useLoad<RenewalInvoice[]>(() => apiMyInvoices(storeId), [storeId]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ id: string; message: string } | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  /** Validates in the browser (the server checks again), uploads, then reloads. Returns true on success. */
  async function submit(invoiceId: string, f: { file: File | null; reference: string; senderName: string }, messages: { missing: string; type: string; size: string }): Promise<boolean> {
    setFormError(null);
    if (!f.file && !f.reference.trim()) { setFormError({ id: invoiceId, message: messages.missing }); return false; }
    if (f.file && !RECEIPT_TYPES.includes(f.file.type)) { setFormError({ id: invoiceId, message: messages.type }); return false; }
    if (f.file && f.file.size > RECEIPT_MAX_BYTES) { setFormError({ id: invoiceId, message: messages.size }); return false; }
    setBusyId(invoiceId);
    try {
      await apiSubmitProof(storeId, invoiceId, { file: f.file, reference: f.reference.trim(), senderName: f.senderName.trim() });
      setSentId(invoiceId);
      retry();
      return true;
    } catch (e) {
      setFormError({ id: invoiceId, message: errorMessage(e) });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function openReceipt(invoiceId: string) {
    try { window.open((await apiMyProofUrl(storeId, invoiceId)).url, '_blank', 'noopener'); } catch (e) { setFormError({ id: invoiceId, message: errorMessage(e) }); }
  }

  return { invoices: data ?? [], loading, loadFailed: error, retry, submit, openReceipt, busyId, formError, sentId };
}
