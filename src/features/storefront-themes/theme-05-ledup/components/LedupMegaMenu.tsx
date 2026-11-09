import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../navigation/NavAnchor';

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
    ...(loose.length > 0 ? [{ id: 'loose', title: current.label, link: current.link, links: loose }] : []),
    ...groups.map(g => ({ id: g.id, title: g.label, link: g.link, links: g.children })),
  ] : [];

  return (
    <div className={`ld-mega ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {current && (
        <div className="ld-mega-surface">
          <div className="flex w-1/5 shrink-0 flex-col gap-7 border-e border-[#e2dedb] pe-6">
            {parents.map(it => (
              <button key={it.id} type="button" tabIndex={visible ? 0 : -1} className={`ld-parent ${it.id === current.id ? 'is-active' : ''}`}
                onMouseEnter={() => setHover({ from: activeId, id: it.id })} onFocus={() => setHover({ from: activeId, id: it.id })} onClick={() => setHover({ from: activeId, id: it.id })}>
                {it.label}
              </button>
            ))}
            {(current.link.to || current.link.href) && (
              <NavAnchor link={current.link} onClick={onClose} className="ld-pillbtn" tabIndex={visible ? 0 : -1}>
                {ts('ld.viewAll', 'View all')} <ArrowUpRight size={14} aria-hidden />
              </NavAnchor>
            )}
          </div>

          <div className={`grid gap-x-10 gap-y-8 ps-10 ${current.imageUrl ? 'w-3/5' : 'flex-1'} grid-cols-2 xl:grid-cols-3 content-start`}>
            {columns.map(col => (
              <div key={col.id} className="flex flex-col gap-2">
                <NavAnchor link={col.link} onClick={onClose} className="ld-childtitle" tabIndex={visible ? 0 : -1}>{col.title}</NavAnchor>
                <ul className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0">
                  {col.links.map(l => (
                    <li key={l.id}>
                      <NavAnchor link={l.link} onClick={onClose} className="ld-grand" tabIndex={visible ? 0 : -1}>
                        {l.label}<ArrowRight size={14} className="ld-arrow" aria-hidden />
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {current.imageUrl && (
            <div className="w-1/5 shrink-0 ps-5">
              <NavAnchor link={current.link} onClick={onClose} className="group block overflow-hidden rounded-3xl bg-stone-100 no-underline" tabIndex={visible ? 0 : -1}>
                <img src={current.imageUrl} alt={current.label} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
              </NavAnchor>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
