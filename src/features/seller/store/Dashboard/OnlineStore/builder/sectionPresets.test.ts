import { describe, it, expect } from 'vitest';
import { SECTION_PRESETS, PAGE_LAYOUTS, PRESET_CATEGORIES } from './sectionPresets';
import { SECTION_META_BY_TYPE } from './sectionRegistry';

describe('section presets', () => {
  it('have unique ids and a known category', () => {
    const ids = SECTION_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = PRESET_CATEGORIES.map(c => c.id);
    for (const p of SECTION_PRESETS) expect(cats).toContain(p.category);
  });

  it('only use real section types and the block types that section allows', () => {
    for (const p of SECTION_PRESETS) {
      const meta = SECTION_META_BY_TYPE[p.type];
      expect(meta, p.id).toBeDefined();
      for (const b of p.build().blocks) expect(meta.allowedBlockTypes, `${p.id} → ${b.type}`).toContain(b.type);
    }
  });

  it('never ship images or links the merchant did not choose', () => {
    for (const p of SECTION_PRESETS) {
      const built = p.build();
      for (const s of [built.settings, ...built.blocks.map(b => b.settings)]) {
        for (const [k, v] of Object.entries(s)) if (/url$/i.test(k)) expect(v, `${p.id}.${k}`).toBe('');
      }
    }
  });

  it('give every testimonial the fields the server requires', () => {
    const quotes = SECTION_PRESETS.find(p => p.id === 'reviews-3')!.build().blocks;
    for (const b of quotes) expect(b.settings).toMatchObject({ quote: expect.any(String), authorName: expect.any(String), rating: expect.any(Number) });
  });

  it('start a countdown in the future', () => {
    const t = SECTION_PRESETS.find(p => p.id === 'countdown-sale')!.build().settings.targetDate as string;
    expect(new Date(t).getTime()).toBeGreaterThan(Date.now());
  });

  it('page layouts only reference existing designs', () => {
    const ids = new Set(SECTION_PRESETS.map(p => p.id));
    for (const l of PAGE_LAYOUTS) for (const id of l.presets) expect(ids.has(id), `${l.id} → ${id}`).toBe(true);
  });
});
