import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Section } from '@/api/services/storefrontTypes';
import type { StoreSectionDef } from '@/api/services/storeSectionDefs';
import { resetStoreSectionDefsCache } from './useStoreSectionDefs';
import { findCustomBlockDef, findCustomSectionDef } from '../themeManifest';

const listPublic = vi.fn();
vi.mock('@/api/services/storeSectionDefs', () => ({ apiListPublicStoreSectionDefs: (...a: unknown[]) => listPublic(...a) }));
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return {
    ...actual,
    useStorefront: () => ({
      theme: null,
      store: { storeId: 'S1' },
      // like the real resolver: any kind of link reports newTab when the seller ticked it
      resolveLink: (l: { linkType?: string; url?: string; categoryId?: string; newTab?: boolean }) => (l?.linkType === 'external' ? { href: l.url, newTab: true }
        : l?.linkType === 'home' ? { to: '/' }
        : l?.linkType === 'category' ? { to: `/category/${l.categoryId}`, ...(l.newTab ? { newTab: true } : {}) } : {}),
    }),
  };
});

// the index registers every Maison section renderer (and its `theme_section` dispatcher)
import { FashionSectionRenderer } from '../theme-03-fashion/sections';

const def: StoreSectionDef = {
  _id: 'd1', key: 'my.feature-cards', name: 'Feature cards', description: 'Three cards', color: null,
  layout: {
    t: 'stack', children: [
      { t: 'heading', key: 'title', label: 'Title', tag: 'h2' },
      { t: 'button', key: 'cta', label: 'CTA', link: 'ctaLink', style: 'solid' },
      { t: 'repeat', label: 'Card', cols: 3, card: true, children: [{ t: 'heading', key: 'cardTitle', label: 'Card title', tag: 'h3' }, { t: 'text', key: 'cardText', label: 'Card text' }] },
    ],
  },
  fields: [{ key: 'title', label: 'Title', kind: 'text' }, { key: 'cta', label: 'CTA (text)', kind: 'text' }, { key: 'ctaLink', label: 'CTA (link)', kind: 'link' }],
  block: { key: 'item', label: 'Card', fields: [{ key: 'cardTitle', label: 'Card title', kind: 'text' }, { key: 'cardText', label: 'Card text', kind: 'textarea' }], defaults: {} },
  defaults: {}, initialBlocks: 3,
};

const section = (settings: Record<string, unknown>, blocks: Section['blocks'] = [], over: Partial<Section> = {}): Section =>
  ({ _id: 's1', type: 'theme_section', settings: { sectionKey: def.key, ...settings }, blocks, ...over });
const card = (id: string, settings: Record<string, unknown>) => ({ _id: id, type: 'theme_block', settings: { blockKey: `${def.key}.item`, ...settings } }) as never;

const renderIt = (sections: Section[]) => render(<MemoryRouter><FashionSectionRenderer sections={sections} /></MemoryRouter>);

beforeEach(() => {
  resetStoreSectionDefsCache();
  listPublic.mockReset();
  listPublic.mockResolvedValue({ data: [def] });
});
afterEach(cleanup);

describe('seller-built sections on the storefront (Maison)', () => {
  it('draws the seller\'s layout with the section\'s and each card\'s values', async () => {
    renderIt([section({ title: 'Why us', cta: 'Shop', ctaLink: { linkType: 'home' } }, [card('b1', { cardTitle: 'Fast', cardText: 'Quick' }), card('b2', { cardTitle: 'Safe', cardText: 'Secure' })])]);
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Why us' })).toBeTruthy());
    expect(screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(['Fast', 'Safe']);
    const cta = screen.getByRole('link', { name: 'Shop' });
    expect(cta.getAttribute('href')).toBe('/');
    expect(listPublic).toHaveBeenCalledWith('S1');
  });

  it('a button with nowhere to go is not drawn', async () => {
    renderIt([section({ title: 'T', cta: 'Shop' })]);
    await waitFor(() => expect(screen.getByText('T')).toBeTruthy());
    expect(screen.queryByRole('link', { name: 'Shop' })).toBeNull();
  });

  it('an external link opens in a new tab safely', async () => {
    renderIt([section({ title: 'T', cta: 'Out', ctaLink: { linkType: 'external', url: 'https://example.com' } })]);
    const a = await screen.findByRole('link', { name: 'Out' });
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('"Open in a new tab" works for a link to a page of the store too (a category), not only for external links', async () => {
    renderIt([section({ title: 'T', cta: 'Shop it', ctaLink: { linkType: 'category', categoryId: 'c1', newTab: true } })]);
    const a = await screen.findByRole('link', { name: 'Shop it' });
    expect(a.getAttribute('href')).toBe('/category/c1');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('without the tick a store-page link stays in the same tab', async () => {
    renderIt([section({ title: 'T', cta: 'Shop it', ctaLink: { linkType: 'category', categoryId: 'c1' } })]);
    const a = await screen.findByRole('link', { name: 'Shop it' });
    expect(a.getAttribute('target')).toBeNull();
  });

  it('the page-design settings (Phase 1) still apply around it', async () => {
    const { container } = renderIt([section({ title: 'T', paddingTop: 10, animation: 'fade' })]);
    await waitFor(() => expect(screen.getByText('T')).toBeTruthy());
    expect(container.querySelector('.sx-pad-t')).not.toBeNull();
    expect(container.querySelector('.sx-anim-fade')).not.toBeNull();
  });

  it('a section whose design was deleted draws nothing and the page still works', async () => {
    listPublic.mockResolvedValue({ data: [] });
    renderIt([{ _id: 'p', type: 'rich_text', settings: { heading: 'Page text' }, blocks: [] }, section({ title: 'Orphan' })]);
    await waitFor(() => expect(listPublic).toHaveBeenCalled());
    expect(screen.getByText('Page text')).toBeTruthy();
    expect(screen.queryByText('Orphan')).toBeNull();
  });

  it('a theme\'s own sections (not "my.*") never ask for the seller designs', async () => {
    renderIt([{ _id: 'x', type: 'theme_section', settings: { sectionKey: 'maison.lookbook' }, blocks: [] }]);
    await new Promise(r => setTimeout(r, 30));
    expect(listPublic).not.toHaveBeenCalled();
  });

  it('once loaded, the editor can look the design up by key (form and block fields)', async () => {
    renderIt([section({ title: 'T' })]);
    await waitFor(() => expect(findCustomSectionDef(def.key)?.label).toBe('Feature cards'));
    expect(findCustomSectionDef(def.key)?.fields.map(f => f.key)).toEqual(['title', 'cta', 'ctaLink']);
    expect(findCustomBlockDef(`${def.key}.item`)?.fields.map(f => f.key)).toEqual(['cardTitle', 'cardText']);
  });
});
