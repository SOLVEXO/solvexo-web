import { describe, expect, it } from 'vitest';
import '@/features/storefront-themes/theme-03-fashion/theme.manifest';
import { customSectionsOf, findCustomBlockDef } from '@/features/storefront-themes/themeManifest';
import { customBlockSchema, metaForCustomDef, newCustomSection, resolveSectionMeta } from './themeSectionMeta';

const THEME = 'theme-03-fashion';

describe('theme-declared sections', () => {
  it('Maison declares its own sections with namespaced keys and unique keys', () => {
    const defs = customSectionsOf(THEME, THEME);
    expect(defs.map(d => d.key)).toEqual(['maison.lookbook', 'maison.size_guide']);
    expect(new Set(defs.map(d => d.key)).size).toBe(defs.length);
    expect(defs.every(d => /^[a-z][a-z0-9_.-]{0,59}$/.test(d.key))).toBe(true);
  });

  it('a saved theme_section resolves to editor metadata with the theme-declared fields', () => {
    const meta = resolveSectionMeta({ type: 'theme_section', settings: { sectionKey: 'maison.lookbook' } });
    expect(meta?.label).toBe('Lookbook');
    expect(meta?.settingsSchema.some(f => f.key === 'heading')).toBe(true);
    expect(meta?.allowedBlockTypes).toEqual(['theme_block']);
    expect(resolveSectionMeta({ type: 'theme_section', settings: { sectionKey: 'unknown.section' } })).toBeUndefined();
  });

  it('built-in section types still resolve from the shared catalogue', () => {
    expect(resolveSectionMeta({ type: 'hero', settings: {} })?.label).toBeTruthy();
  });

  it('a new custom section starts with its defaults and the declared number of blocks', () => {
    const def = customSectionsOf(THEME, THEME)[0];
    const created = newCustomSection(def);
    expect(created.type).toBe('theme_section');
    expect(created.settings.sectionKey).toBe('maison.lookbook');
    expect(created.blocks).toHaveLength(3);
    expect(created.blocks[0]).toMatchObject({ type: 'theme_block', settings: { blockKey: 'maison.lookbook.look' } });
    expect(metaForCustomDef(customSectionsOf(THEME, THEME)[1]).allowedBlockTypes).toEqual([]);
  });

  it('a saved theme_block resolves its form fields by blockKey', () => {
    expect(customBlockSchema('maison.lookbook.look')?.some(f => f.key === 'imageUrl')).toBe(true);
    expect(findCustomBlockDef('maison.lookbook.nope')).toBeUndefined();
    expect(customBlockSchema(undefined)).toBeUndefined();
  });

  it('a preset overrides the defaults and pre-fills its own blocks', () => {
    const [lookbook, sizeGuide] = customSectionsOf(THEME, THEME);
    const preset = lookbook.presets?.find(p => p.id === 'six-grid');
    expect(preset).toBeTruthy();
    const created = newCustomSection(lookbook, preset);
    expect(created.settings).toMatchObject({ sectionKey: 'maison.lookbook', heading: 'Lookbook', columns: 3 });
    expect(created.blocks).toHaveLength(6);
    expect(created.blocks[5]).toMatchObject({ type: 'theme_block', settings: { blockKey: 'maison.lookbook.look', title: 'Look 6' } });
    const sizes = newCustomSection(sizeGuide, sizeGuide.presets?.[0]);
    expect(String(sizes.settings.rows).split(String.fromCharCode(10))).toHaveLength(6);
    expect(sizes.blocks).toEqual([]);
  });

  it('every preset id is unique within its section', () => {
    for (const def of customSectionsOf(THEME, THEME)) {
      const ids = (def.presets ?? []).map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
