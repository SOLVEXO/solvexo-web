import { describe, expect, it } from 'vitest';
import { ALL_PLATFORM_PRODUCTS } from './platformProducts';
import { SOLUTIONS } from './solutions';
import { PLATFORM_PRODUCTS_AR } from './platformProducts.ar';
import { SOLUTIONS_AR } from './solutions.ar';
import { localizeProduct, localizeSolution } from './localizedData';

describe('Arabic product/solution data', () => {
  it.each(ALL_PLATFORM_PRODUCTS.map(p => [p.slug, p] as const))('product %s has a complete Arabic entry', (slug, en) => {
    const ar = PLATFORM_PRODUCTS_AR[slug];
    expect(ar).toBeDefined();
    for (const key of ['name', 'tagline', 'heroHeadline', 'heroSubtext'] as const) expect(ar[key].trim()).not.toBe('');
    expect(ar.benefits).toHaveLength(en.benefits.length);
    expect(ar.features).toHaveLength(en.features.length);
    expect(ar.useCases).toHaveLength(en.useCases.length);
    expect(ar.faq).toHaveLength(en.faq.length);
    for (const b of ar.benefits) expect(b.title && b.desc).toBeTruthy();
    for (const f of ar.faq) expect(f.q && f.a).toBeTruthy();
  });

  it.each(SOLUTIONS.map(s => [s.slug, s] as const))('solution %s has a complete Arabic entry', (slug, en) => {
    const ar = SOLUTIONS_AR[slug];
    expect(ar).toBeDefined();
    for (const key of ['name', 'headline', 'subtext'] as const) expect(ar[key].trim()).not.toBe('');
    expect(ar.highlights).toHaveLength(en.highlights.length);
  });

  it('has no Arabic entries for unknown slugs', () => {
    const productSlugs = new Set(ALL_PLATFORM_PRODUCTS.map(p => p.slug));
    const solutionSlugs = new Set(SOLUTIONS.map(s => s.slug));
    expect(Object.keys(PLATFORM_PRODUCTS_AR).filter(s => !productSlugs.has(s))).toEqual([]);
    expect(Object.keys(SOLUTIONS_AR).filter(s => !solutionSlugs.has(s))).toEqual([]);
  });

  it('leaves English untouched and keeps slug/image in Arabic', () => {
    const p = ALL_PLATFORM_PRODUCTS[0];
    const s = SOLUTIONS[0];
    expect(localizeProduct(p, 'en')).toBe(p);
    expect(localizeSolution(s, 'en')).toBe(s);
    expect(localizeProduct(p, 'ar').slug).toBe(p.slug);
    expect(localizeProduct(p, 'ar').name).toBe(PLATFORM_PRODUCTS_AR[p.slug].name);
    expect(localizeSolution(s, 'ar').image).toBe(s.image);
  });
});
