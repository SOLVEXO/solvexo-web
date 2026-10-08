import { describe, expect, it } from 'vitest';
import type { ThemePackageStructure } from '@/api/services/storeTheme';
import {
  addLiquidBlock,
  addLiquidSection,
  getAddableLiquidSections,
  moveLiquidBlock,
  moveLiquidSection,
  parseLiquidJsonTemplate,
  parseLiquidThemeSettingsData,
  removeLiquidBlock,
  removeLiquidSection,
  setLiquidBlockDisabled,
  setLiquidSectionDisabled,
  updateLiquidThemeSetting,
  type LiquidJsonTemplate,
} from './shopifyTemplateEditor.utils';

const structure: ThemePackageStructure = {
  version: 1,
  templates: ['index.json'],
  sectionGroups: ['sections/header-group.json'],
  themeSettings: [],
  components: [
    {
      kind: 'section',
      type: 'hero',
      path: 'sections/hero.liquid',
      schema: {
        name: 'Hero',
        limit: 1,
        presets: [{ name: 'Hero', settings: { title: 'Welcome' }, blocks: [{ type: 'slide', settings: { title: 'First' } }] }],
        blocks: [{ type: 'slide', name: 'Slide', limit: 3, settings: [{ id: 'title', type: 'text', default: 'Default slide' }] }],
        max_blocks: 3,
      },
    },
    {
      kind: 'section',
      type: 'footer-promo',
      path: 'sections/footer-promo.liquid',
      schema: { name: 'Footer Promo', presets: [{ name: 'Footer Promo' }], enabled_on: { templates: ['product'] } },
    },
    {
      kind: 'section',
      type: 'header-widget',
      path: 'sections/header-widget.liquid',
      schema: { name: 'Header Widget', presets: [{ name: 'Header Widget' }], enabled_on: { groups: ['header'] } },
    },
  ],
};

const emptyTemplate = (): LiquidJsonTemplate => ({ sections: {}, order: [] });

describe('Shopify JSON template editing utilities', () => {
  it('validates templates and rejects broken ordering', () => {
    expect(parseLiquidJsonTemplate('{"sections":{"hero":{"type":"hero"}},"order":["hero"]}').order).toEqual(['hero']);
    expect(() => parseLiquidJsonTemplate('{"sections":{},"order":["missing"]}')).toThrow('missing section');
  });

  it('edits Shopify global settings while preserving other settings data', () => {
    const data = parseLiquidThemeSettingsData('{"current":{"logo":"logo.png"},"presets":{"Default":{"color":"#fff"}}}');
    const updated = updateLiquidThemeSetting(data, 'color', '#222222');
    expect(updated.current).toEqual({ logo: 'logo.png', color: '#222222' });
    expect(updated.presets).toEqual({ Default: { color: '#fff' } });
    expect(() => parseLiquidThemeSettingsData('{"current":[]}')).toThrow('current settings object');
  });

  it('adds sections using theme presets and enforces template and section limits', () => {
    const added = addLiquidSection(emptyTemplate(), structure, 'hero', 'index');
    const id = added.order[0];
    const firstBlock = Object.values(added.sections[id].blocks ?? {})[0];
    expect(added.sections[id].type).toBe('hero');
    expect(added.sections[id].settings).toEqual({ title: 'Welcome' });
    expect(firstBlock).toEqual({ type: 'slide', settings: { title: 'First' } });
    expect(getAddableLiquidSections(added, structure, 'index').map((item) => item.type)).toEqual([]);
    expect(() => addLiquidSection(added, structure, 'hero', 'index')).toThrow('only 1');
    expect(getAddableLiquidSections(emptyTemplate(), structure, 'index').map((item) => item.type)).toEqual(['hero']);
  });

  it('adds a selected section preset instead of always using the first preset', () => {
    const presetStructure = {
      ...structure,
      components: [{
        ...structure.components[0],
        schema: {
          ...structure.components[0].schema,
          limit: undefined,
          presets: [
            { name: 'Image left', settings: { title: 'Left' } },
            { name: 'Image right', settings: { title: 'Right' } },
          ],
        },
      }],
    } as ThemePackageStructure;

    const added = addLiquidSection(emptyTemplate(), presetStructure, 'hero', 'index', 'template', 1);
    expect(added.sections[added.order[0]].settings).toEqual({ title: 'Right' });
  });

  it('adds, reorders, removes blocks and keeps template section order consistent', () => {
    const withHero = addLiquidSection(emptyTemplate(), structure, 'hero', 'index');
    const sectionId = withHero.order[0];
    const sectionSchema = structure.components[0].schema;
    const withSecondBlock = addLiquidBlock(withHero.sections[sectionId], sectionSchema, 'slide');
    expect(withSecondBlock.block_order).toHaveLength(2);
    const lastBlockId = withSecondBlock.block_order?.[1] ?? '';
    expect(moveLiquidBlock(withSecondBlock, lastBlockId, -1).block_order?.[0]).toBe(lastBlockId);
    const withThirdBlock = addLiquidBlock(withSecondBlock, sectionSchema, 'slide');
    expect(withThirdBlock.blocks?.[withThirdBlock.block_order?.[2] ?? ''].settings).toEqual({ title: 'Default slide' });
    expect(() => addLiquidBlock(withThirdBlock, sectionSchema, 'slide')).toThrow('only 3');
    const withoutBlock = removeLiquidBlock(withSecondBlock, lastBlockId);
    expect(withoutBlock.block_order).toHaveLength(1);

    const withSecondSection = addLiquidSection(withHero, {
      ...structure,
      components: [{ kind: 'section', type: 'footer-promo', path: 'sections/footer-promo.liquid', schema: { name: 'Footer Promo', presets: [{ name: 'Footer Promo' }] } }],
    }, 'footer-promo', 'index');
    expect(getAddableLiquidSections(emptyTemplate(), structure, 'index').map((item) => item.type)).not.toContain('header-widget');
    const headerGroup = { sections: {}, order: [], type: 'header' } as LiquidJsonTemplate;
    expect(getAddableLiquidSections(headerGroup, structure, 'header', 'group').map((item) => item.type)).toContain('header-widget');
    expect(() => addLiquidSection(headerGroup, structure, 'header-widget', 'header', 'group')).not.toThrow();
    expect(moveLiquidSection(withSecondSection, withSecondSection.order[1], -1).order[0]).toBe(withSecondSection.order[1]);
    expect(removeLiquidSection(withSecondSection, withSecondSection.order[0]).order).toHaveLength(1);
  });

  it('toggles section and block visibility without changing their settings or ordering', () => {
    const withHero = addLiquidSection(emptyTemplate(), structure, 'hero', 'index');
    const sectionId = withHero.order[0];
    const hiddenSection = setLiquidSectionDisabled(withHero, sectionId, true);
    expect(hiddenSection.sections[sectionId].disabled).toBe(true);
    expect(hiddenSection.sections[sectionId].settings).toEqual({ title: 'Welcome' });
    expect(setLiquidSectionDisabled(hiddenSection, sectionId, false).sections[sectionId].disabled).toBe(false);

    const sectionSchema = structure.components[0].schema;
    const withBlock = addLiquidBlock(withHero.sections[sectionId], sectionSchema, 'slide');
    const blockId = withBlock.block_order?.[0] ?? '';
    const hiddenBlock = setLiquidBlockDisabled(withBlock, blockId, true);
    expect(hiddenBlock.blocks?.[blockId].disabled).toBe(true);
    expect(hiddenBlock.block_order).toEqual(withBlock.block_order);
    expect(setLiquidBlockDisabled(hiddenBlock, blockId, false).blocks?.[blockId].disabled).toBe(false);
  });
});
