import { useState, useEffect } from 'react';
import { apiGetPublicStoreBanners, type StoreBanner } from '@/api/services/storeBanner';

export function useStoreBanners(storeId: string | undefined) {
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setBanners([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiGetPublicStoreBanners(storeId)
      .then(res => { if (!cancelled) setBanners(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId]);

  return { banners, loading };
}
