import { useCallback, useEffect, useRef, useState, type FocusEvent, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import type { StorefrontLinkSettings, StorefrontNavItemSettings, ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import type { CategoryNode } from '@/api/services/categories';
import type { PublicCollectionSummary } from '@/api/services/collections';

/** Theme-agnostic navigation logic shared by every theme's navbar. The
 *  PRESENTATION (a mega panel, its columns, tiles, motion, the mobile
 *  accordion) lives in each theme's own component — only the data shaping and
 *  open/close behaviour are shared here. */

export interface NavImageLookup {
  category: Map<string, string>;
  collection: Map<string, string>;
}

/** Category/collection images by id, so a mega tile linked to a category or
 *  collection shows that image automatically when the seller set none. */
export function buildNavImageLookup(categories: CategoryNode[], collections: PublicCollectionSummary[]): NavImageLookup {
  const category = new Map<string, string>();
  const walk = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (node.image) category.set(node._id, node.image);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(categories);
  const collection = new Map<string, string>();
  for (const c of collections) if (c.image) collection.set(c._id, c.image);
  return { category, collection };
}

const EMPTY_LOOKUP: NavImageLookup = { category: new Map(), collection: new Map() };

/** Turns saved nav settings (inline header blocks or a standalone Menu — the
 *  same recursive shape) into render-ready items. Items saved without an id
 *  (inline header children) get a stable positional one so React keys and
 *  open-state ids never collide on duplicate labels. */
export function normalizeNavItems(
  items: StorefrontNavItemSettings[],
  resolveLink: (link: StorefrontLinkSettings) => { to?: string; href?: string },
  lookup: NavImageLookup = EMPTY_LOOKUP,
  idPrefix = 'nav',
): ResolvedStorefrontNavItem[] {
  return items.map((item, index) => {
    const id = item.id || `${idPrefix}-${index}`;
    const linkedImage = item.linkType === 'category' && item.categoryId ? lookup.category.get(item.categoryId)
      : item.linkType === 'collection' && item.collectionId ? lookup.collection.get(item.collectionId)
      : undefined;
    return {
      id,
      label: item.label,
      link: resolveLink(item),
      menuStyle: item.menuStyle === 'mega' ? 'mega' : 'dropdown',
      imageUrl: item.imageUrl || linkedImage || null,
      children: normalizeNavItems(item.children ?? [], resolveLink, lookup, id),
    };
  });
}

/** A top-level item renders as a mega panel only when the seller chose it AND
 *  it actually has children — an empty mega is just a link. */
export function isMegaItem(item: ResolvedStorefrontNavItem): boolean {
  return item.menuStyle === 'mega' && item.children.length > 0;
}

const CLOSE_DELAY_MS = 160;

/** Open/close state for the desktop mega panel. Hover opens (with a short
 *  close delay so the pointer can cross the gap into the panel), a chevron
 *  button toggles for keyboard/touch, Escape / outside click / focus leaving
 *  / navigating all close it. */
export function useMegaNav() {
  const { pathname } = useLocation();
  // Remember the path the panel was opened on: a route change then closes it
  // without a state-sync effect.
  const [state, setState] = useState<{ id: string; path: string } | null>(null);
  const openId = state && state.path === pathname ? state.id : null;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const open = useCallback((id: string) => {
    clearTimer();
    setState({ id, path: pathname });
  }, [clearTimer, pathname]);
  const closeNow = useCallback(() => {
    clearTimer();
    setState(null);
  }, [clearTimer]);
  const scheduleClose = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => { setState(null); timer.current = null; }, CLOSE_DELAY_MS);
  }, [clearTimer]);
  const toggle = useCallback((id: string) => {
    clearTimer();
    setState(cur => (cur && cur.id === id && cur.path === pathname ? null : { id, path: pathname }));
  }, [clearTimer, pathname]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNow(); };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) closeNow();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openId, closeNow]);

  /** Spread on the `<header>`: ref for outside-click, onBlur closes when keyboard focus leaves the header entirely. */
  const headerProps = {
    ref: rootRef as RefObject<HTMLElement | null>,
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (openId && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeNow();
    },
  };

  return { openId, open, toggle, scheduleClose, closeNow, keepOpen: clearTimer, headerProps };
}
