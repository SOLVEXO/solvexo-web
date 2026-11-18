import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoreSectionView } from './storeSections/StoreSectionView';
import { CollectionTileCard, tileOptions } from './collectionTiles';
import { MulticolumnSection as Fashion } from './theme-03-fashion/sections/shared/MulticolumnSection';
import { MulticolumnSection as Tech } from './theme-04-tech/sections/shared/MulticolumnSection';
import { MulticolumnSection as Ledup } from './theme-05-ledup/sections/shared/MulticolumnSection';

// A long word / link with no spaces must wrap INSIDE its card (jsdom has no layout, so this checks the rules that make the browser do it).
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ store: { storeId: 's1' }, theme: null, cfg: {}, resolveLink: () => ({ to: '/x' }) }) };
});
afterEach(cleanup);

const LONG = 'enjieuecjjecbjkwucewjjmwcbhsenjieuecjjecbjkwucewjjmwcbhs';
const colors = { bg: '#fff', bgAlt: '#f6f4ee', ink: '#111', inkMuted: '#666', border: '#ddd', accent: '#8a6a3f', accentInk: '#fff' };
const wraps = (el: HTMLElement | null) => el?.style.overflowWrap === 'anywhere';

describe('seller-built section (Section builder)', () => {
  const def = { layout: { t: 'repeat', cols: 3, card: true, children: [
    { t: 'heading', key: 'name', tag: 'h3' }, { t: 'text', key: 'desc' }, { t: 'richtext', key: 'rich' }, { t: 'button', key: 'cta', link: 'ctaLink' },
  ] } } as never;
  const blocks = [{ settings: { name: LONG, desc: LONG, rich: `<p>${LONG}</p>`, cta: LONG, ctaLink: {} } }];
  const view = () => render(<StoreSectionView def={def} settings={{}} blocks={blocks} colors={colors} link={({ children, style }) => <a href="#" style={style}>{children}</a>} />);

  it('heading, text, formatted text and button wrap their long words, and the card keeps everything inside', () => {
    const { container } = view();
    expect(wraps(screen.getByRole('heading', { level: 3 }))).toBe(true);
    expect(wraps(container.querySelector('p[style*="pre-line"]'))).toBe(true);
    expect(wraps(container.querySelector('.sxv-rich'))).toBe(true);
    expect(wraps(screen.getByRole('link'))).toBe(true);
    expect((container.querySelector('div[style*="border: 1px solid"]') as HTMLElement).style.overflow).toBe('hidden');
  });

  it('a long button label does not turn the button into a blob: the corner radius is a fixed 24px, centred text', () => {
    view();
    const a = screen.getByRole('link');
    expect(a.style.borderRadius).toBe('24px');
    expect(a.style.textAlign).toBe('center');
    expect(a.style.maxWidth).toBe('100%');
  });
});

describe('cards of the themes', () => {
  it('Collection List tile wraps long names, descriptions and button text', () => {
    const tile = { key: 'k', name: LONG, description: LONG, image: '', icon: '', to: '/c', ctaText: LONG, ctaLink: undefined };
    const { container } = render(<MemoryRouter><CollectionTileCard tile={tile} colors={colors} fonts={{ display: 'serif', body: 'sans-serif' }} imageRadius={8} buttonRadius={8} opts={tileOptions({ cardStyle: 'bordered' })} /></MemoryRouter>);
    const card = container.firstElementChild as HTMLElement;
    expect(wraps(card)).toBe(true);
    expect(card.style.minWidth).toBe('0px');
    expect(card.style.overflow).toBe('hidden');
  });

  describe.each([['Fashion', Fashion], ['Tech', Tech], ['LedUp', Ledup]] as const)('%s Multicolumn', (_n, Section) => {
    it('keeps a long heading / text inside its column card', () => {
      const blocks = [{ _id: 'a', type: 'multicolumn_column', settings: { heading: LONG, body: LONG } }] as never;
      const { container } = render(<MemoryRouter><Section section={{ _id: 's', type: 'multicolumn', settings: {} } as never} blocks={blocks} colors={colors as never} /></MemoryRouter>);
      const card = container.querySelector('div.flex.h-full') as HTMLElement;
      expect(card.className).toContain('[overflow-wrap:anywhere]');
      expect(card.className).toContain('min-w-0');
      expect(card.className).toContain('overflow-hidden');
    });
  });
});
