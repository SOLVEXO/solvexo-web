import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { TRUST_ICON_OPTIONS } from './trustBadgeData';

export interface TrustBadgeTokens { ink: string; inkMuted: string; border: string; radius: number | string; fontBody?: string }
interface Item { icon?: string; title?: string; text?: string }

/** "Free shipping · Easy returns · Secure checkout" row under the buy box. Draws nothing when no badge has a title. */
export function ProductTrustBadges({ settings, tokens: t }: { settings: Record<string, unknown>; tokens: TrustBadgeTokens }) {
  const items = (Array.isArray(settings.items) ? settings.items as Item[] : []).filter(i => typeof i?.title === 'string' && i.title.trim()).slice(0, 6);
  if (items.length === 0) return null;
  const layout = settings.layout === 'column' || settings.layout === 'grid' ? settings.layout : 'row';
  const boxed = settings.style === 'boxed';
  const heading = typeof settings.heading === 'string' ? settings.heading.trim() : '';
  const wrap: CSSProperties = layout === 'column'
    ? { display: 'flex', flexDirection: 'column', gap: 12 }
    : layout === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 } : { display: 'flex', flexWrap: 'wrap', gap: '12px 24px' };
  return (
    <div data-trust-badges style={{ fontFamily: t.fontBody, color: t.ink }}>
      {heading && <p className="m-0 mb-3 text-sm font-semibold">{heading}</p>}
      <ul className="m-0 list-none p-0" style={wrap}>
        {items.map((it, i) => {
          const Icon = TRUST_ICON_OPTIONS.find(o => o.value === it.icon)?.Icon ?? Check;
          return (
            <li key={i} className="flex items-start gap-3" style={boxed ? { border: `1px solid ${t.border}`, borderRadius: t.radius, padding: '12px 14px' } : { flex: layout === 'row' ? '1 1 180px' : undefined }}>
              <span aria-hidden className="mt-0.5 shrink-0"><Icon size={20} aria-hidden /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug">{it.title}</span>
                {it.text && <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: t.inkMuted }}>{it.text}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
