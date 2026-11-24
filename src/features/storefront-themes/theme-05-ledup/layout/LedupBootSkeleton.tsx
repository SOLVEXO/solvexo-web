import type { CSSProperties } from 'react';
import { bootPalette, type BootSkeletonProps } from '../../core/bootPalette';

/** Ledup's own first-paint placeholder: the floating pill menu over a full-bleed hero with the soft 50px bottom corners. */
export function LedupBootSkeleton({ theme }: BootSkeletonProps) {
  const p = bootPalette(theme, { bg: '#FAFAFA', ink: '#4B423B', accent: '#4B423B' });
  const bar = (w: number, h = 12): CSSProperties => ({ width: w, height: h, borderRadius: 999, background: p.line });
  return (
    <div aria-busy="true" className="animate-pulse" style={{ minHeight: '100vh', background: p.bg, position: 'relative' }}>
      <div style={{ height: 'min(100svh, 760px)', background: p.block, borderRadius: '0 0 50px 50px' }} />
      <div style={{ position: 'absolute', top: 24, left: 'clamp(12px, 4vw, 75px)', right: 'clamp(12px, 4vw, 75px)', height: 56, borderRadius: 999, background: p.bg, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px' }}>
        <div style={bar(104, 20)} />
        <div className="hidden md:flex" style={{ gap: 18, flex: 1, justifyContent: 'center' }}>
          {[64, 80, 56, 72].map((w, i) => <div key={i} style={bar(w, 10)} />)}
        </div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 10 }}>
          <div style={bar(34, 34)} /><div style={bar(34, 34)} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 'clamp(16px, 5vw, 75px)', bottom: 'clamp(32px, 8vw, 96px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ ...bar(360, 40), maxWidth: '80vw', background: p.bg, opacity: 0.55 }} />
        <div style={{ ...bar(220, 14), background: p.bg, opacity: 0.55 }} />
      </div>
    </div>
  );
}
