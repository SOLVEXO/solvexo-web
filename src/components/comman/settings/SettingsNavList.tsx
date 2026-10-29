import { type ReactNode, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface SettingsNavItem {
  id:    string;
  label: string;
  icon?: ReactNode;
  /** One-line hint under the label — desktop panel only, where there is room. */
  hint?: string;
  /** Right-aligned pill (unread count, pending approvals…). */
  count?: number;
}

export interface SettingsNavGroup {
  label: string;
  items: SettingsNavItem[];
}

interface SettingsNavListProps {
  group:    SettingsNavGroup;
  activeId: string;
  onOpen:   (id: string) => void;
  className?: string;
}

/** Mobile menu card: one flat, divided list of icon-badge + chevron rows.
 *  This is the row anatomy `StoreNavMenu`/`AdminNavMenu` already use, so the
 *  settings menu and the rest of the mobile dashboard read as one system. */
export function SettingsNavList({ group, activeId, onOpen, className }: SettingsNavListProps) {
  return (
    <div className={clsx('bg-white border border-bone rounded-2xl overflow-hidden', className)}>
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.06em]">{group.label}</p>
      </div>
      <div className="divide-y divide-fog">
        {group.items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'relative w-full flex items-center gap-3 px-5 py-[13px] text-left',
                'border-0 cursor-pointer transition-colors duration-150',
                // One background class per state — `bg-transparent` sitting in
                // the base list alongside an active `bg-brand-*` loses to
                // whichever one Tailwind happens to emit last, which rendered
                // the active row white-on-white.
                isActive ? 'bg-brand-pale-orange' : 'bg-transparent hover:bg-cream',
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-brand-orange',
                  'transition-[height] duration-200',
                  isActive ? 'h-[58%]' : 'h-0',
                )}
              />
              {item.icon && (
                <span className={clsx(
                  'size-8 rounded-[9px] flex items-center justify-center shrink-0 transition-colors',
                  isActive ? 'bg-brand-orange text-white' : 'bg-brand-pale-orange text-brand-orange',
                )}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span className={clsx(
                  'block truncate text-[13px] leading-[1.35]',
                  isActive ? 'font-semibold text-brand-deep-orange' : 'font-medium text-charcoal',
                )}>
                  {item.label}
                </span>
              </span>
              <NavCount count={item.count} active={isActive} />
              <ChevronRight size={15} className={clsx('shrink-0', isActive ? 'text-brand-deep-orange' : 'text-slate')} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SettingsNavPanelProps {
  groups:   SettingsNavGroup[];
  activeId: string;
  onOpen:   (id: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

/** Desktop settings navigation: ONE contained panel (search header + grouped
 *  rows), not a stack of separate cards. A rail made of six floating cards read
 *  as unrelated boxes on the page background; one panel with quiet group
 *  labels inside it reads as a single control surface.
 *
 *  The active row is the solid brand fill rather than a tint, because with 15
 *  rows in a narrow column the tint alone does not survive a glance. */
export function SettingsNavPanel({
  groups, activeId, onOpen, searchable = true, searchPlaceholder = 'Search settings', className,
}: SettingsNavPanelProps) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map(g => ({ ...g, items: g.items.filter(i => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [groups, query]);

  return (
    // The bound has to live on this box, not on the sticky wrapper: `max-h-full`
    // here could never resolve (the wrapper's own height is auto), so the panel
    // grew past the viewport and `overflow-hidden` cut the last rows off — the
    // inner scroll never engaged. A viewport calc needs no definite parent.
    <div className={clsx('flex flex-col min-h-0 max-h-[calc(100dvh-116px)] bg-white border border-bone rounded-2xl overflow-hidden', className)}>
      {searchable && (
        <div className="shrink-0 p-3 border-b border-fog">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full pl-8 pr-3 py-[8px] rounded-[10px] bg-cream border border-transparent text-[12.5px] text-charcoal outline-none box-border transition-colors focus:bg-white focus:border-brand-orange"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 min-h-0 overflow-y-auto p-2">
        {visible.map(group => (
          <div key={group.label} className="mb-1 last:mb-0">
            <p className="px-2.5 pt-2.5 pb-1 text-[10px] font-bold text-slate uppercase tracking-[0.08em]">
              {group.label}
            </p>
            <div className="flex flex-col gap-[2px]">
              {group.items.map(item => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpen(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={clsx(
                      'w-full flex items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-left',
                      'border-0 cursor-pointer transition-colors duration-150',
                      // See SettingsNavList: exactly one background class per
                      // state, never a base `bg-transparent` fighting it.
                      isActive ? 'bg-brand-orange' : 'bg-transparent hover:bg-cream',
                    )}
                  >
                    {item.icon && (
                      <span className={clsx(
                        'size-7 rounded-[8px] flex items-center justify-center shrink-0 transition-colors',
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-pale-orange text-brand-orange',
                      )}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className={clsx(
                        'block truncate text-[12.5px] leading-[1.3]',
                        isActive ? 'font-semibold text-white' : 'font-medium text-charcoal',
                      )}>
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className={clsx(
                          'block truncate text-[10.5px] leading-[1.3]',
                          isActive ? 'text-white/75' : 'text-slate',
                        )}>
                          {item.hint}
                        </span>
                      )}
                    </span>
                    <NavCount count={item.count} active={isActive} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {searchable && visible.length === 0 && (
          <p className="px-2.5 py-4 text-[12px] text-slate leading-relaxed">No setting matches “{query.trim()}”.</p>
        )}
      </nav>
    </div>
  );
}

function NavCount({ count, active }: { count?: number; active: boolean }) {
  if (count == null || count <= 0) return null;
  return (
    <span className={clsx(
      'shrink-0 text-[10px] font-semibold px-[6px] py-[1px] rounded-full',
      active ? 'bg-white/25 text-white' : 'bg-cream text-slate',
    )}>
      {count}
    </span>
  );
}
