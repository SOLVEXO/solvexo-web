import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/storefront/StorefrontContext', () => ({
  useStorefront: () => ({
    store: { storeId: 's1' },
    resolveLink: (l: { linkType: string; url?: string }) => (l.linkType === 'external' ? { href: l.url } : { to: '/shop' }),
  }),
}));

import { SectionContentLayer } from './shared/SectionContentLayer';

afterEach(cleanup);

const items = (list: Record<string, unknown>[]) => list as never;

describe('SectionContentLayer (free content on any section)', () => {
  it('draws nothing when the section has no content items', () => {
    const { container } = render(<SectionContentLayer items={[]} ink="#111" />);
    expect(container.innerHTML).toBe('');
  });

  it('skips an item the seller left empty', () => {
    const { container } = render(<SectionContentLayer items={items([{ kind: 'heading', text: '  ' }, { kind: 'image' }])} ink="#111" />);
    expect(container.innerHTML).toBe('');
  });

  it('puts each item in the grid cell of its anchor (top-right = row 1, column 3)', () => {
    const { container } = render(<SectionContentLayer items={items([{ kind: 'heading', text: 'Hi', anchor: 'top-right' }])} ink="#111" />);
    const cell = container.querySelector('[data-sx-content-layer] > div > div') as HTMLElement;
    expect(cell.style.gridRow).toBe('1');
    expect(cell.style.gridColumn).toBe('3');
  });

  it('draws a button as a real link to the chosen page', () => {
    const { container } = render(<SectionContentLayer items={items([{ kind: 'button', text: 'Shop', link: { linkType: 'collection' } }])} ink="#111" />);
    const a = container.querySelector('a')!;
    expect(a.textContent).toBe('Shop');
    expect(a.getAttribute('href')).toBe('/shop');
  });

  it('uses the item colour and size, and the theme font for a heading', () => {
    const { container } = render(<SectionContentLayer items={items([{ kind: 'heading', text: 'Hi', color: '#ff0000', size: 'xl' }])} ink="#111" displayFont="Display" />);
    const h = container.querySelector('h2') as HTMLElement;
    expect(h.style.color).toBe('rgb(255, 0, 0)');
    expect(h.style.fontFamily).toContain('Display');
    expect(h.className).toContain('clamp(32px');
  });

  it('falls back to the section text colour when the item has none', () => {
    const { container } = render(<SectionContentLayer items={items([{ kind: 'text', text: 'Body' }])} ink="#123456" />);
    expect((container.querySelector('p') as HTMLElement).style.color).toBe('rgb(18, 52, 86)');
  });
});