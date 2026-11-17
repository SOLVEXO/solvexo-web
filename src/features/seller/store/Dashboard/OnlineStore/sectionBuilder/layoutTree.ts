import type { LayoutNode, LayoutNodeType, StoreFieldDef } from '@/api/services/storeSectionDefs';

/** Pure helpers of the Section builder: building the layout tree, finding / moving / removing a node by its path, field names, the
 *  fields a layout implies, and the starting points offered to the seller. No React here. */

export type NodePath = number[];

export const CONTAINERS: LayoutNodeType[] = ['stack', 'columns', 'repeat'];
export const LEAVES: LayoutNodeType[] = ['heading', 'text', 'richtext', 'image', 'button', 'video', 'divider', 'spacer'];
export const isContainer = (t: LayoutNodeType) => CONTAINERS.includes(t);
export const hasField = (t: LayoutNodeType) => ['heading', 'text', 'richtext', 'image', 'button', 'video'].includes(t);

export const NODE_LABEL: Record<LayoutNodeType, string> = {
  stack: 'Group (stacked)', columns: 'Columns', repeat: 'Repeating items',
  heading: 'Heading', text: 'Text', richtext: 'Formatted text', image: 'Image', button: 'Button', video: 'Video', divider: 'Divider line', spacer: 'Space',
};

const KEY_BASE: Partial<Record<LayoutNodeType, string>> = { heading: 'title', text: 'text', richtext: 'content', image: 'image', button: 'button', video: 'video' };

/** Every field name already used in the tree (a button also owns `<name>Link`). */
export function collectKeys(node: LayoutNode, into = new Set<string>()): Set<string> {
  if (node.key) { into.add(node.key); if (node.t === 'button') into.add(`${node.key}Link`); }
  for (const c of node.children ?? []) collectKeys(c, into);
  return into;
}

export function uniqueKey(type: LayoutNodeType, taken: ReadonlySet<string>): string {
  const base = KEY_BASE[type] ?? 'field';
  for (let n = 1; n < 200; n++) {
    const key = n === 1 ? base : `${base}${n}`;
    if (!taken.has(key) && !taken.has(`${key}Link`)) return key;
  }
  return `${base}${Date.now() % 100000}`;
}

/** A new element with its starting properties (the server fills in anything left out). */
export function newNode(type: LayoutNodeType, root: LayoutNode): LayoutNode {
  const key = hasField(type) ? uniqueKey(type, collectKeys(root)) : undefined;
  switch (type) {
    case 'stack': return { t: 'stack', gap: 16, align: 'left', children: [] };
    case 'columns': return { t: 'columns', cols: 2, gap: 24, valign: 'top', children: [] };
    case 'repeat': return { t: 'repeat', label: 'Item', initial: 3, cols: 3, gap: 24, card: true, align: 'left', children: [] };
    case 'heading': return { t: 'heading', key, label: 'Heading', default: 'Your heading', size: 'md', align: 'inherit', tag: 'h2' };
    case 'text': return { t: 'text', key, label: 'Text', default: 'Write something here.', size: 'md', align: 'inherit' };
    case 'richtext': return { t: 'richtext', key, label: 'Formatted text', align: 'inherit' };
    case 'image': return { t: 'image', key, label: 'Image', ratio: 'auto', fit: 'cover', radius: 0 };
    case 'button': return { t: 'button', key, label: 'Button', default: 'Learn more', style: 'solid', align: 'inherit' };
    case 'video': return { t: 'video', key, label: 'Video', ratio: '16:9' };
    case 'divider': return { t: 'divider' };
    case 'spacer': return { t: 'spacer', h: 24 };
  }
}

/** The node at `path` (`[]` = the root). */
export function getAt(root: LayoutNode, path: NodePath): LayoutNode | undefined {
  let cur: LayoutNode | undefined = root;
  for (const i of path) cur = cur?.children?.[i];
  return cur;
}

function mapAt(root: LayoutNode, path: NodePath, fn: (n: LayoutNode) => LayoutNode): LayoutNode {
  if (path.length === 0) return fn(root);
  const [head, ...rest] = path;
  const kids = root.children ?? [];
  if (head < 0 || head >= kids.length) return root;
  return { ...root, children: kids.map((c, i) => (i === head ? mapAt(c, rest, fn) : c)) };
}

export const updateAt = (root: LayoutNode, path: NodePath, patch: Partial<LayoutNode>): LayoutNode => mapAt(root, path, n => ({ ...n, ...patch }));

export function insertChild(root: LayoutNode, parent: NodePath, node: LayoutNode, index?: number): LayoutNode {
  return mapAt(root, parent, p => {
    const kids = [...(p.children ?? [])];
    kids.splice(index ?? kids.length, 0, node);
    return { ...p, children: kids };
  });
}

export function removeAt(root: LayoutNode, path: NodePath): LayoutNode {
  if (path.length === 0) return root; // the root can not be removed
  const parent = path.slice(0, -1);
  const idx = path[path.length - 1];
  return mapAt(root, parent, p => ({ ...p, children: (p.children ?? []).filter((_, i) => i !== idx) }));
}

/** Moves a node one place up (-1) or down (+1) among its siblings. */
export function moveWithin(root: LayoutNode, path: NodePath, dir: -1 | 1): LayoutNode {
  if (path.length === 0) return root;
  const parent = path.slice(0, -1);
  const idx = path[path.length - 1];
  return mapAt(root, parent, p => {
    const kids = [...(p.children ?? [])];
    const to = idx + dir;
    if (to < 0 || to >= kids.length) return p;
    [kids[idx], kids[to]] = [kids[to], kids[idx]];
    return { ...p, children: kids };
  });
}

/** A copy of a node whose field names are fresh (so two elements never share a field). */
export function cloneWithFreshKeys(node: LayoutNode, root: LayoutNode): LayoutNode {
  const taken = collectKeys(root);
  const walk = (n: LayoutNode): LayoutNode => {
    const copy: LayoutNode = { ...n };
    if (hasField(n.t)) { copy.key = uniqueKey(n.t, taken); taken.add(copy.key); if (n.t === 'button') taken.add(`${copy.key}Link`); }
    if (n.children) copy.children = n.children.map(walk);
    return copy;
  };
  return walk(node);
}

export function duplicateAt(root: LayoutNode, path: NodePath): LayoutNode {
  const node = getAt(root, path);
  if (!node || path.length === 0) return root;
  if (node.t === 'repeat') return root; // only one repeating group per section
  return insertChild(root, path.slice(0, -1), cloneWithFreshKeys(node, root), path[path.length - 1] + 1);
}

export const countNodes = (n: LayoutNode): number => 1 + (n.children ?? []).reduce((a, c) => a + countNodes(c), 0);
export const hasRepeat = (n: LayoutNode): boolean => n.t === 'repeat' || (n.children ?? []).some(hasRepeat);

/** Can `child` be placed inside the container at `parentPath`? (one repeating group per section, never inside another) */
export function canAdd(root: LayoutNode, parentPath: NodePath, child: LayoutNodeType): string | null {
  const parent = getAt(root, parentPath);
  if (!parent || !isContainer(parent.t)) return 'Elements can only be added inside a group, columns or repeating items.';
  if (child === 'repeat') {
    if (hasRepeat(root)) return 'A section can have only one repeating group.';
    // inside an existing repeat is also impossible, handled by hasRepeat(root) above
  }
  if (countNodes(root) >= 60) return 'The layout is full (60 elements at most).';
  if ((parent.children?.length ?? 0) >= (parent.t === 'columns' || parent.t === 'repeat' ? 12 : 20)) return 'This group is full.';
  return null;
}

/** The form fields a layout implies, split into the section's own and the repeating items' (mirrors the server's derivation). */
export function deriveFields(layout: LayoutNode): { fields: StoreFieldDef[]; blockFields: StoreFieldDef[]; defaults: Record<string, string>; blockDefaults: Record<string, string>; blockLabel: string | null; initial: number } {
  const fields: StoreFieldDef[] = [];
  const blockFields: StoreFieldDef[] = [];
  const defaults: Record<string, string> = {};
  const blockDefaults: Record<string, string> = {};
  let blockLabel: string | null = null;
  let initial = 0;
  const add = (inRepeat: boolean, f: StoreFieldDef, dflt?: string) => {
    (inRepeat ? blockFields : fields).push(f);
    if (dflt) (inRepeat ? blockDefaults : defaults)[f.key] = dflt;
  };
  const walk = (n: LayoutNode, inRepeat: boolean) => {
    if (n.t === 'repeat') { blockLabel = n.label || 'Item'; initial = n.initial ?? 3; }
    const key = n.key ?? '';
    const label = n.label || key;
    switch (n.t) {
      case 'heading': add(inRepeat, { key, label, kind: 'text' }, n.default); break;
      case 'text': add(inRepeat, { key, label, kind: 'textarea' }, n.default); break;
      case 'richtext': add(inRepeat, { key, label, kind: 'richtext' }); break;
      case 'image': add(inRepeat, { key, label, kind: 'image' }); break;
      case 'video': add(inRepeat, { key, label, kind: 'video' }); break;
      case 'button':
        add(inRepeat, { key, label: `${label} (text)`, kind: 'text' }, n.default || 'Learn more');
        add(inRepeat, { key: `${key}Link`, label: `${label} (link)`, kind: 'link' });
        break;
      default: break;
    }
    for (const c of n.children ?? []) walk(c, inRepeat || n.t === 'repeat');
  };
  walk(layout, false);
  return { fields, blockFields, defaults, blockDefaults, blockLabel, initial };
}

/** Sample values for the builder's live preview: the starting texts, and `initial` items. */
export function previewData(layout: LayoutNode): { settings: Record<string, unknown>; blocks: { settings: Record<string, unknown> }[] } {
  const d = deriveFields(layout);
  return { settings: { ...d.defaults }, blocks: Array.from({ length: d.initial }, () => ({ settings: { ...d.blockDefaults } })) };
}

// ── starting points ──────────────────────────────────────────────────────────

const h = (key: string, dflt: string, extra: Partial<LayoutNode> = {}): LayoutNode => ({ t: 'heading', key, label: key === 'title' ? 'Title' : key, default: dflt, size: 'md', align: 'inherit', tag: 'h2', ...extra });
const tx = (key: string, dflt: string, extra: Partial<LayoutNode> = {}): LayoutNode => ({ t: 'text', key, label: key, default: dflt, size: 'md', align: 'inherit', ...extra });
const btn = (key: string, dflt: string, extra: Partial<LayoutNode> = {}): LayoutNode => ({ t: 'button', key, label: 'Button', default: dflt, style: 'solid', align: 'inherit', ...extra });
const img = (key: string, extra: Partial<LayoutNode> = {}): LayoutNode => ({ t: 'image', key, label: 'Image', ratio: 'auto', fit: 'cover', radius: 0, ...extra });
const stack = (children: LayoutNode[], extra: Partial<LayoutNode> = {}): LayoutNode => ({ t: 'stack', gap: 16, align: 'left', children, ...extra });

export interface Starter { id: string; name: string; description: string; layout: LayoutNode }

export const STARTERS: Starter[] = [
  { id: 'blank', name: 'Blank', description: 'Just a heading. Add everything else yourself.', layout: stack([h('title', 'Your heading', { label: 'Heading' })]) },
  { id: 'text-cta', name: 'Heading, text and button', description: 'A simple centred message with a call to action.',
    layout: stack([h('title', 'Say something great', { size: 'lg', label: 'Heading' }), tx('text', 'A short line that explains why visitors should care.', { size: 'lg', label: 'Text' }), btn('button', 'Shop now')], { align: 'center', gap: 20, maxWidth: 720 }) },
  { id: 'image-text', name: 'Image and text side by side', description: 'A photo on one side, words and a button on the other.',
    layout: stack([{ t: 'columns', cols: 2, gap: 40, valign: 'center', children: [img('image', { ratio: '4:3', radius: 12 }), stack([h('title', 'Tell your story', { label: 'Heading' }), tx('text', 'Describe what makes your products different.', { label: 'Text' }), btn('button', 'Read more')], { gap: 14 })] }]) },
  { id: 'feature-cards', name: 'Feature cards', description: 'A heading, then a row of cards: picture, title and text.',
    layout: stack([h('title', 'Why shop with us', { align: 'center', label: 'Heading' }), { t: 'repeat', label: 'Card', initial: 3, cols: 3, gap: 24, card: true, align: 'left', children: [img('cardImage', { ratio: '4:3', radius: 10, label: 'Card image' }), h('cardTitle', 'Fast delivery', { size: 'sm', tag: 'h3', label: 'Card title' }), tx('cardText', 'Orders leave our shop within one working day.', { size: 'sm', label: 'Card text' })] }], { gap: 28 }) },
  { id: 'pricing', name: 'Pricing cards', description: 'Plans side by side: name, price, what is included, a button.',
    layout: stack([h('title', 'Choose your plan', { align: 'center', label: 'Heading' }), { t: 'repeat', label: 'Plan', initial: 3, cols: 3, gap: 24, card: true, align: 'center', children: [h('planName', 'Starter', { size: 'sm', tag: 'h3', label: 'Plan name' }), h('price', '$19', { size: 'lg', tag: 'h3', label: 'Price' }), { t: 'richtext', key: 'features', label: 'What is included', align: 'inherit' }, btn('planButton', 'Choose plan', { label: 'Plan button' })] }], { gap: 28 }) },
  { id: 'team', name: 'People / testimonials', description: 'Round photos with a name, a role and a quote.',
    layout: stack([h('title', 'What customers say', { align: 'center', label: 'Heading' }), { t: 'repeat', label: 'Person', initial: 3, cols: 3, gap: 24, card: false, align: 'center', children: [img('photo', { ratio: 'square', radius: 48, label: 'Photo', maxHeight: 140 }), h('name', 'Alex Morgan', { size: 'sm', tag: 'h3', label: 'Name' }), tx('role', 'Happy customer', { size: 'sm', muted: true, label: 'Role' }), tx('quote', 'Great quality and super fast delivery.', { label: 'Quote' })] }], { gap: 28 }) },
];
