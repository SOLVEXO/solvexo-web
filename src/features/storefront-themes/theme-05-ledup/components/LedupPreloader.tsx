import { useEffect, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ledupTheme as t } from '../theme.config';

const SEEN_KEY = 'ledup:preloader';

/** Intro screen (like ledup.pt's): the logo on a dark ground, then a fade away. The seller picks when it shows, the background, the logo (link, store logo or name), the logo colour, the animation and how long it stays (Theme settings > Effects). */
export function LedupPreloader() {
  const { store, theme } = useStorefront();
  const cfg = t.preloader;
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>(() => {
    try {
      if (cfg.mode === 'hide') return 'gone';
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'gone';
      if (cfg.mode === 'once' && sessionStorage.getItem(SEEN_KEY)) return 'gone';
    } catch { /* storage blocked: just show it */ }
    return 'show';
  });

  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    const ms = Math.round(cfg.seconds * 1000);
    const a = window.setTimeout(() => setPhase('leaving'), ms);
    const b = window.setTimeout(() => setPhase('gone'), ms + 550);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [phase, cfg.seconds]);

  if (phase === 'gone') return null;
  const header = theme?.header;
  const storeLogo = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;
  const logoUrl = cfg.logo || storeLogo;

  return (
    <div className={`ld-preloader ${phase === 'leaving' ? 'is-leaving' : ''}`} style={{ background: cfg.bg }} role="status" aria-label={store.name}>
      {cfg.video && <video src={cfg.video} autoPlay muted loop playsInline aria-hidden className="absolute inset-0 h-full w-full object-cover" />}
      <div className={`ld-preloader-mark ${cfg.style === 'pulse' ? 'is-pulse' : ''}`}>
        {cfg.video ? null : logoUrl
          ? <img src={logoUrl} alt="" className="mx-auto max-h-[38vh] max-w-[min(70vw,520px)] object-contain" style={cfg.tone === 'light' ? { filter: 'brightness(0) invert(1)', opacity: 0.85 } : undefined} />
          : <span className="text-3xl font-light tracking-tight">{store.name}</span>}
      </div>
      {cfg.style === 'bar' && <div className="ld-preloader-bar" aria-hidden><span style={{ animationDuration: `${cfg.seconds}s` }} /></div>}
    </div>
  );
}
