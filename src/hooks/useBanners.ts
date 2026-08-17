import { useState, useEffect } from 'react';
import { apiGetBanners, type Banner, type PromotionPlacement } from '@/api/services/banner';

/** `placement` scopes to that hero only — omitting it falls back to the
 *  historical unscoped (all-active, any placement) behavior. Every page-level
 *  call site should pass its own placement; the unscoped fallback otherwise
 *  leaks banners meant for other placements (e.g. a `categoryHero` banner
 *  showing up on the Marketplace hero) onto pages that don't ask for one. */
export function useBanners(placement?: PromotionPlacement) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetBanners(placement)
      .then(res => { if (!cancelled) setBanners(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [placement]);

  return { banners, loading };
}
