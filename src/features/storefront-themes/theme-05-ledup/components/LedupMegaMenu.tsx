import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { NavAnchor } from '../../navigation/NavAnchor';

/** Rounded mega panel. Left: the menu items that have a dropdown. Middle: the chosen item's links (a child with its own children becomes a titled column). Right: that item's photo, when the seller set one. */
export function LedupMegaMenu({ items, activeId, onClose }: { items: ResolvedStorefrontNavItem[]; activeId: string | null; onClose: () => void }) {
  const withChildren = items.filter(i => i.children.length > 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!activeId || withChildren.length === 0) return null;

  const current = withChildren.find(i => i.id === (hover ?? activeId)) ?? withChildren.find(i => i.id === activeId) ?? withChildren[0];
  const groups = current.children.filter(c => c.children.length > 0);
  const loose = current.children.filter(c => c.children.length === 0);
  const columns = [
    ...(loose.length > 0 ? [{ id: 'loose', title: current.label, link: current.link, links: loose }] : []),
    ...groups.map(g => ({ id: g.id, title: g.label, link: g.link, links: g.children })),
  ];
  const linkCls = 'inline-block text-sm font-normal text-stone-700 no-underline transition hover:translate-x-0.5 hover:text-stone-950';

  return (
    <div onMouseLeave={onClose} className="ld-pop absolute start-0 top-full z-40 w-full rounded-b-[40px] border-b border-stone-200 bg-white px-8 pb-12 pt-6 shadow-2xl backdrop-blur-md lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 items-start gap-8">
          <div className="col-span-3 flex flex-col gap-5 border-e border-stone-100 pe-6">
            {withChildren.map(it => {
              const on = it.id === current.id;
              return (
                <button key={it.id} type="button" onMouseEnter={() => setHover(it.id)} onFocus={() => setHover(it.id)} onClick={() => setHover(it.id)}
                  className={`text-start text-sm font-semibold tracking-wide transition-all ${on ? 'text-stone-900 underline decoration-2 underline-offset-8' : 'text-stone-400 hover:text-stone-700'}`}>
                  {it.label}
                </button>
              );
            })}
            {(current.link.to || current.link.href) && (
              <div className="pt-6">
                <NavAnchor link={current.link} onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 no-underline transition hover:border-stone-900 hover:text-stone-900">
                  {ts('ld.viewAll', 'View all')} <ArrowUpRight size={13} aria-hidden />
                </NavAnchor>
              </div>
            )}
          </div>

          <div className={`grid gap-8 px-4 ${current.imageUrl ? 'col-span-6' : 'col-span-9'} grid-cols-2 lg:grid-cols-3`}>
            {columns.map(col => (
              <div key={col.id} className="flex flex-col gap-3">
                <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-400">{col.title}</h4>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {col.links.map(l => (
                    <li key={l.id}><NavAnchor link={l.link} onClick={onClose} className={linkCls}>{l.label}</NavAnchor></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {current.imageUrl && (
            <div className="col-span-3">
              <NavAnchor link={current.link} onClick={onClose} className="group block overflow-hidden rounded-3xl bg-stone-50 no-underline">
                <img src={current.imageUrl} alt={current.label} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
              </NavAnchor>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
