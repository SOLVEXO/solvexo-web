import { useEffect, useState } from 'react';

/**
 * True while `query` matches. SSR-safe: the server (and the first browser frame)
 * answer `false`, then the real value is applied — so a phone never gets a
 * desktop-only height baked into the server HTML.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.(query).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}