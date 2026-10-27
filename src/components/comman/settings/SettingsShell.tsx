import { type ReactNode, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SettingsNavList, SettingsNavPanel, type SettingsNavGroup, type SettingsNavItem } from './SettingsNavList';

interface SettingsShellProps {
  /** Desktop panel groups its rows under these eyebrows; mobile shows one flat
   *  list (see `mobileEyebrow`) so the pre-existing mobile menu is unchanged. */
  groups:      SettingsNavGroup[];
  activeId:    string;
  onOpen:      (id: string) => void;
  /** Mobile only — hero rendered above the list (e.g. the store identity card). */
  mobileHero?: ReactNode;
  /** Mobile only — rendered under the list (the rest of the dashboard nav). */
  mobileFooter?: ReactNode;
  /** Mobile only — eyebrow of the flat list. */
  mobileEyebrow?: string;
  /** Mobile only — a section is open, so show the back bar instead of the list. */
  drilledIn?: boolean;
  onBack?:    () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  children:   ReactNode;
}

/** Page shell for every tabbed Settings hub (seller store + admin platform).
 *
 *  Desktop puts the tab list in one sticky panel on the RIGHT of the content
 *  and mobile keeps its existing drill-in behavior (flat list → one focused
 *  section → back bar). Both are fed from the same `groups` array, so a tab
 *  can't exist on one surface and be missing from the other.
 *
 *  This replaces the horizontal `TabBar` strip: 15 labels in a row overflowed
 *  into a scroller where half of them were off-screen, and the strip gave the
 *  page no sense of which section it was in.
 *
 *  `children` (the hub's own keep-alive panes) mounts exactly once — the
 *  container flips between `hidden` (mobile, list showing) and a 2-column grid
 *  (desktop) rather than rendering the panes twice. Panes keep their own
 *  `px-4 lg:px-7 py-6` page padding, which is also what spaces them off the
 *  panel; the panel only adds the right-hand page padding. */
export function SettingsShell({
  groups, activeId, onOpen,
  mobileHero, mobileFooter, mobileEyebrow = 'Settings',
  drilledIn = false, onBack,
  searchable = true, searchPlaceholder = 'Search settings',
  children,
}: SettingsShellProps) {
  const allItems = useMemo<SettingsNavItem[]>(() => groups.flatMap(g => g.items), [groups]);
  const activeLabel = allItems.find(i => i.id === activeId)?.label ?? mobileEyebrow;

  return (
    <>
      {/* ── Mobile: the menu screen ─────────────────────────────────────── */}
      {!drilledIn && (
        <div className="lg:hidden px-4 pt-3 pb-6 flex flex-col gap-4">
          {mobileHero}
          <SettingsNavList
            group={{ label: mobileEyebrow, items: allItems }}
            activeId={activeId}
            onOpen={onOpen}
          />
          {mobileFooter}
        </div>
      )}

      {/* ── Mobile: back bar once a section is open ─────────────────────── */}
      {drilledIn && onBack && (
        <div className="lg:hidden flex items-center gap-2 px-4 pt-3 pb-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={`Back to ${mobileEyebrow.toLowerCase()} menu`}
            className="size-8 -ml-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-charcoal hover:bg-cream transition-colors"
          >
            <ChevronLeft size={19} />
          </button>
          <p className="text-[15px] font-bold text-carbon">{activeLabel}</p>
        </div>
      )}

      {/* ── Content (+ desktop nav panel) ───────────────────────────────── */}
      <div className={clsx('lg:grid lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start', !drilledIn && 'hidden')}>
        <div className="min-w-0">{children}</div>

        <aside
          data-lenis-prevent
          className="hidden lg:block lg:sticky lg:top-[72px] lg:py-6 lg:pr-7"
        >
          <SettingsNavPanel
            groups={groups}
            activeId={activeId}
            onOpen={onOpen}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
          />
        </aside>
      </div>
    </>
  );
}
