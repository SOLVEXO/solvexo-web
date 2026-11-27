import { describe, expect, it } from 'vitest';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { convertForeignSection, isForeignThemeKey } from './foreignSection';

const sec = (settings: Record<string, unknown>) => ({ _id: 's', type: 'theme_section', settings } as unknown as Section);
const blk = (settings: Record<string, unknown>) => ({ _id: 'b', type: 'theme_block', settings } as unknown as Block);

describe('foreign theme sections', () => {
  it('spots only another theme\'s key', () => {
    expect(isForeignThemeKey('tech.bento_grid', 'maison.')).toBe(true);
    expect(isForeignThemeKey('maison.lookbook', 'maison.')).toBe(false);
    expect(isForeignThemeKey('my.abc', 'maison.')).toBe(false);
  });
  it('photos only become a gallery', () => {
    const c = convertForeignSection(sec({ sectionKey: 'maison.lookbook', heading: 'Looks' }), [blk({ imageUrl: 'https://x/1.jpg' }), blk({ imageUrl: 'https://x/2.jpg' })]);
    expect(c?.section.type).toBe('gallery_grid');
    expect(c?.blocks).toHaveLength(2);
    expect(c?.section.settings.heading).toBe('Looks');
  });
  it('photo + text becomes image with text', () => {
    const c = convertForeignSection(sec({ sectionKey: 'ledup.projects' }), [blk({ imageUrl: 'https://x/1.jpg', title: 'A', text: 'B' })]);
    expect(c?.section.type).toBe('image_with_text');
    expect(c?.blocks[0].settings.heading).toBe('A');
  });
  it('keeps a typed table and big-number values', () => {
    const t = convertForeignSection(sec({ sectionKey: 'maison.size_guide', rows: 'Size | Chest\nS | 86' }), []);
    expect(t?.section.type).toBe('custom_html');
    expect(String(t?.section.settings.html)).toContain('<td');
    const v = convertForeignSection(sec({ sectionKey: 'tech.spec_highlights' }), [blk({ value: '16GB', title: 'Memory' })]);
    expect(v?.section.type).toBe('feature_list');
    expect(v?.blocks[0].settings.title).toBe('16GB');
  });
  it('titles without photos become a feature list; text only becomes rich text; empty is dropped', () => {
    expect(convertForeignSection(sec({ sectionKey: 'tech.feature_strip' }), [blk({ title: 'Fast', text: 'Quick' })])?.section.type).toBe('feature_list');
    expect(convertForeignSection(sec({ sectionKey: 'ledup.statement', heading: 'Hi', text: 'There' }), [])?.section.type).toBe('rich_text');
    expect(convertForeignSection(sec({ sectionKey: 'tech.x' }), [])).toBeNull();
  });
});
