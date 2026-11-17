import type { ReactNode } from 'react';
import type { ResolvedMegaPromo } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from './NavAnchor';

/** The promo cards beside a mega panel's columns: picture, title, short text and a button. Drawn from the theme's own colours and
 *  corner radius (passed in), so each theme keeps its look. The whole card is the link. */
export interface PromoTokens { ink: string; inkMuted: string; border: string; bg: string; bgAlt: string; accent: string; accentInk: string; radius: number; fontDisplay?: string }

export function MegaPromoCards({ promos, tokens: t, width = 260 }: { promos: ResolvedMegaPromo[] | undefined; tokens: PromoTokens; width?: number }) {
  if (!promos?.length) return null;
  return (
    <div data-mega-promos className="hidden shrink-0 flex-col gap-4 lg:flex" style={{ width }}>
      {promos.map((p, i) => {
        const hasLink = !!(p.link.to || p.link.href);
        const body: ReactNode = (
          <>
            {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', background: t.bgAlt }} />}
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14 }}>
              {p.title && <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: t.ink, fontFamily: t.fontDisplay }}>{p.title}</span>}
              {p.text && <span style={{ fontSize: 13, lineHeight: 1.45, color: t.inkMuted }}>{p.text}</span>}
              {p.buttonLabel && (
                <span style={{ alignSelf: 'flex-start', marginTop: 4, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: t.accent, color: t.accentInk }}>{p.buttonLabel}</span>
              )}
            </span>
          </>
        );
        const style = { display: 'block', overflow: 'hidden', border: `1px solid ${t.border}`, borderRadius: t.radius, background: t.bg, textDecoration: 'none' } as const;
        return hasLink
          ? <NavAnchor key={i} link={p.link} className="no-underline" style={style}>{body}</NavAnchor>
          : <div key={i} style={style}>{body}</div>;
      })}
    </div>
  );
}
