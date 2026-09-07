import { useEffect, useState } from 'react';
import { apiDetectCountry } from '@/api/services/auth';

/**
 * One-shot, fire-and-forget real IP-based country guess — used to
 * auto-select the Register form's phone dial code/flag so a visitor doesn't
 * have to hunt for their own country in a list. Fails open (stays `null`) on
 * any error/offline/local-dev-unrecognized-IP — the phone input's own
 * hardcoded fallback country takes over in that case, same convention as
 * every other IP-suggestion feature in this app (see `StorefrontLayout`'s
 * currency-suggestion effect).
 */
export function useDetectedCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiDetectCountry()
      .then((res) => { if (!cancelled) setCountry(res.data.country); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return country;
}
