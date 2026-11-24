import type { CSSProperties } from 'react';
import { bootPalette, type BootSkeletonProps } from '../../core/bootPalette';

/** Maison's own first-paint placeholder: its header (logo left, pill menu, icons) and a big rounded hero, in the store's colours. */
export function FashionBootSkeleton({ theme }: BootSkeletonProps) {
  const p = bootPalette(theme, { bg: '#FAFAFA', ink: '#09090B', accent: '#09090B' });
  const bar = (w: number, h = 12, r = 999): CSSProperties => ({ width: w, height: h, borderRadius: r, background: p.block });
  return (
    <div aria-busy="true" className="animate-pulse" style={{ minHeight: '100vh', background: p.bg }}>
      <div style={{ height: 72, display: 'flex', alignItems: 'center', gap: 28, padding: '0 clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${p.line}` }}>
        <div style={bar(112, 22, 8)} />
        <div className="hidden md:flex" style={{ gap: 14, flex: 1, justifyContent: 'center' }}>
          {[56, 72, 64, 48].map((w, i) => <div key={i} style={bar(w)} />)}
        </div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 10 }}>
          {[0, 1, 2].map(i => <div key={i} style={bar(34, 34)} />)}
        </div>
      </div>
      <div style={{ padding: 'clamp(12px, 2vw, 24px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ height: 'min(70vh, 560px)', borderRadius: 28, background: p.block, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, padding: 'clamp(20px, 4vw, 48px)' }}>
          <div style={{ ...bar(280, 36, 10), background: p.line, maxWidth: '70%' }} />
          <div style={{ ...bar(180, 14), background: p.line }} />
          <div style={{ ...bar(132, 44), background: p.line }} />
        </div>
      </div>
    </div>
  );
}
