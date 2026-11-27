import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { cased } from '../textCase';
import { NavAnchor } from './NavAnchor';
import { NavBadge } from './NavBadge';

/**
 * The links inside a menu's "More" dropdown: the top-level links that did not fit on the row, each followed by
 * its sub-links. Colours come from the dropdown itself (currentColor), so every theme can reuse it as is.
 */
export function NavMoreList({ items, accent, accentInk }: { items: ResolvedStorefrontNavItem[]; accent: string; accentInk: string }) {
  const row = 'block rounded-lg px-3 py-2 no-underline hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]';
  return (
    <ul className="m-0 list-none p-0">
      {items.map(item => (
        <li key={item.id}>
          <NavAnchor link={item.link} className={`${row} font-medium`} style={{ color: 'inherit' }}>
            {cased('menu', item.label)}<NavBadge badge={item.badge} fallbackBg={accent} fallbackInk={accentInk} />
          </NavAnchor>
          {item.children.map(c => (
            <div key={c.id}>
              <NavAnchor link={c.link} className={`${row} ps-6 text-[13px]`} style={{ color: 'inherit', opacity: 0.85 }}>
                {cased('megaLink', c.label)}<NavBadge badge={c.badge} fallbackBg={accent} fallbackInk={accentInk} />
              </NavAnchor>
              {c.children.map(g => (
                <NavAnchor key={g.id} link={g.link} className={`${row} ps-10 text-[13px]`} style={{ color: 'inherit', opacity: 0.7 }}>
                  {cased('megaLink', g.label)}<NavBadge badge={g.badge} fallbackBg={accent} fallbackInk={accentInk} />
                </NavAnchor>
              ))}
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}
