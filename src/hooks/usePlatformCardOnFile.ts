import { useCallback, useEffect, useState } from 'react';
import { apiGetOnboardingProgress } from '@/api/services/platformPlans';

/** Whether the seller already has a card saved for their Solvexo plan/add-ons —
 *  `null` while loading. `refresh()` re-reads it after a card is added. */
export function usePlatformCardOnFile() {
  const [cardOnFile, setCardOnFile] = useState<boolean | null>(null);
  const refresh = useCallback(() => {
    apiGetOnboardingProgress()
      .then(res => setCardOnFile(!!res.data.hasPlatformPaymentMethod))
      .catch(() => setCardOnFile(false));
  }, []);
  useEffect(refresh, [refresh]);
  return { cardOnFile, refresh };
}
