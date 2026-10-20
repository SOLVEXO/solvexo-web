import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../../navigation/NavAnchor';
import { isMegaItem } from '../../../navigation/megaNav';
import { fashionTheme as t } from '../../theme.config';

function Toggle({ expanded, label, controls, onClick }: { expanded: boolean; label: string; controls: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} aria-controls={controls} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 p-0 transition-colors" style={{ background: expanded ? t.colors.ink : t.colors.bgAlt, color: expanded ? t.colors.bg : t.colors.ink }}>
      {expanded ? <Minus size={15} /> : <Plus size={15} />}
    </button>
  );
}

/** One top-level mobile nav entry: a link plus, when it has children, a round +/- toggle that opens an accordion.
 *  Level-3 links expand per level-2 entry; a `mega` item shows them as an image grid when any has an image. */
export function MobileNavItem({ item, onNavigate }: { item: ResolvedStorefrontNavItem; onNavigate: () => void }) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const mega = isMegaItem(item);
  const row = `1px solid ${t.colors.border}`;
  const top = { color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' } as const;

  if (item.children.length === 0) {
    return <NavAnchor link={item.link} onClick={onNavigate} className="block no-underline" style={{ ...top, padding: '16px 4px', borderBottom: row }}>{item.label}</NavAnchor>;
  }

  const panelId = `${baseId}-panel`;
  return (
    <div style={{ borderBottom: row }}>
      <div className="flex items-center justify-between gap-2 py-2.5 pl-1">
        {item.link.to || item.link.href
          ? <NavAnchor link={item.link} onClick={onNavigate} className="flex-1 py-1.5 no-underline" style={top}>{item.label}</NavAnchor>
          : <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={panelId} className="flex-1 cursor-pointer border-0 bg-transparent py-1.5 text-left" style={top}>{item.label}</button>}
        <Toggle expanded={open} label={item.label} controls={panelId} onClick={() => setOpen(o => !o)} />
      </div>

      {open && (
        <div id={panelId} className="mb-3 overflow-hidden" style={{ background: t.colors.bgAlt, borderRadius: 20 }}>
          {item.children.map((child, ci) => {
            const childPanelId = `${baseId}-${child.id}`;
            const childOpen = openChildId === child.id;
            const childStyle = { color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 15 };
            const divider = ci > 0 ? { borderTop: row } : undefined;
            if (child.children.length === 0) {
              return <NavAnchor key={child.id} link={child.link} onClick={onNavigate} className="block no-underline" style={{ ...childStyle, padding: '13px 18px', ...divider }}>{child.label}</NavAnchor>;
            }
            const gridWithImages = mega && child.children.some(g => g.imageUrl);
            return (
              <div key={child.id} style={divider}>
                <div className="flex items-center justify-between gap-2 py-1.5 pl-[18px] pr-2">
                  {child.link.to || child.link.href
                    ? <NavAnchor link={child.link} onClick={onNavigate} className="flex-1 py-2 no-underline" style={{ ...childStyle, fontWeight: 600 }}>{child.label}</NavAnchor>
                    : <button type="button" onClick={() => setOpenChildId(childOpen ? null : child.id)} aria-expanded={childOpen} aria-controls={childPanelId} className="flex-1 cursor-pointer border-0 bg-transparent py-2 text-left" style={{ ...childStyle, fontWeight: 600 }}>{child.label}</button>}
                  <Toggle expanded={childOpen} label={child.label} controls={childPanelId} onClick={() => setOpenChildId(childOpen ? null : child.id)} />
                </div>
                {childOpen && (
                  <div id={childPanelId} className="px-[18px] pb-4 pt-1">
                    {gridWithImages ? (
                      <div className="grid grid-cols-3 gap-3">
                        {child.children.map(g => (
                          <NavAnchor key={g.id} link={g.link} onClick={onNavigate} className="flex flex-col gap-1.5 no-underline" style={childStyle}>
                            <span className="block aspect-square w-full overflow-hidden" style={{ borderRadius: 16, background: t.colors.border }}>
                              {g.imageUrl && <img src={g.imageUrl} alt="" loading="lazy" className="block size-full object-cover" />}
                            </span>
                            <span className="text-xs font-medium leading-tight">{g.label}</span>
                          </NavAnchor>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {child.children.map(g => <NavAnchor key={g.id} link={g.link} onClick={onNavigate} className="block py-2 no-underline" style={{ ...childStyle, color: t.colors.inkMuted }}>{g.label}</NavAnchor>)}
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
