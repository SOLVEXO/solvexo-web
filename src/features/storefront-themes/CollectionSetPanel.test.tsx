import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Block, Section } from '@/api/services/storefrontTypes';
import type { PublicStoreProduct } from '@/api/services/store';
import { CollectionTileCard, tileOptions, useCollectionTiles } from './collectionTiles';
import { CollectionSetPanel, useCollectionPick } from './CollectionSetPanel';

const addToCart = vi.fn();
const getProducts = vi.fn();

vi.mock('@/api/services/collections', () => ({
  apiGetPublicCollections: () => Promise.resolve({ data: [
    { _id: 'c1', name: 'PreK-1', slug: 'prek-1', description: null, image: null },
    { _id: 'c2', name: 'PreK-2', slug: 'prek-2', description: null, image: null },
  ] }),
}));
vi.mock('@/api/services/store', () => ({ apiGetPublicStoreProducts: (...a: unknown[]) => getProducts(...a) }));
vi.mock('./previewInspector', () => ({ PreviewBlock: ({ children }: { children: unknown }) => children }));
vi.mock('@/features/storefront/StorefrontContext', () => ({
  useStorefront: () => ({ store: { storeId: 's1', baseCurrency: 'PKR' }, resolveLink: () => ({ to: '/' }) }),
}));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart, adding: null }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({
  useCurrencyPreference: () => ({ currency: 'PKR', convert: (n: number) => n, canConvert: () => true }),
}));

const prod = (id: string, price: number, extra: Partial<PublicStoreProduct> = {}) =>
  ({ _id: id, slug: id, name: `Book ${id}`, defaultVariantPrice: price, variantId: `v-${id}`, inStock: true, type: 'physical', ...extra }) as PublicStoreProduct;

const section = (settings: Record<string, unknown>) => ({ _id: 'sec', type: 'collection_list', settings } as unknown as Section);
const block = (collectionId: string, i: number) => ({ _id: `b${i}`, type: 'collection_item', settings: { collectionId } } as unknown as Block);
const colors = { ink: '#111', inkMuted: '#666', bg: '#fff', bgAlt: '#eee', border: '#ddd', accent: '#236' };
const fonts = { display: 'serif', body: 'sans-serif' };
const Card = ({ product }: { product: PublicStoreProduct }) => <div data-testid="card">{product.name}</div>;

function Harness({ s, blocks }: { s: Section; blocks: Block[] }) {
  const tiles = useCollectionTiles(s, blocks);
  const pick = useCollectionPick(s, tiles);
  const loc = useLocation();
  if (!tiles) return <p>loading</p>;
  return (
    <>
      <span data-testid="url">{loc.search}</span>
      {tiles.map(t => (
        <CollectionTileCard key={t.key} tile={t} colors={colors} fonts={fonts} imageRadius={8} buttonRadius={8} opts={tileOptions(s.settings)}
          onSelect={pick.enabled && t.collectionId ? () => pick.select(t.collectionId as string) : undefined} selected={pick.selected?.collectionId === t.collectionId} />
      ))}
      {pick.selected && <CollectionSetPanel section={s} tile={pick.selected} colors={colors} fonts={fonts} buttonRadius={8} ProductCard={Card} />}
    </>
  );
}

const mount = (settings: Record<string, unknown> = { clickAction: 'show_products' }, url = '/') =>
  render(<MemoryRouter initialEntries={[url]}><Harness s={section(settings)} blocks={[block('c1', 1), block('c2', 2)]} /></MemoryRouter>);

beforeEach(() => {
  addToCart.mockReset().mockResolvedValue(true);
  getProducts.mockReset().mockImplementation((_s: string, p: { collectionId: string }) =>
    Promise.resolve({ data: { products: p.collectionId === 'c1' ? [prod('a', 100), prod('b', 250), prod('gone', 50, { inStock: false })] : [prod('z', 999)] } }));
});
afterEach(cleanup);

describe('Collection set picker', () => {
  it('shows no products until a card is clicked, then only that collection with subtotal', async () => {
    mount();
    await waitFor(() => expect(screen.getByText('PreK-1')).toBeTruthy());
    expect(screen.queryByTestId('card')).toBeNull();
    fireEvent.click(screen.getByText('PreK-1'));
    await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(3));
    expect(getProducts).toHaveBeenCalledWith('s1', { collectionId: 'c1', limit: 50 });
    expect(screen.getByTestId('url').textContent).toBe('?set=c1');
    expect(screen.getByText(/350/)).toBeTruthy(); // 100 + 250, the sold-out book is not counted
    expect(screen.queryByText('Book z')).toBeNull();
  });

  it('switching to another card replaces the products; clicking the same card closes it', async () => {
    mount();
    await waitFor(() => expect(screen.getByText('PreK-1')).toBeTruthy());
    fireEvent.click(screen.getByText('PreK-1'));
    await waitFor(() => expect(screen.getByText('Book a')).toBeTruthy());
    fireEvent.click(screen.getByText('PreK-2'));
    await waitFor(() => expect(screen.getByText('Book z')).toBeTruthy());
    expect(screen.queryByText('Book a')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /PreK-2/ })); // the heading of the open panel also says PreK-2
    await waitFor(() => expect(screen.queryByTestId('card')).toBeNull());
  });

  it('Add all puts every buyable book in the cart once and skips the sold-out one', async () => {
    mount();
    await waitFor(() => expect(screen.getByText('PreK-1')).toBeTruthy());
    fireEvent.click(screen.getByText('PreK-1'));
    const btn = await screen.findByRole('button', { name: 'Add all 2 to cart' });
    fireEvent.click(btn);
    await waitFor(() => expect(addToCart).toHaveBeenCalledTimes(2));
    expect(addToCart).toHaveBeenNthCalledWith(1, 'a', 'v-a', 'physical', 1);
    expect(addToCart).toHaveBeenNthCalledWith(2, 'b', 'v-b', 'physical', 1);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('2 added'));
  });

  it('reports books that could not be added', async () => {
    addToCart.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    mount();
    await waitFor(() => expect(screen.getByText('PreK-1')).toBeTruthy());
    fireEvent.click(screen.getByText('PreK-1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Add all 2 to cart' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('could not be added'));
  });

  it('opens the chosen set straight from a shared link, and honours the custom button text and hidden subtotal', async () => {
    mount({ clickAction: 'show_products', addAllLabel: 'Buy the full set', showSubtotal: false }, '/?set=c1');
    expect(await screen.findByRole('button', { name: 'Buy the full set' })).toBeTruthy();
    expect(screen.queryByText(/subtotal/i)).toBeNull();
  });

  it('in the normal mode a card is a link and nothing opens', async () => {
    mount({});
    await waitFor(() => expect(screen.getByText('PreK-1')).toBeTruthy());
    expect(screen.getByText('PreK-1').closest('a')?.getAttribute('href')).toBe('/collections/prek-1');
    fireEvent.click(screen.getByText('PreK-1'));
    expect(screen.queryByTestId('card')).toBeNull();
  });
});
