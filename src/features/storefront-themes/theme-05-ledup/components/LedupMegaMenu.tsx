import { useState } from 'react';
import { cased, textCaseOf } from '../../textCase';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../navigation/NavAnchor';
import { NavBadge } from '../../navigation/NavBadge';
import { MegaPromoCards } from '../../navigation/MegaPromoCards';

/** Mega menu like ledup.pt: parent items on the left (underline slides in on hover), the chosen parent's groups in the middle (a link's arrow fades in on hover), its photo on the right. Always mounted so it can fade in/out. */
export function LedupMegaMenu({ items, activeId, onClose }: { items: ResolvedStorefrontNavItem[]; activeId: string | null; onClose: () => void }) {
  const parents = items.filter(i => i.children.length > 0);
  const [hover, setHover] = useState<{ from: string | null; id: string | null }>({ from: null, id: null });
  const visible = activeId !== null && parents.length > 0;
  // a hover choice only counts while the panel stays open on the same parent it was made on
  const picked = hover.from === activeId ? hover.id : null;
  const current = parents.find(i => i.id === (picked ?? activeId)) ?? parents[0];

  const groups = current ? current.children.filter(c => c.children.length > 0) : [];
  const loose = current ? current.children.filter(c => c.children.length === 0) : [];
  const columns = current ? [
    ...(loose.length > 0 ? [{ id: 'loose', title: current.label, badge: current.badge, link: current.link, links: loose }] : []),
    ...groups.map(g => ({ id: g.id, title: g.label, badge: g.badge, link: g.link, links: g.children })),
  ] : [];

  return (
    <div className={`ld-mega ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {current && (
        <div data-nav-card className="ld-mega-surface">
          <div className="flex w-1/5 shrink-0 flex-col gap-7 border-e border-[#e2dedb] pe-6">
            {parents.map(it => (
              <button key={it.id} type="button" tabIndex={visible ? 0 : -1} className={`ld-parent ${it.id === current.id ? 'is-active' : ''}`}
                style={textCaseOf('menu') ? { textTransform: 'none' } : undefined} onMouseEnter={() => setHover({ from: activeId, id: it.id })} onFocus={() => setHover({ from: activeId, id: it.id })} onClick={() => setHover({ from: activeId, id: it.id })}>
                {cased('menu', it.label)}<NavBadge badge={it.badge} fallbackBg="#4b423b" fallbackInk="#ffffff" />
              </button>
            ))}
            <a href="/search" onClick={onClose} className="ld-pillbtn mt-auto" tabIndex={visible ? 0 : -1} style={{ color: '#a69d98' }}>
              {ts('ld.allCategories', 'All categories')} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>

          <div className={`flex flex-col ps-10 ${current.imageUrl && !current.promos?.length ? 'w-3/5' : 'flex-1'}`}>
          <div className="grid grid-cols-2 content-start gap-x-10 gap-y-8 xl:grid-cols-3" style={current.megaColumns ? { gridTemplateColumns: `repeat(${current.megaColumns}, minmax(0, 1fr))` } : undefined}>
            {columns.map(col => (
              <div key={col.id} className="flex flex-col gap-2">
                <NavAnchor link={col.link} onClick={onClose} className="ld-childtitle" style={textCaseOf('megaHeading') ? { textTransform: 'none' } : undefined} tabIndex={visible ? 0 : -1}>{cased('megaHeading', col.title)}<NavBadge badge={col.badge} fallbackBg="#4b423b" fallbackInk="#ffffff" /></NavAnchor>
                <ul className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0">
                  {col.links.map(l => (
                    <li key={l.id}>
                      <NavAnchor link={l.link} navStyle={l.style} onClick={onClose} className="ld-grand" tabIndex={visible ? 0 : -1}>
                        {cased('megaLink', l.label)}<NavBadge badge={l.badge} fallbackBg="#4b423b" fallbackInk="#ffffff" /><ArrowRight size={14} className="ld-arrow" aria-hidden />
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {(current.link.to || current.link.href) && (
            <NavAnchor link={current.link} navStyle={current.style} onClick={onClose} className="ld-pillbtn mt-10" tabIndex={visible ? 0 : -1}>
              {ts('ld.viewAllIn', 'View all in {{name}}', { name: current.label })} <ArrowUpRight size={14} aria-hidden />
            </NavAnchor>
          )}
          </div>

          <div className="ps-6"><MegaPromoCards promos={current.promos} width={240} tokens={{ ink: '#4b423b', inkMuted: '#a69d98', border: '#e2dedb', bg: '#ffffff', bgAlt: '#f6f6f6', accent: '#4b423b', accentInk: '#ffffff', radius: 24 }} /></div>
          {current.imageUrl && (
            <div className="w-1/5 shrink-0 ps-5">
              <p className="m-0 mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#a69d98]">{ts('ld.featured', 'Featured')}</p>
              <NavAnchor link={current.link} navStyle={current.style} onClick={onClose} className="ld-mega-feature group block no-underline" tabIndex={visible ? 0 : -1}>
                <img src={current.imageUrl} alt="" loading="lazy" className="aspect-[4/3] w-full object-contain p-4 transition duration-500 group-hover:scale-105" />
                <span className="block px-4 pb-4 text-xs font-medium uppercase text-[#4b423b]">{current.label}</span>
              </NavAnchor>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
