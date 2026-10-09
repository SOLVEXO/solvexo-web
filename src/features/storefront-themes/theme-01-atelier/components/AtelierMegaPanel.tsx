import type { CSSProperties } from 'react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../navigation/NavAnchor';
import { atelierTheme as t } from '../theme.config';

/** Atelier's mega menu — editorial: a quiet full-width sheet under the header,
 *  hairline borders, generous whitespace. Each level-2 item is a column: an
 *  optional photograph (4:5, the theme's own image radius), a small spaced
 *  uppercase heading, then its level-3 links in the muted ink with an
 *  underline that draws in on hover. Hover/underline styling lives in
 *  `atelier.css` (`.atelier-mega-*`) and reads the CSS variables below, so a
 *  merchant's saved colours and fonts apply. */
export function AtelierMegaPanel({ item, id, onNavigate, onMouseEnter, onMouseLeave }: {
  item: ResolvedStorefrontNavItem;
  id: string;
  onNavigate: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const columns = item.children;
  const anyImage = columns.some(c => c.imageUrl);
  const cols = Math.min(columns.length, anyImage ? 5 : 6);
  const vars = {
    '--mm-ink': t.colors.ink,
    '--mm-muted': t.colors.inkMuted,
    '--mm-accent': t.colors.accent,
  } as CSSProperties;

  return (
    <div
      id={id}
      role="region"
      aria-label={`${item.label} menu`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="atelier-mega-panel hidden lg:block absolute left-0 right-0 z-50"
      style={{ ...vars, top: '100%', background: t.colors.bg, borderTop: `1px solid ${t.colors.border}`, borderBottom: `1px solid ${t.colors.border}`, boxShadow: '0 18px 36px rgba(22,20,18,0.06)' }}
    >
      <div
        className="mx-auto grid"
        style={{
          maxWidth: t.layout.maxWidth,
          padding: `36px ${t.layout.containerPadX} 44px`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: 'clamp(20px, 2.4vw, 40px)',
          rowGap: '36px',
        }}
      >
        {columns.map(col => (
          <div key={col.id} className="flex flex-col gap-3 min-w-0">
            {anyImage && (
              <NavAnchor link={col.link} onClick={onNavigate} className="atelier-mega-tile atelier-focus-ring block overflow-hidden" style={{ borderRadius: t.imageRadiusPx, background: t.colors.bgAlt }} tabIndex={-1}>
                <span className="block w-full" style={{ aspectRatio: '4 / 5' }}>
                  {col.imageUrl && <img src={col.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover block" />}
                </span>
              </NavAnchor>
            )}
            <NavAnchor
              link={col.link}
              onClick={onNavigate}
              className="atelier-focus-ring no-underline uppercase"
              style={{ color: t.colors.ink, fontFamily: t.fonts.body, fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em' }}
            >
              {col.label}
            </NavAnchor>
            {col.children.length > 0 && (
              <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
                {col.children.map(link => (
                  <li key={link.id}>
                    <NavAnchor link={link.link} onClick={onNavigate} className="atelier-mega-link atelier-focus-ring" style={{ fontFamily: t.fonts.body, fontSize: '13px', lineHeight: 1.4 }}>
                      {link.label}
                    </NavAnchor>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
