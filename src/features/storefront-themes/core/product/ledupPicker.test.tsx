import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ProductVariant } from '@/api/services/marketplace';

const variant = (id: string, color: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  _id: id, productId: 'P1', sku: id, price: 25, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active', currency: 'USD',
  options: [{ name: 'Color', value: color }, { name: 'Size', value: size }], ...over,
}) as ProductVariant;
const variants = [variant('v1', 'Red', 'S', { isDefault: true }), variant('v2', 'Navy Blue', 'S'), variant('v3', 'Red', 'M'), variant('v4', 'Navy Blue', 'M', { stock: 0 })];
const detail = { product: { _id: 'P1', slug: 'tee', name: 'Tee', description: 'A tee', images: [], categoryId: 'c1', tags: [], templateKey: 'default', storeId: 'S1' }, variants, defaultVariant: variants[0] };
const state: { sections: unknown[] } = { sections: [] };

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
vi.mock('@/api/services/metafields', () => ({ apiGetPublicMetafieldValues: () => Promise.resolve({ data: [] }) }));
vi.mock('@/api/services/store', async importOriginal => ({ ...(await importOriginal<typeof import('@/api/services/store')>()), apiGetPublicStoreProducts: () => Promise.resolve({ data: { products: [] } }) }));
vi.mock('../pageHooks', async importOriginal => ({ ...(await importOriginal<typeof import('../pageHooks')>()), useTemplateSections: () => state.sections }));

import { LedupProductPage } from '../../theme-05-ledup/pages/LedupProductPage';

beforeEach(() => { state.sections = []; });
afterEach(cleanup);
const withPicker = (settings: Record<string, unknown>) => [{ _id: 'm', type: 'product_main', settings: {}, blocks: [{ _id: 'b', type: 'product_variant_picker', settings }] }];
const show = () => render(<MemoryRouter initialEntries={['/product/tee']}><Routes><Route path="/product/:slug" element={<LedupProductPage />} /></Routes></MemoryRouter>);

describe('Ledup product page: colour swatches', () => {
  it('colour options are swatches by default, sizes stay pills', async () => {
    const { container } = show();
    await waitFor(() => expect(container.querySelectorAll('[data-swatch]').length).toBe(2));
    expect((container.querySelectorAll('[data-swatch]')[1] as HTMLElement).style.background).toBe('rgb(0, 31, 91)'); // navy, not generic blue
    expect(screen.getByRole('button', { name: 'M' }).tagName).toBe('BUTTON');
  });
  it('picking a swatch changes the variant', async () => {
    const { container } = show();
    await waitFor(() => expect(container.querySelectorAll('[data-swatch]').length).toBe(2));
    const [red, navy] = Array.from(container.querySelectorAll('[data-swatch]')) as HTMLElement[];
    expect(red.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(navy);
    await waitFor(() => expect((container.querySelectorAll('[data-swatch]')[1] as HTMLElement).getAttribute('aria-pressed')).toBe('true'));
  });
  it('a seller who chose buttons keeps the old pills', async () => {
    state.sections = withPicker({ pickerStyle: 'pills' });
    const { container } = show();
    await screen.findByText('Navy Blue');
    expect(container.querySelectorAll('[data-swatch]')).toHaveLength(0);
  });
  it('a seller who chose a dropdown gets selects', async () => {
    state.sections = withPicker({ pickerStyle: 'dropdown' });
    const { container } = show();
    await waitFor(() => expect(container.querySelectorAll('select').length).toBeGreaterThanOrEqual(2));
  });
});
