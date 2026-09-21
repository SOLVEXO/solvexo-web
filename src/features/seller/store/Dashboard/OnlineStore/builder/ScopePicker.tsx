import { Palette, Home, ShoppingBag, LayoutGrid, FileText, Newspaper, Rss, ShoppingCart, Search, Ban, ChevronDown, Check } from 'lucide-react';
import { ActionMenu, type ActionMenuItem } from '@/components/comman/ui';
import type { ThemeTemplateScopeDef, ThemeTemplateScopeGroup } from '@/features/storefront-themes/themeManifest';

/**
 * Phase 5 — a real, Shopify-style "template" picker for the Customize
 * editor, replacing the old flat `<select value={scope}>` (a raw developer
 * dropdown with no grouping, no icons, no clear "what am I looking at"
 * affordance). Organizes every real scope under the exact groups a
 * merchant expects (Home / Products / Collections / Pages / Blogs /
 * Articles / Cart / Search), plus a pinned "Theme Settings" entry and an
 * honestly-disabled "404" placeholder — see the group list below for why
 * 404 is shown but unusable rather than silently omitted.
 *
 * Built on the existing `ActionMenu` (portal-positioned, keyboard-navigable,
 * click-outside-to-close) rather than a bespoke popover — group headers are
 * plain disabled `ActionMenuItem`s (no `onClick` semantics, styled via the
 * existing `disabled` treatment), so this reuses proven, accessible
 * infrastructure instead of adding a second dropdown implementation.
 */

const GROUP_ORDER: { key: ThemeTemplateScopeGroup; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'products', label: 'Products', Icon: ShoppingBag },
  { key: 'collections', label: 'Collections', Icon: LayoutGrid },
  { key: 'pages', label: 'Pages', Icon: FileText },
  { key: 'blogs', label: 'Blogs', Icon: Newspaper },
  { key: 'articles', label: 'Articles', Icon: Rss },
  { key: 'cart', label: 'Cart', Icon: ShoppingCart },
  { key: 'search', label: 'Search', Icon: Search },
];

const GROUP_ICON_BY_ID: Record<string, typeof Home> = Object.fromEntries(GROUP_ORDER.map(g => [g.key, g.Icon]));

export function ScopePicker({ scopeDefs, scope, onChange, currentLabel }: {
  scopeDefs: ThemeTemplateScopeDef[];
  scope: string;
  onChange: (scopeId: string) => void;
  /** What the trigger button shows — the caller composes this (e.g.
   *  "Pages · About Us" once a specific page is also selected) so this
   *  component doesn't need to know about resource sub-selection at all. */
  currentLabel: string;
}) {
  const items: ActionMenuItem[] = [];

  items.push({
    label: (
      <span className="flex items-center gap-2">
        <Palette size={14} className="shrink-0" />
        Theme Settings
        {scope === 'theme' && <Check size={13} className="ml-auto shrink-0 text-brand-orange" />}
      </span>
    ),
    onClick: () => onChange('theme'),
    searchText: 'Theme Settings',
  });

  for (const group of GROUP_ORDER) {
    const groupItems = scopeDefs.filter(d => d.group === group.key);
    if (groupItems.length === 0) continue;
    items.push({
      label: <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate/70">{group.label}</span>,
      onClick: () => {},
      disabled: true,
    });
    for (const d of groupItems) {
      items.push({
        label: (
          <span className="flex items-center gap-2 pl-1">
            {d.label}
            {scope === d.id && <Check size={13} className="ml-auto shrink-0 text-brand-orange" />}
          </span>
        ),
        onClick: () => onChange(d.id),
        searchText: `${group.label} ${d.label}`,
      });
    }
  }

  // Honest placeholder — there is no editable 404 template on either theme
  // today (each theme's Not Found page is fixed markup, not section-driven)
  // — shown so the grouped picker matches the merchant-facing taxonomy in
  // full, rather than silently omitting a category a merchant might expect,
  // but disabled so it never pretends to be a real, working scope.
  items.push({
    label: <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate/70">404</span>,
    onClick: () => {},
    disabled: true,
  });
  items.push({
    label: (
      <span className="flex items-center gap-2 pl-1 text-slate">
        <Ban size={13} className="shrink-0" /> Not Found — not yet customizable
      </span>
    ),
    onClick: () => {},
    disabled: true,
    title: 'Both themes render a fixed Not Found page — no section template exists for it yet.',
  });

  const ActiveGroupIcon = GROUP_ICON_BY_ID[scopeDefs.find(d => d.id === scope)?.group ?? ''] ?? Palette;

  return (
    <ActionMenu
      align="left"
      items={items}
      searchable
      searchPlaceholder="Find a template…"
      // `aria-label` overrides a button's visible text for its accessible
      // name — `ActionMenu`'s own default ("Open actions menu") would have
      // announced nothing about WHICH template is currently selected to a
      // screen reader, even though it's clearly visible on screen. Keeping
      // this in sync with `currentLabel` is what makes "make the current
      // selection obvious" (Phase 5's own explicit UX requirement) actually
      // true for a non-visual user too, not just a sighted one.
      ariaLabel={`Template: ${currentLabel}`}
      trigger={
        <span className="flex items-center gap-2">
          <ActiveGroupIcon size={14} className="shrink-0" />
          <span className="max-w-[220px] truncate">{currentLabel}</span>
          <ChevronDown size={14} className="shrink-0" />
        </span>
      }
      triggerClassName="shrink-0 flex items-center gap-2 text-[12.5px] font-semibold border border-bone rounded-lg px-2.5 py-[7px] bg-white text-charcoal cursor-pointer hover:bg-cream transition-colors"
    />
  );
}

/** The secondary "which real page/blog/article" picker shown alongside
 *  `ScopePicker` once the selected scope's group needs one (Pages/Blogs/
 *  Articles — see `AtelierCustomizePage.tsx`). Same searchable `ActionMenu`
 *  pattern as `ScopePicker` for visual/behavioral consistency. */
export function ResourcePicker({ items, valueId, onChange, placeholder }: {
  items: { id: string; label: string }[];
  valueId: string | null;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const current = items.find(i => i.id === valueId);
  const menuItems: ActionMenuItem[] = items.map(item => ({
    label: (
      <span className="flex items-center gap-2">
        {item.label}
        {item.id === valueId && <Check size={13} className="ml-auto shrink-0 text-brand-orange" />}
      </span>
    ),
    onClick: () => onChange(item.id),
    searchText: item.label,
  }));

  return (
    <ActionMenu
      align="left"
      items={menuItems}
      searchable={items.length > 6}
      searchPlaceholder="Search…"
      // Same reasoning as `ScopePicker`'s own `ariaLabel` — keeps the
      // accessible name in sync with what's visibly shown.
      ariaLabel={`${placeholder.replace('…', '')}: ${current?.label ?? placeholder}`}
      trigger={
        <span className="flex items-center gap-2">
          <span className="max-w-[220px] truncate">{current?.label ?? placeholder}</span>
          <ChevronDown size={14} className="shrink-0" />
        </span>
      }
      triggerClassName="shrink-0 flex items-center gap-2 text-[12.5px] font-semibold border border-bone rounded-lg px-2.5 py-[7px] bg-white text-charcoal cursor-pointer hover:bg-cream transition-colors"
    />
  );
}
