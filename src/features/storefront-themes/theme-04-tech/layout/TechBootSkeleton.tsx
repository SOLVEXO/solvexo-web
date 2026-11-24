import type { CSSProperties } from 'react';
import { bootPalette, type BootSkeletonProps } from '../../core/bootPalette';

/** Tech Store's own first-paint placeholder: a slim top strip, a two-row header with a wide search box, and a split hero. */
export function TechBootSkeleton({ theme }: BootSkeletonProps) {
  const p = bootPalette(theme, { bg: '#FFFFFF', ink: '#020203', accent: '#0156FF' });
  const bar = (w: number | string, h: number | string = 12, r = 6): CSSProperties => ({ width: w, height: h, borderRadius: r, background: p.block });
  return (
    <div aria-busy="true" className="animate-pulse" style={{ minHeight: '100vh', background: p.bg }}>
      <div style={{ height: 32, background: p.accent, opacity: 0.9 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 76, padding: '0 clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${p.line}` }}>
        <div style={bar(120, 26, 6)} />
        <div className="hidden md:block" style={{ ...bar('100%', 44, 999), flex: 1, maxWidth: 560 }} />
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 10 }}>
          {[0, 1, 2].map(i => <div key={i} style={bar(36, 36, 999)} />)}
        </div>
      </div>
      <div className="hidden md:flex" style={{ gap: 18, height: 44, alignItems: 'center', padding: '0 clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${p.line}` }}>
        {[70, 90, 64, 80, 72, 56].map((w, i) => <div key={i} style={bar(w, 10)} />)}
      </div>
      <div style={{ display: 'grid', gap: 16, padding: 'clamp(12px, 2vw, 24px) clamp(16px, 4vw, 40px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
        <div style={bar('100%', 'min(50vh, 420px)', 12)} />
        <div style={{ ...bar('100%', 'min(50vh, 420px)', 12), opacity: 0.6 }} />
      </div>
    </div>
  );
}
