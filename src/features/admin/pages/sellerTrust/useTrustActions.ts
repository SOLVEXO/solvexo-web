import { useCallback, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiTrustPayoutHold, apiTrustRemind } from '@/api/services/admin/adminSellerTrust';

const msg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Reminder + payout-hold actions shared by the client Business profile tab and the Seller trust review. */
export function useTrustActions(onChanged: () => void) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const remind = useCallback(async (storeId: string) => {
    setBusy(`remind:${storeId}`);
    try {
      const r = await apiTrustRemind({ storeIds: [storeId] });
      if (r.data?.sent) toast.success('Reminder sent by email and in-app notification.');
      else toast.info('No reminder sent: the store is verified or was already reminded in the last 24 hours.');
      onChanged();
    } catch (e) {
      toast.error(msg(e, 'Could not send the reminder.'));
    } finally {
      setBusy(null);
    }
  }, [toast, onChanged]);

  const setHold = useCallback(async (storeId: string, active: boolean, reason?: string) => {
    setBusy(`hold:${storeId}`);
    try {
      await apiTrustPayoutHold(storeId, active, reason || undefined);
      toast.success(active ? 'Payouts are on hold for this store.' : 'Payout hold released.');
      onChanged();
      return true;
    } catch (e) {
      toast.error(msg(e, 'Could not change the payout hold.'));
      return false;
    } finally {
      setBusy(null);
    }
  }, [toast, onChanged]);

  return { remind, setHold, busy };
}
