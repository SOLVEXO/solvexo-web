import { describe, it, expect } from 'vitest';
import type { LayoutNode } from '@/api/services/storeSectionDefs';
import {
  STARTERS, canAdd, cloneWithFreshKeys, collectKeys, countNodes, deriveFields, duplicateAt, getAt, insertChild, moveWithin, newNode, previewData, removeAt, uniqueKey, updateAt,
} from './layoutTree';

const root = (...children: LayoutNode[]): LayoutNode => ({ t: 'stack', children });

describe('field names', () => {
  it('picks a readable name and numbers it when taken', () => {
    expect(uniqueKey('heading', new Set())).toBe('title');
    expect(uniqueKey('heading', new Set(['title']))).toBe('title2');
    expect(uniqueKey('text', new Set(['text', 'text2']))).toBe('text3');
    // a button also owns <name>Link
    expect(uniqueKey('button', new Set(['buttonLink']))).toBe('button2');
  });

  it('never gives two elements the same field name, however they are added', () => {
    let tree = root();
    for (const t of ['heading', 'heading', 'text', 'button', 'button', 'image', 'image'] as const) tree = insertChild(tree, [], newNode(t, tree));
    const keys = (tree.children ?? []).map(c => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('tree editing', () => {
  const a = { t: 'heading', key: 'a' } as LayoutNode;
  const b = { t: 'text', key: 'b' } as LayoutNode;
  const c = { t: 'image', key: 'c' } as LayoutNode;

  it('inserts at an index, finds by path, updates and removes without touching the original', () => {
    const t0 = root(a, c);
    const t1 = insertChild(t0, [], b, 1);
    expect((t1.children ?? []).map(n => n.key)).toEqual(['a', 'b', 'c']);
    expect((t0.children ?? []).length).toBe(2);
    expect(getAt(t1, [1])?.key).toBe('b');
    expect(getAt(updateAt(t1, [1], { default: 'x' }), [1])?.default).toBe('x');
    expect((removeAt(t1, [0]).children ?? []).map(n => n.key)).toEqual(['b', 'c']);
    expect(removeAt(t1, [])).toBe(t1); // the root stays
  });

  it('works inside nested containers', () => {
    const t = root({ t: 'columns', children: [a, { t: 'stack', children: [b] }] });
    expect(getAt(t, [0, 1, 0])?.key).toBe('b');
    expect(getAt(removeAt(t, [0, 1, 0]), [0, 1])?.children).toEqual([]);
  });

  it('moves a node among its siblings and stops at the ends', () => {
    const t = root(a, b, c);
    expect((moveWithin(t, [2], -1).children ?? []).map(n => n.key)).toEqual(['a', 'c', 'b']);
    expect((moveWithin(t, [0], 1).children ?? []).map(n => n.key)).toEqual(['b', 'a', 'c']);
    expect(moveWithin(t, [0], -1)).toEqual(t);
    expect(moveWithin(t, [2], 1)).toEqual(t);
  });

  it('duplicate gives fresh field names (also for a button\'s link) and refuses a repeating group', () => {
    const t = root({ t: 'button', key: 'button', label: 'B' } as LayoutNode, { t: 'repeat', children: [] } as LayoutNode);
    const d = duplicateAt(t, [0]);
    const keys = collectKeys(d);
    expect((d.children ?? [])[1].key).toBe('button2');
    expect(keys.has('button2Link')).toBe(true);
    expect(duplicateAt(t, [1])).toBe(t);
    const nested = cloneWithFreshKeys({ t: 'stack', children: [a, b] } as LayoutNode, root(a, b));
    expect((nested.children ?? []).map(n => n.key)).toEqual(['title', 'text']);
  });
});

describe('what can be added where', () => {
  it('only into a container', () => {
    const t = root({ t: 'heading', key: 'a' } as LayoutNode);
    expect(canAdd(t, [0], 'text')).toMatch(/inside a group/);
    expect(canAdd(t, [], 'text')).toBeNull();
  });
  it('one repeating group per section', () => {
    const t = root({ t: 'repeat', children: [] } as LayoutNode);
    expect(canAdd(t, [], 'repeat')).toMatch(/only one repeating/);
    expect(canAdd(root(), [], 'repeat')).toBeNull();
  });
  it('stops at the size limits', () => {
    const full = root(...Array.from({ length: 20 }, () => ({ t: 'divider' }) as LayoutNode));
    expect(canAdd(full, [], 'text')).toMatch(/full/);
    const big = root(...Array.from({ length: 4 }, () => ({ t: 'stack', children: Array.from({ length: 14 }, () => ({ t: 'divider' }) as LayoutNode) }) as LayoutNode));
    expect(countNodes(big)).toBe(61);
    expect(canAdd(big, [0], 'text')).toMatch(/60/);
  });
});

describe('deriveFields (mirrors the server)', () => {
  it('splits the section\'s fields from the repeating items\' and collects the starting texts', () => {
    const d = deriveFields(root(
      { t: 'heading', key: 'title', label: 'Title', default: 'Hi' } as LayoutNode,
      { t: 'repeat', label: 'Card', initial: 4, children: [{ t: 'button', key: 'cta', label: 'Go', default: 'Open' } as LayoutNode, { t: 'image', key: 'pic', label: 'Pic' } as LayoutNode] } as LayoutNode,
    ));
    expect(d.fields.map(f => f.key)).toEqual(['title']);
    expect(d.blockFields.map(f => `${f.key}:${f.kind}`)).toEqual(['cta:text', 'ctaLink:link', 'pic:image']);
    expect(d.defaults).toEqual({ title: 'Hi' });
    expect(d.blockDefaults).toEqual({ cta: 'Open' });
    expect(d.blockLabel).toBe('Card');
    expect(d.initial).toBe(4);
  });

  it('preview data has the starting texts and the starting number of items', () => {
    const p = previewData(STARTERS.find(s => s.id === 'feature-cards')!.layout);
    expect(p.blocks).toHaveLength(3);
    expect(p.settings.title).toBeTruthy();
    expect(p.blocks[0].settings.cardTitle).toBe('Fast delivery');
  });
});

describe('starting points', () => {
  it('every starter is a valid shape: starts with a stack, unique field names, at most one repeat', () => {
    for (const s of STARTERS) {
      expect(s.layout.t).toBe('stack');
      const keys: string[] = [];
      let repeats = 0;
      const walk = (n: LayoutNode) => { if (n.key) keys.push(n.key); if (n.t === 'repeat') repeats++; (n.children ?? []).forEach(walk); };
      walk(s.layout);
      expect(new Set(keys).size).toBe(keys.length);
      expect(repeats).toBeLessThanOrEqual(1);
      expect(countNodes(s.layout)).toBeLessThanOrEqual(60);
    }
  });
});
