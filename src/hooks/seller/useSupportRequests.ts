import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { apiListSupportRequests, type SupportRequest, type SupportTier } from '@/api/services/support';

const PAGE_SIZE = 10;

/** The store's own help requests (newest first), with loading / error + retry and paging. */
export function useSupportRequests(storeId: string) {
  const [items, setItems] = useState<SupportRequest[] | null>(null);
  const [tier, setTier] = useState<SupportTier>('standard');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    apiListSupportRequests(storeId, { page, limit: PAGE_SIZE })
      .then(res => {
        if (!live) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTier(res.tier ?? 'standard');
        setError('');
      })
      .catch(err => { if (live) { setItems([]); setError(errorMessage(err, 'Could not load your requests.')); } });
    return () => { live = false; };
  }, [storeId, page, tick]);

  const reload = useCallback(() => { setItems(null); setError(''); setTick(t => t + 1); }, []);
  const goToPage = useCallback((p: number) => { setItems(null); setPage(p); }, []);

  return { items, tier, page, total, pageSize: PAGE_SIZE, error, loading: items === null, reload, goToPage };
}
