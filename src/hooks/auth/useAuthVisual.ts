import { useEffect, useState } from 'react';
import { apiDetectCountry, type AuthPageContext } from '@/api/services/auth';

/**
 * Real, region-AND-page-appropriate background photo for the shared
 * auth-screen panel (`AuthSplitLayout`) — a visitor's IP-detected country
 * resolves to one of a handful of curated regions, each with 3 distinct real
 * photos (one per `context`: register/login/onboarding), so the same
 * visitor sees a genuinely different photo across the 3 screens instead of
 * one identical image everywhere. `imageUrl` starts `null` (renders nothing
 * extra until resolved), so a slow/failed lookup never shows a broken image,
 * just the panel's existing gradient as before this feature existed.
 */
export function useAuthVisual(context: AuthPageContext): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiDetectCountry(context)
      .then((res) => { if (!cancelled) setImageUrl(res.data.imageUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [context]);

  return imageUrl;
}
