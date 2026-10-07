import { describe, expect, it } from 'vitest';
import { SECTION_META, BLOCK_SCHEMAS } from './sectionRegistry';
import { SECTION_TYPES } from '@/api/services/storefrontTypes';
import { getRegisteredAtelierSectionTypes } from '@/features/storefront-themes/theme-01-atelier/sections';
import { getRegisteredNovaSectionTypes } from '@/features/storefront-themes/theme-02-nova/sections';

describe('storefront section library', () => {
  it('has editor metadata and an editor form for every section type', () => {
    const registeredTypes = SECTION_META.map(meta => meta.type);
    expect(new Set(registeredTypes).size).toBe(registeredTypes.length);
    expect(registeredTypes.every(type => SECTION_TYPES.includes(type))).toBe(true);
    expect(SECTION_META.every(meta => Array.isArray(meta.settingsSchema))).toBe(true);
  });

  it.each([
    ['Atelier', getRegisteredAtelierSectionTypes()],
    ['Nova', getRegisteredNovaSectionTypes()],
  ] as const)('%s only offers sections that have a live renderer', (_theme, registeredTypes) => {
    const available = new Set(registeredTypes);
    expect(SECTION_META.filter(meta => !meta.hidden).every(meta => available.has(meta.type))).toBe(true);
  });

  it('has editor schemas for each section block type', () => {
    const blockTypes = SECTION_META.flatMap(meta => meta.allowedBlockTypes);
    expect(blockTypes.every(type => Array.isArray(BLOCK_SCHEMAS[type]))).toBe(true);
  });

  it('provides desktop column controls for product and category grids', () => {
    for (const type of ['featured_products', 'product_catalog', 'featured_category_grid', 'collection_product_grid'] as const) {
      expect(SECTION_META.find(meta => meta.type === type)?.settingsSchema.some(field => field.key === 'columns')).toBe(true);
    }
  });
});
