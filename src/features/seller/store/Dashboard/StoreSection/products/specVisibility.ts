/** Which specs a product's form shows, and the order they sit in.
 *  A spec with no categories chosen is for every product. A spec with categories is shown for products in those categories
 *  (a product's category or its sub-category), and is never hidden from a product that already has a value for it. */
export function specAppliesTo(def: { categoryIds?: string[] | null }, productCategoryIds: string[], hasValue: boolean): boolean {
  const only = def.categoryIds ?? [];
  if (only.length === 0 || hasValue) return true;
  return productCategoryIds.some(id => !!id && only.includes(id));
}

/** Moves one item to the place of another (drag and drop). Unknown ids leave the list as it was. */
export function moveBefore<T extends { _id: string }>(list: T[], dragId: string, overId: string): T[] {
  const from = list.findIndex(x => x._id === dragId);
  const to = list.findIndex(x => x._id === overId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Moves one item a step earlier or later (the menu's Move up / Move down), among the items that are shown. */
export function moveStep<T extends { _id: string }>(list: T[], id: string, dir: -1 | 1, shown: (x: T) => boolean = () => true): T[] {
  const at = list.findIndex(x => x._id === id);
  if (at < 0) return list;
  let to = at + dir;
  while (to >= 0 && to < list.length && !shown(list[to])) to += dir; // skip specs hidden for this product
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[at], next[to]] = [next[to], next[at]];
  return next;
}

export interface CategoryOption { id: string; name: string; depth: number }

/** The category tree as a flat, indented list for a checkbox picker. */
export function flattenCategories(tree: { _id: string; name: string; children?: unknown[] }[] | null | undefined, depth = 0): CategoryOption[] {
  const out: CategoryOption[] = [];
  for (const node of tree ?? []) {
    out.push({ id: node._id, name: node.name, depth });
    out.push(...flattenCategories(node.children as { _id: string; name: string; children?: unknown[] }[] | undefined, depth + 1));
  }
  return out;
}

/** "Clothing, Shoes +1" for a spec's category list. */
export function categorySummary(ids: string[] | undefined, options: CategoryOption[]): string {
  const names = (ids ?? []).map(id => options.find(o => o.id === id)?.name).filter((n): n is string => !!n);
  if (names.length === 0) return '';
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}
