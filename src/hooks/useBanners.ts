import { useState, useEffect } from 'react';
import { apiGetBanners, type Banner } from '@/api/services/banner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetBanners()
      .then(res => { if (!cancelled) setBanners(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { banners, loading };
}
