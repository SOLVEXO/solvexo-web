import type { CSSProperties, ReactNode } from 'react';
import { ledupTheme as t } from '../theme.config';

/** ledup.pt content box: white card, 24 px corners, soft shadow, plain 18 px title (no rules, no uppercase). */
export function LedupPanel({ title, action, children, flush = false, tone = 'line', style }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean; tone?: 'line' | 'soft'; style?: CSSProperties;
}) {
  return (
    <section className="overflow-hidden" style={{
      borderRadius: 24, background: tone === 'soft' ? '#f4f3f2' : '#fff', color: '#4b423b', fontFamily: t.fonts.body,
      boxShadow: tone === 'soft' ? 'none' : '0 8px 40px rgba(75,66,59,.06)', ...style,
    }}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-6 pb-1 pt-5">
          {title && <h2 className="m-0 text-[18px] font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={flush ? '' : 'p-6'}>{children}</div>
    </section>
  );
}

/** Row of labelled facts (order number, date, status...) in one white card, divided by hairlines. */
export function LedupFactStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 grid overflow-hidden" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', borderRadius: 24, background: '#fff', boxShadow: '0 8px 40px rgba(75,66,59,.06)' }}>
      {items.map((it, i) => (
        <div key={it.label} className="px-6 py-5" style={{ borderInlineStart: i === 0 ? 'none' : '1px solid #ebe8e5' }}>
          <dt className="text-[13px] font-normal" style={{ color: '#8c847e' }}>{it.label}</dt>
          <dd className="m-0 mt-1 text-[16px] font-medium" style={{ color: '#4b423b' }}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** List-item box: white, 20 px corners, soft shadow (soft = plain tinted panel). Used for rows in the account lists. */
export function LedupCard({ children, tone = 'line', className = '', style }: { children: ReactNode; tone?: 'line' | 'soft'; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={{
      padding: 'clamp(16px, 2vw, 22px)', borderRadius: 20, color: '#4b423b',
      background: tone === 'soft' ? '#f4f3f2' : '#fff',
      boxShadow: tone === 'soft' ? 'none' : '0 6px 30px rgba(75,66,59,.05)', ...style,
    }}>{children}</div>
  );
}
