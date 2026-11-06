import type { CSSProperties, ReactNode } from 'react';
import { techTheme as t } from '../theme.config';

/** Tech's content box: a bordered panel with a blue top rule and a soft title bar (Tech pages use these instead of Maison's rounded cards). */
export function TechPanel({ title, action, children, flush = false, tone = 'line', style }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean; tone?: 'line' | 'soft'; style?: CSSProperties;
}) {
  return (
    <section className="overflow-hidden" style={{
      border: `1px solid ${t.colors.border}`, borderTop: `3px solid ${t.colors.accent}`, borderRadius: t.cardRadiusPx,
      background: tone === 'soft' ? t.colors.bgAlt : t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, ...style,
    }}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3" style={{ background: tone === 'soft' ? 'transparent' : t.colors.bgAlt, borderBottom: `1px solid ${t.colors.border}` }}>
          {title && <h2 className="m-0 text-xs font-bold uppercase" style={{ letterSpacing: '.07em' }}>{title}</h2>}
          {action}
        </header>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

/** Row of labelled facts (order number, date, status...) divided by thin rules. */
export function TechFactStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 grid overflow-hidden" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', border: `1px solid ${t.colors.border}`, borderRadius: t.cardRadiusPx, background: t.colors.bgAlt }}>
      {items.map((it, i) => (
        <div key={it.label} className="px-5 py-4" style={{ borderInlineStart: i === 0 ? 'none' : `1px solid ${t.colors.border}` }}>
          <dt className="text-[11px] font-semibold uppercase" style={{ color: t.colors.inkMuted, letterSpacing: '.07em' }}>{it.label}</dt>
          <dd className="m-0 mt-1 text-[15px] font-semibold">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** List-item box: bordered, with a blue rule on the start edge (soft = plain tinted panel). Used for rows in Tech's account lists. */
export function TechCard({ children, tone = 'line', className = '', style }: { children: ReactNode; tone?: 'line' | 'soft'; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={{
      padding: 'clamp(14px, 2vw, 20px)', borderRadius: t.cardRadiusPx, color: t.colors.ink,
      background: tone === 'soft' ? t.colors.bgAlt : t.colors.bg,
      border: tone === 'soft' ? 'none' : `1px solid ${t.colors.border}`,
      borderInlineStart: tone === 'soft' ? undefined : `3px solid ${t.colors.accent}`, ...style,
    }}>{children}</div>
  );
}
