import type { BrowseConfig } from '@/api/services/searchConfig';

/** Which seller setting a filter group on the list page belongs to. Groups the seller has no switch for (product type) always stay. */
export function configKeyOf(groupId: string): string | null {
  if (groupId === 'availability' || groupId === 'price') return groupId;
  if (groupId === 'tag' || groupId === 'tags') return 'tags';
  if (groupId.startsWith('opt:') || groupId === 'options') return 'options';
  if (groupId === 'vendor') return 'vendor';
  return null;
}

/** Drops the filters the seller switched off and puts the rest in the seller's order. A filter the shopper has already
 *  applied (e.g. from a shared link) stays visible so it can be removed. Without a config nothing changes. */
export function arrangeFilterGroups<T extends { id: string; count?: number }>(groups: T[], filters: BrowseConfig['filters'] | undefined): T[] {
  if (!filters || filters.length === 0) return groups;
  const pos = new Map(filters.map((f, i) => [f.key, i]));
  const off = new Set(filters.filter(f => !f.enabled).map(f => f.key));
  const kept = groups.filter(g => {
    const k = configKeyOf(g.id);
    return !k || !off.has(k) || (g.count ?? 0) > 0;
  });
  const rank = (g: T) => { const k = configKeyOf(g.id); return k != null && pos.has(k) ? pos.get(k)! : 999; };
  return kept.map((g, i) => ({ g, i })).sort((a, b) => rank(a.g) - rank(b.g) || a.i - b.i).map(x => x.g);
}

/** The sort choices to show, in the seller's order. The sort the shopper is on right now always stays in the list. */
export function visibleSorts<T extends { value: string }>(options: T[], sorts: BrowseConfig['sorts'] | undefined, current?: string): T[] {
  if (!sorts || sorts.length === 0) return options;
  const pos = new Map(sorts.map((s, i) => [s.key, i]));
  const off = new Set(sorts.filter(s => !s.enabled).map(s => s.key));
  return options
    .filter(o => !off.has(o.value) || o.value === current)
    .map((o, i) => ({ o, i }))
    .sort((a, b) => (pos.get(a.o.value) ?? 999) - (pos.get(b.o.value) ?? 999) || a.i - b.i)
    .map(x => x.o);
}
