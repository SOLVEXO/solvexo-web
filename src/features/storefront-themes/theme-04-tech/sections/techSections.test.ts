import { beforeEach, describe, expect, it } from 'vitest';
import { THEME_MANIFESTS } from '../../themeManifest';
import '../theme.manifest';
import './register';
import { techCustom } from './techSections';
import { getRegisteredTechSectionTypes } from './techSectionRegistry';
import { applyMerchantThemeOverrides, techTheme } from '../theme.config';
import { COMPARE_MAX, toCompareProduct } from '../components/compare';
import type { PublicStoreProduct } from '@/api/services/store';

const manifest = THEME_MANIFESTS['theme-04-tech'];

describe('Tech custom sections', () => {
  it('declares eleven sections, all namespaced and each with a renderer', () => {
    const defs = manifest.customSections ?? [];
    expect(defs).toHaveLength(11);
    for (const d of defs) {
      expect(d.key.startsWith('tech.'), d.key).toBe(true);
      expect(techCustom.has(d.key), `renderer for ${d.key}`).toBe(true);
    }
    expect(new Set(defs.map(d => d.key)).size).toBe(defs.length);
  });

  it('keeps inside the backend limits (60 fields, 20 blocks, simple keys)', () => {
    for (const d of manifest.customSections ?? []) {
      expect(d.fields.length + (d.block?.fields.length ?? 0), d.key).toBeLessThanOrEqual(60);
      expect(d.initialBlocks ?? 0, d.key).toBeLessThanOrEqual(20);
      for (const f of [...d.fields, ...(d.block?.fields ?? [])]) expect(/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(f.key), `${d.key}.${f.key}`).toBe(true);
    }
  });

  it('every section has at least one preset, and a preset only fills fields the section really has', () => {
    for (const d of manifest.customSections ?? []) {
      expect((d.presets ?? []).length, d.key).toBeGreaterThan(0);
      const sectionKeys = new Set(d.fields.map(f => f.key));
      const blockKeys = new Set((d.block?.fields ?? []).map(f => f.key));
      for (const p of d.presets ?? []) {
        for (const k of Object.keys(p.settings ?? {})) expect(sectionKeys.has(k), `${d.key}/${p.id} setting ${k}`).toBe(true);
        expect((p.blocks ?? []).length, `${d.key}/${p.id} blocks`).toBeLessThanOrEqual(20);
        if (p.blocks?.length) expect(d.block, `${d.key}/${p.id} has blocks but the section has none`).toBeTruthy();
        for (const b of p.blocks ?? []) for (const k of Object.keys(b)) expect(blockKeys.has(k), `${d.key}/${p.id} block field ${k}`).toBe(true);
      }
    }
  });

  it('a section type is registered for every platform type the Tech pages rely on', () => {
    const types = getRegisteredTechSectionTypes();
    for (const t of ['hero', 'featured_products', 'collection_product_grid', 'product_catalog', 'theme_section', 'page_content', 'rich_text', 'faq', 'newsletter', 'testimonials', 'video', 'logo_list', 'gallery_grid', 'contact_form', 'featured_category_grid']) {
      expect(types, t).toContain(t);
    }
  });
});

describe('Tech layout settings', () => {
  beforeEach(() => applyMerchantThemeOverrides(null));

  it('reads filter layout, gallery, checkout summary and compare, and falls back on bad values', () => {
    applyMerchantThemeOverrides({ themeSettings: { techFilterLayout: 'drawer', techGallery: 'left', techCheckoutSummary: 'left', techCompare: 'hide' } });
    expect([techTheme.filterLayout, techTheme.gallery, techTheme.checkoutSummary, techTheme.compare]).toEqual(['drawer', 'left', 'left', false]);
    applyMerchantThemeOverrides({ themeSettings: { techFilterLayout: 'x', techGallery: 1, techCheckoutSummary: 0, techCompare: 'show' } });
    expect([techTheme.filterLayout, techTheme.gallery, techTheme.checkoutSummary, techTheme.compare]).toEqual(['sidebar', 'bottom', 'right', true]);
  });

  it('the settings are offered in the editor with help text', () => {
    const keys = manifest.themeSettingsFields.map(f => String(f.key));
    for (const k of ['custom.techFilterLayout', 'custom.techGallery', 'custom.techCheckoutSummary', 'custom.techCompare']) expect(keys).toContain(k);
  });
});

describe('Compare data', () => {
  const product = (over: Partial<PublicStoreProduct> = {}): PublicStoreProduct => ({
    _id: 'p1', slug: 'p-1', name: 'Laptop', images: ['a.jpg'], defaultVariantPrice: 100, compareAtPrice: null, averageRating: 4, inStock: true, tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    variants: [{ options: [{ name: 'RAM', value: '8GB' }] }, { options: [{ name: 'RAM', value: '16GB' }, { name: 'Color', value: 'Black' }] }], ...over,
  });

  it('stores only real list fields and groups variant options by name', () => {
    const c = toCompareProduct(product());
    expect(c.image).toBe('a.jpg');
    expect(c.options).toEqual([{ name: 'RAM', values: ['8GB', '16GB'] }, { name: 'Color', values: ['Black'] }]);
    expect(c.tags).toHaveLength(6);
    expect(Object.keys(c)).not.toContain('variants');
  });

  it('allows four products', () => {
    expect(COMPARE_MAX).toBe(4);
  });
});
