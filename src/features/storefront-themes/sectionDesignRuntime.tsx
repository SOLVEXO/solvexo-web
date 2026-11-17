import { useEffect, useState, type ReactNode } from 'react';
import { TokenStorage, isGuestUser } from '@/api/services/auth';
import { useStorefrontMarketOptional } from '@/features/storefront/storefrontMarket';
import { sectionAllowed, hasSectionRules } from './sectionRules';
import { sectionVideoUrl } from './sectionSpacing';

/** Runtime pieces of "Section design v2" shared by every theme's section renderer (the pure styling lives in
 *  `sectionSpacing.ts`, the visibility rules in `sectionRules.ts`). */

/** The section's looping background video (muted, no sound, hidden for reduced motion). Render it FIRST inside the wrapper. */
export function SectionVideoBg({ settings }: { settings: Record<string, unknown> | undefined }) {
  const url = sectionVideoUrl(settings);
  if (!url) return null;
  const overlay = typeof settings?.backgroundOverlay === 'number' ? Math.min(80, Math.max(0, settings.backgroundOverlay)) / 100 : 0;
  const poster = typeof settings?.backgroundImageUrl === 'string' && /^https:\/\//i.test(settings.backgroundImageUrl) ? settings.backgroundImageUrl : undefined;
  return (
    <>
      <video className="sx-vid-el" src={url} poster={poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
      {overlay > 0 && <div className="sx-vid-ov" style={{ background: `rgba(0,0,0,${overlay})` }} />}
    </>
  );
}

/** Renders its children only when the section's "Show when" rules allow this visitor (signed-in state, country,
 *  language, schedule). In the editor (`ignore`) everything shows so the seller can always edit it. */
export function SectionRulesGate({ settings, ignore, children }: { settings: Record<string, unknown> | undefined; ignore?: boolean; children: ReactNode }) {
  const market = useStorefrontMarketOptional();
  const scheduled = !!settings && (!!settings.showFrom || !!settings.showUntil);
  // the clock only matters for a schedule: re-check twice a minute so a section appears / disappears on time without a reload
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (ignore || !scheduled) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [ignore, scheduled]);
  if (ignore || !hasSectionRules(settings)) return <>{children}</>;
  const allowed = sectionAllowed(settings, {
    loggedIn: TokenStorage.isLoggedIn() && !isGuestUser(),
    country: market?.country ?? null,
    language: market?.language ?? null,
    now,
  });
  return allowed ? <>{children}</> : null;
}
