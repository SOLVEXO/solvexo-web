import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { ProductVariant } from '@/api/services/marketplace';

// ── a product with Colour + Size ──
const variant = (id: string, color: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  _id: id, productId: 'P1', sku: id, price: 25, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active', currency: 'USD',
  options: [{ name: 'Color', value: color }, { name: 'Size', value: size }], ...over,
}) as ProductVariant;
const variants = [
  variant('v1', 'Red', 'S', { isDefault: true, images: ['https://cdn.example.com/red.jpg'] }),
  variant('v2', 'Red', 'M', { images: ['https://cdn.example.com/red.jpg'] }),
  variant('v3', 'Navy Blue', 'S', { images: ['https://cdn.example.com/navy.jpg'] }),
  variant('v4', 'Navy Blue', 'M', { stock: 0, images: ['https://cdn.example.com/navy.jpg'] }),
];
const detail = {
  product: { _id: 'P1', slug: 'tee', name: 'Tee', description: 'A tee', images: ['https://cdn.example.com/red.jpg'], categoryId: 'c1', tags: [], templateKey: 'default', storeId: 'S1' },
  variants, defaultVariant: variants[0],
};

const state: { pickerSettings: Record<string, unknown> } = { pickerSettings: {} };

vi.mock('@/hooks/marketplace/useProductById', () => ({ useProductById: () => ({ detail, loading: false, error: null, refetch() {} }) }));
vi.mock('@/hooks/marketplace/useRecordProductView', () => ({ useRecordProductView: () => {} }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: async () => true, adding: null }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => false, fixedPriceFor: () => null, ratesLoaded: true }) }));
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ theme: null, store: { storeId: 'S1', name: 'Shop', baseCurrency: 'USD', lowStockThreshold: 3 }, resolveLink: actual.resolveStorefrontLink }) };
});
vi.mock('@/contexts/WishlistContext', () => ({ useWishlistContext: () => ({ isWishlisted: () => false, toggleWishlist: async () => {}, wishlisting: null, wishlistCount: 0 }) }));
vi.mock('@/contexts/AuthGateContext', async importOriginal => ({ ...(await importOriginal<typeof import('@/contexts/AuthGateContext')>()), useAuthGate: () => ({ requireAuth: (fn: () => unknown) => fn(), open() {} }) }));
vi.mock('../../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer() {}, mounted: false }) }));
vi.mock('../b2b/useWholesale', () => ({ useWholesaleGate: () => ({ locked: false, approved: false, loading: false }), useWholesalePrice: () => null }));
vi.mock('../hooks/useStorefrontSeo', () => ({ useStorefrontSeo: () => {} }));
vi.mock('../hooks/useJsonLd', () => ({ useJsonLd: () => {} }));
vi.mock('../../useReviewedProducts', () => ({ useReviewedProducts: () => ({ byProduct: new Map(), reload() {} }) }));
vi.mock('@/api/services/rating', () => ({ apiGetProductReviews: () => Promise.resolve({ data: { stats: { average: 0, total: 0 }, reviews: [] } }) }));
vi.mock('@/api/services/metafields', () => ({ apiGetPublicMetafieldValues: () => Promise.resolve({ data: [] }) }));
vi.mock('../pageHooks', async importOriginal => {
  const actual = await importOriginal<typeof import('../pageHooks')>();
  return {
    ...actual,
    useTemplateSections: () => [{ _id: 'main', type: 'product_main', settings: {}, blocks: [
      { _id: 'b1', type: 'product_media', settings: {} },
      { _id: 'b2', type: 'product_title', settings: {} },
      { _id: 'b3', type: 'product_price', settings: {} },
      { _id: 'b4', type: 'product_variant_picker', settings: state.pickerSettings },
      { _id: 'b5', type: 'product_quantity', settings: {} },
      { _id: 'b6', type: 'product_buy_buttons', settings: {} },
    ] }],
  };
});

import { FashionProductPage } from '../../theme-03-fashion/pages/FashionProductPage';
import { TechProductPage } from '../../theme-04-tech/pages/TechProductPage';

beforeEach(() => { state.pickerSettings = {}; window.history.replaceState({}, '', '/'); });
afterEach(cleanup);

const pages: [string, () => ReactElement][] = [['Maison', () => <FashionProductPage />], ['Tech', () => <TechProductPage />]];

describe.each(pages)('%s product page: variant picker styles', (_name, Page) => {
  const show = () => render(<MemoryRouter initialEntries={['/products/tee']}><Routes><Route path="/products/:slug" element={<Page />} /></Routes></MemoryRouter>);

  it('buttons by default (nothing changes for existing stores): every option is text buttons', async () => {
    const { container } = show();
    await screen.findByText('Color:');
    expect(container.querySelectorAll('[data-swatch]')).toHaveLength(0);
    expect(screen.getByText('Navy Blue').tagName).toBe('BUTTON');
    expect(screen.getByText('M').tagName).toBe('BUTTON');
  });

  it('colour swatches: the Colour option becomes swatches, Size keeps its buttons', async () => {
    state.pickerSettings = { pickerStyle: 'swatches' };
    const { container } = show();
    await screen.findByText('Color:');
    const sw = container.querySelectorAll('[data-swatch]');
    expect(sw).toHaveLength(2); // Red, Navy Blue
    expect(screen.getByText('M').tagName).toBe('BUTTON'); // Size
    expect((sw[1] as HTMLElement).style.background).toBe('rgb(0, 31, 91)'); // navy, not generic blue
  });

  it('picking a swatch switches the variant: the other option keeps its place and availability follows', async () => {
    state.pickerSettings = { pickerStyle: 'swatches' };
    const { container } = show();
    await screen.findByText('Color:');
    const [red, navy] = Array.from(container.querySelectorAll('[data-swatch]')) as HTMLElement[];
    expect(red.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(navy);
    await waitFor(() => expect((container.querySelectorAll('[data-swatch]')[1] as HTMLElement).getAttribute('aria-pressed')).toBe('true'));
    // Navy Blue + size M is sold out: the M button is struck through
    expect(screen.getByText('M').style.textDecoration).toBe('line-through');
  });

  it('picture tiles use each colour\'s variant photo', async () => {
    state.pickerSettings = { pickerStyle: 'images' };
    const { container } = show();
    await screen.findByText('Color:');
    const tiles = container.querySelectorAll('[data-image-tile]');
    expect(tiles).toHaveLength(2);
    expect(tiles[1].querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/navy.jpg');
    // Size has no photos: it stays buttons
    const sizeSet = screen.getByText('Size:').closest('fieldset') as HTMLElement;
    expect(within(sizeSet).getByRole('button', { name: 'S' }).tagName).toBe('BUTTON');
    expect(sizeSet.querySelector('[data-image-tile]')).toBeNull();
  });

  it('swatch shape and size follow the block settings', async () => {
    state.pickerSettings = { pickerStyle: 'swatches', swatchShape: 'square', swatchSize: 'lg' };
    const { container } = show();
    await screen.findByText('Color:');
    const first = container.querySelector('[data-swatch]') as HTMLElement;
    expect(first.style.borderRadius).toBe('6px');
    expect(first.style.width).toBe('44px');
  });

  it('dropdown still works', async () => {
    state.pickerSettings = { pickerStyle: 'dropdown' };
    const { container } = show();
    await waitFor(() => expect(container.querySelectorAll('select').length).toBeGreaterThanOrEqual(2));
    const colour = container.querySelectorAll('select')[0] as HTMLSelectElement;
    expect(Array.from(colour.options).map(o => o.value)).toEqual(['Red', 'Navy Blue']);
    expect(within(container).queryAllByRole('button', { name: /Navy Blue/ })).toHaveLength(0);
  });
});
