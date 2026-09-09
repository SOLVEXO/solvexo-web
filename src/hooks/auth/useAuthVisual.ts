import { useEffect, useState } from 'react';
import { apiDetectCountry, type AuthPageContext } from '@/api/services/auth';

export interface AuthVisual {
  imageUrl: string | null;
  attribution: { name: string; profileUrl: string } | null;
}

const EMPTY_VISUAL: AuthVisual = { imageUrl: null, attribution: null };

/**
 * Real, LIVE, country-AND-page-appropriate background photo for the shared
 * auth-screen panel (`AuthSplitLayout`) — resolved server-side per request
 * via `AuthVisualService`'s Unsplash lookup, keyed off the visitor's actual
 * detected country name + `context` (register/login/onboarding/etc.), so
 * the same visitor sees a genuinely country-specific photo that also
 * differs across the auth screens instead of one fixed image everywhere.
 * `imageUrl` starts `null` (renders nothing extra until resolved), so a
 * slow/failed lookup never shows a broken image, just the panel's existing
 * gradient as before this feature existed.
 */
export function useAuthVisual(context: AuthPageContext): AuthVisual {
  const [visual, setVisual] = useState<AuthVisual>(EMPTY_VISUAL);

  useEffect(() => {
    let cancelled = false;
    apiDetectCountry(context)
      .then((res) => {
        if (cancelled) return;
        setVisual({ imageUrl: res.data.imageUrl, attribution: res.data.attribution });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [context]);

  return visual;
}
