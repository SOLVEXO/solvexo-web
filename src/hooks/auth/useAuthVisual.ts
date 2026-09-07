import { useEffect, useState } from 'react';
import { apiDetectCountry } from '@/api/services/auth';

/**
 * Real, region-appropriate background photo for the shared auth-screen panel
 * (`AuthSplitLayout`, used by Register/Login/Onboarding/etc.) — a visitor's
 * IP-detected country resolves to one of a handful of curated regions, each
 * with its own real photo; anything unmapped (or undetected) falls back to
 * one universal default. `imageUrl` starts `null` (renders nothing extra
 * until resolved) and only ever gets set to a real, loadable URL — never a
 * broken/empty state, matching this app's fail-open convention for every
 * other IP-suggestion feature.
 */
export function useAuthVisual(): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiDetectCountry()
      .then((res) => { if (!cancelled) setImageUrl(res.data.imageUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return imageUrl;
}
