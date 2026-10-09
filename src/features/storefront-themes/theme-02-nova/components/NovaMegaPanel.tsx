import { useState, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../navigation/NavAnchor';
import { novaTheme as t } from '../theme.config';

/** Nova's mega menu — bold and app-like: a floating rounded card under the
 *  header with a left rail of level-2 categories (the active one fills with the
 *  accent colour, like a pill button) and, on the right, the active category's
 *  level-3 items as a grid of rounded image tiles. Hovering or focusing a rail
 *  item switches the right side. Styling for hover states lives in `nova.css`
 *  (`.nova-mega-*`) and reads the CSS variables set here. */
export function NovaMegaPanel({ item, id, onNavigate, onMouseEnter, onMouseLeave }: {
  item: ResolvedStorefrontNavItem;
  id: string;
  onNavigate: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const rail = item.children;
  const [pickedId, setPickedId] = useState<string | null>(null);
  // Default to the first entry that actually has sub-items so the right side
  // is never empty when something could be shown.
  const active = rail.find(c => c.id === pickedId) ?? rail.find(c => c.children.length > 0) ?? rail[0];
  const tiles = active?.children ?? [];
  const tilesHaveImages = tiles.some(c => c.imageUrl);
  const vars = {
    '--mm-ink': t.colors.ink,
    '--mm-muted': t.colors.inkMuted,
    '--mm-accent': t.colors.accent,
    '--mm-accent-ink': t.colors.accentInk,
    '--mm-soft': t.colors.bgAlt,
    '--mm-border': t.colors.border,
  } as CSSProperties;

  return (
    <div
      id={id}
      role="region"
      aria-label={`${item.label} menu`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="nova-mega-panel hidden lg:block absolute left-0 right-0 z-50"
      style={{ ...vars, top: '100%', padding: `8px ${t.layout.containerPadX} 0` }}
    >
      <div
        className="mx-auto grid"
        style={{
          maxWidth: t.layout.maxWidth,
          gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
          background: t.colors.bg,
          border: `1.5px solid ${t.colors.border}`,
          borderRadius: t.radius.md,
          boxShadow: '0 20px 48px rgba(20,18,31,0.14)',
          overflow: 'hidden',
        }}
      >
        <ul className="m-0 list-none flex flex-col gap-1" style={{ padding: '14px', background: t.colors.bgAlt }}>
          {rail.map(entry => {
            const isActive = entry.id === active?.id;
            return (
              <li key={entry.id}>
                <NavAnchor
                  link={entry.link}
                  onClick={onNavigate}
                  onMouseEnter={() => setPickedId(entry.id)}
                  onFocus={() => setPickedId(entry.id)}
                  className="nova-mega-rail nova-focus-ring no-underline flex items-center justify-between gap-2"
                  style={{
                    fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, padding: '10px 14px', borderRadius: t.radius.sm,
                    background: isActive ? t.colors.accent : 'transparent',
                    color: isActive ? t.colors.accentInk : t.colors.ink,
                  }}
                >
                  <span className="flex-1">{entry.label}</span>
                  {entry.children.length > 0 && <ChevronRight size={15} aria-hidden="true" />}
                </NavAnchor>
              </li>
            );
          })}
        </ul>

        <div className="min-w-0 flex flex-col gap-4" style={{ padding: '22px 26px 26px' }}>
          {active && (
            <div className="flex items-center justify-between gap-4">
              <span style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 700, color: t.colors.ink }}>{active.label}</span>
              <NavAnchor link={active.link} onClick={onNavigate} className="nova-mega-all nova-focus-ring no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600 }}>
                View all
              </NavAnchor>
            </div>
          )}

          {tiles.length === 0 && active && (
            // A category with no sub-items: show it as one large tile so the panel isn't a dead end.
            <NavAnchor link={active.link} onClick={onNavigate} className="nova-mega-tile no-underline flex flex-col gap-2.5" style={{ maxWidth: '220px' }}>
              <span className="block w-full overflow-hidden" style={{ aspectRatio: '1 / 1', borderRadius: t.imageRadiusPx, background: t.colors.bgAlt }}>
                {active.imageUrl && <img src={active.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover block" />}
              </span>
              <span style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 600, color: t.colors.ink }}>{active.label}</span>
            </NavAnchor>
          )}

          {tiles.length > 0 && tilesHaveImages && (
            <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {tiles.map(tile => (
                <NavAnchor key={tile.id} link={tile.link} onClick={onNavigate} className="nova-mega-tile nova-focus-ring no-underline flex flex-col gap-2.5 min-w-0">
                  <span className="block w-full overflow-hidden" style={{ aspectRatio: '1 / 1', borderRadius: t.imageRadiusPx, background: t.colors.bgAlt }}>
                    {tile.imageUrl && <img src={tile.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover block" />}
                  </span>
                  <span style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: t.colors.ink, lineHeight: 1.3 }}>{tile.label}</span>
                </NavAnchor>
              ))}
            </div>
          )}

          {tiles.length > 0 && !tilesHaveImages && (
            <div className="flex flex-wrap gap-2.5">
              {tiles.map(tile => (
                <NavAnchor
                  key={tile.id}
                  link={tile.link}
                  onClick={onNavigate}
                  className="nova-mega-chip nova-focus-ring no-underline"
                  style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 600, padding: '9px 16px', borderRadius: '9999px', border: `1.5px solid ${t.colors.border}`, color: t.colors.ink }}
                >
                  {tile.label}
                </NavAnchor>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
