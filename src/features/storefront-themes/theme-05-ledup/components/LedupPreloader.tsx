import { useEffect, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ledupTheme as t } from '../theme.config';

const SEEN_KEY = 'ledup:preloader';

/** Black intro screen (like ledup.pt's): the store logo fades in, a thin bar fills, then the screen fades away. Shown once per browser tab, never for reduced-motion visitors, and the seller can switch it off in Theme settings. */
export function LedupPreloader() {
  const { store, theme } = useStorefront();
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>(() => {
    try {
      if (!t.preloader) return 'gone';
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'gone';
      if (sessionStorage.getItem(SEEN_KEY)) return 'gone';
    } catch { /* storage blocked: just show it */ }
    return 'show';
  });

  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    const a = window.setTimeout(() => setPhase('leaving'), 1300);
    const b = window.setTimeout(() => setPhase('gone'), 1850);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [phase]);

  if (phase === 'gone') return null;
  const header = theme?.header;
  const logoUrl = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;

  return (
    <div className={`ld-preloader ${phase === 'leaving' ? 'is-leaving' : ''}`} role="status" aria-label={store.name}>
      <div className="ld-preloader-mark">
        {logoUrl
          ? <img src={logoUrl} alt="" className="mx-auto max-h-16 max-w-[220px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          : <span className="text-3xl font-light tracking-tight">{store.name}</span>}
      </div>
      <div className="ld-preloader-bar" aria-hidden />
    </div>
  );
}
