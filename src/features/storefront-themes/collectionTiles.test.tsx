import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { CollectionTileCard, tileOptions, useCollectionTiles } from './collectionTiles';

vi.mock('@/api/services/collections', () => ({
  apiGetPublicCollections: () => Promise.resolve({ data: [
    { _id: 'c1', name: 'Pre-Primary', slug: 'pre-primary', description: 'Phonics and tracing', image: 'https://img/c1.png' },
    { _id: 'c2', name: 'Primary', slug: 'primary', description: 'Grades 1-5', image: null },
    { _id: 'c3', name: 'Schools', slug: 'schools', description: null, image: null },
  ] }),
}));
vi.mock('./previewInspector', () => ({ PreviewBlock: ({ children }: { children: unknown }) => children }));
vi.mock('@/features/storefront/StorefrontContext', () => ({
  useStorefront: () => ({ store: { storeId: 's1' }, resolveLink: (l: { linkType: string }) => (l.linkType === 'home' ? { to: '/' } : { href: 'https://x.test', newTab: true }) }),
}));

const section = (settings: Record<string, unknown> = {}) => ({ _id: 'sec', type: 'collection_list', settings } as unknown as Section);
const block = (settings: Record<string, unknown>, i: number) => ({ _id: `b${i}`, type: 'collection_item', settings } as unknown as Block);
const colors = { ink: '#111', inkMuted: '#666', bg: '#fff', bgAlt: '#eee', border: '#ddd', accent: '#236' };
const fonts = { display: 'serif', body: 'sans-serif' };

function Probe({ s, blocks }: { s: Section; blocks: Block[] }) {
  const tiles = useCollectionTiles(s, blocks);
  if (!tiles) return <p>loading</p>;
  return (
    <MemoryRouter>
      {tiles.map(t => <CollectionTileCard key={t.key} tile={t} colors={colors} fonts={fonts} imageRadius={8} buttonRadius={8} opts={tileOptions(s.settings)} />)}
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe('Collection List tiles', () => {
  it('with no tiles lists the collections automatically, respecting the limit', async () => {
    render(<Probe s={section({ limit: 2 })} blocks={[]} />);
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2));
    expect(screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(['Pre-Primary', 'Primary']);
    expect(screen.queryByText('Schools')).toBeNull();
    expect(screen.queryByText('Phonics and tracing')).toBeNull(); // description is off by default
  });

  it('with tiles shows exactly those, in order, with typed text winning over the collection', async () => {
    const blocks = [
      block({ collectionId: 'c3', title: 'For schools', description: 'Institutional orders', icon: 'school', ctaText: 'Explore school orders →' }, 1),
      block({ collectionId: 'c1' }, 2),
    ];
    render(<Probe s={section({ cardStyle: 'bordered' })} blocks={blocks} />);
    await waitFor(() => expect(screen.getByText('For schools')).toBeTruthy());
    expect(screen.getByText('Institutional orders')).toBeTruthy();
    const btn = screen.getByText('Explore school orders →').closest('a');
    expect(btn?.getAttribute('href')).toBe('/collections/schools'); // no custom link = opens the collection
    expect(screen.getByText('Pre-Primary')).toBeTruthy();
    expect(screen.queryByText('Primary')).toBeNull();
    expect(screen.queryByText('Schools')).toBeNull(); // renamed tile does not also show the collection name
    const order = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(order).toEqual(['For schools', 'Pre-Primary']);
  });

  it('uses a custom button link and skips an empty tile', async () => {
    const blocks = [
      block({ title: 'Custom', ctaText: 'Go', ctaLink: { linkType: 'url' } }, 1),
      block({}, 2),
    ];
    render(<Probe s={section()} blocks={blocks} />);
    await waitFor(() => expect(screen.getByText('Custom')).toBeTruthy());
    const a = screen.getByText('Go').closest('a');
    expect(a?.getAttribute('href')).toBe('https://x.test');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('shows the collection description only when asked, but always shows a typed one', async () => {
    render(<Probe s={section({ showDescription: true })} blocks={[block({ collectionId: 'c1' }, 1)]} />);
    await waitFor(() => expect(screen.getByText('Phonics and tracing')).toBeTruthy());
  });
});
