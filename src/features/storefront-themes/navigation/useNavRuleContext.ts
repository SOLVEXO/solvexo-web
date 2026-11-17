import { useEffect, useMemo, useState } from 'react';
import { TokenStorage, isGuestUser } from '@/api/services/auth';
import { useStorefrontMarketOptional } from '@/features/storefront/storefrontMarket';
import type { SectionRuleContext } from '../sectionRules';

/** Who is looking, for the show-when rules of navigation items (signed-in state, country, language, the clock). `active` = some
 *  item has a schedule: only then does the clock tick (once a minute), so a plain menu never re-renders for it. */
export function useNavRuleContext(active = false): SectionRuleContext {
  const market = useStorefrontMarketOptional();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [active]);
  const loggedIn = TokenStorage.isLoggedIn() && !isGuestUser();
  const country = market?.country ?? null;
  const language = market?.language ?? null;
  return useMemo(() => ({ loggedIn, country, language, now }), [loggedIn, country, language, now]);
}
