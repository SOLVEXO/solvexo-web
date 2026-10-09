import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from './NavAnchor';
import { isMegaItem } from './megaNav';

/** Each theme passes its own tokens, so the same accordion reads as that
 *  theme's mobile navigation (Atelier: spaced uppercase, square tiles; Nova:
 *  bold, rounded tiles) without duplicating the open/close logic. */
export interface MobileNavTokens {
  colors: { ink: string; inkMuted: string; border: string; bgAlt: string; accent: string };
  fonts: { body: string };
  padX: string;
  tileRadius: string;
  topUppercase: boolean;
  topSize: string;
  topWeight: number;
  topTracking: string;
  childSize: string;
}

function Toggle({ expanded, label, controls, onClick, tokens }: {
  expanded: boolean; label: string; controls: string; onClick: () => void; tokens: MobileNavTokens;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
      className="bg-transparent border-0 cursor-pointer flex items-center justify-center shrink-0"
      style={{ color: tokens.colors.ink, width: '44px', height: '44px' }}
    >
      {expanded ? <Minus size={16} /> : <Plus size={16} />}
    </button>
  );
}

/** One top-level mobile nav entry: a link, plus (when it has children) a +/−
 *  toggle that expands an accordion. Level-3 links expand per level-2 entry.
 *  A `mega` item shows its level-3 links as an image grid when any of them
 *  has an image, otherwise as a plain list. */
export function MobileNavItem({ item, tokens, onNavigate }: {
  item: ResolvedStorefrontNavItem;
  tokens: MobileNavTokens;
  onNavigate: () => void;
}) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const mega = isMegaItem(item);
  const rowBorder = `1px solid ${tokens.colors.border}`;
  const topStyle = {
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.body,
    fontSize: tokens.topSize,
    fontWeight: tokens.topWeight,
    letterSpacing: tokens.topTracking,
    textTransform: tokens.topUppercase ? ('uppercase' as const) : undefined,
  };

  if (item.children.length === 0) {
    return (
      <NavAnchor link={item.link} onClick={onNavigate} className="no-underline block" style={{ ...topStyle, padding: `14px ${tokens.padX}`, borderBottom: rowBorder }}>
        {item.label}
      </NavAnchor>
    );
  }

  const panelId = `${baseId}-panel`;
  return (
    <div style={{ borderBottom: rowBorder }}>
      <div className="flex items-center justify-between" style={{ paddingLeft: tokens.padX, paddingRight: `calc(${tokens.padX} - 12px)` }}>
        <NavAnchor link={item.link} onClick={onNavigate} className="no-underline flex-1" style={{ ...topStyle, padding: '14px 0' }}>{item.label}</NavAnchor>
        <Toggle expanded={open} label={item.label} controls={panelId} onClick={() => setOpen(o => !o)} tokens={tokens} />
      </div>

      {open && (
        <div id={panelId} style={{ background: tokens.colors.bgAlt }}>
          {item.children.map(child => {
            const childPanelId = `${baseId}-${child.id}`;
            const childOpen = openChildId === child.id;
            const childStyle = { color: tokens.colors.ink, fontFamily: tokens.fonts.body, fontSize: tokens.childSize };
            if (child.children.length === 0) {
              return (
                <NavAnchor key={child.id} link={child.link} onClick={onNavigate} className="no-underline block" style={{ ...childStyle, padding: `12px ${tokens.padX}`, borderTop: rowBorder }}>
                  {child.label}
                </NavAnchor>
              );
            }
            const gridWithImages = mega && child.children.some(g => g.imageUrl);
            return (
              <div key={child.id} style={{ borderTop: rowBorder }}>
                <div className="flex items-center justify-between" style={{ paddingLeft: tokens.padX, paddingRight: `calc(${tokens.padX} - 12px)` }}>
                  <NavAnchor link={child.link} onClick={onNavigate} className="no-underline flex-1" style={{ ...childStyle, fontWeight: 600, padding: '12px 0' }}>{child.label}</NavAnchor>
                  <Toggle expanded={childOpen} label={child.label} controls={childPanelId} onClick={() => setOpenChildId(childOpen ? null : child.id)} tokens={tokens} />
                </div>
                {childOpen && (
                  <div id={childPanelId} style={{ padding: `4px ${tokens.padX} 16px` }}>
                    {gridWithImages ? (
                      <div className="grid grid-cols-3 gap-3">
                        {child.children.map(g => (
                          <NavAnchor key={g.id} link={g.link} onClick={onNavigate} className="no-underline flex flex-col gap-1.5" style={childStyle}>
                            <span className="block w-full overflow-hidden" style={{ aspectRatio: '1 / 1', borderRadius: tokens.tileRadius, background: tokens.colors.border }}>
                              {g.imageUrl && <img src={g.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover block" />}
                            </span>
                            <span style={{ fontSize: '11.5px', lineHeight: 1.3, color: tokens.colors.ink }}>{g.label}</span>
                          </NavAnchor>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {child.children.map(g => (
                          <NavAnchor key={g.id} link={g.link} onClick={onNavigate} className="no-underline block" style={{ ...childStyle, color: tokens.colors.inkMuted, padding: '9px 0' }}>
                            {g.label}
                          </NavAnchor>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
