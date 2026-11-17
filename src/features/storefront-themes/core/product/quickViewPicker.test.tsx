import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ProductVariant } from '@/api/services/marketplace';

const variant = (id: string, color: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  _id: id, productId: 'P1', sku: id, price: 25, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active', currency: 'USD',
  options: [{ name: 'Color', value: color }, { name: 'Size', value: size }], ...over,
}) as ProductVariant;
const variants = [variant('v1', 'Red', 'S', { isDefault: true }), variant('v2', 'Navy Blue', 'S')];
const detail = { product: { _id: 'P1', slug: 'tee', name: 'Tee', description: 'A tee', images: [], categoryId: 'c1', tags: [], templateKey: 'default', storeId: 'S1' }, variants, defaultVariant: variants[0] };
const state: { sections: unknown[] } = { sections: [] };

vi.mock('@/hooks/marketplace/useProductById', () => ({ useProductById: () => ({ detail, loading: false, error: null, refetch() {} }) }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: async () => true, adding: null }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => false, fixedPriceFor: () => null, ratesLoaded: true }) }));
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ theme: null, store: { storeId: 'S1', name: 'Shop', baseCurrency: 'USD', lowStockThreshold: 3 }, resolveLink: actual.resolveStorefrontLink }) };
});
vi.mock('../../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer() {}, mounted: false }) }));
vi.mock('../b2b/useWholesale', () => ({ useWholesaleGate: () => ({ locked: false, approved: false, loading: false }), useWholesalePrice: () => null }));
vi.mock('../pageHooks', async importOriginal => ({ ...(await importOriginal<typeof import('../pageHooks')>()), useTemplateSections: () => state.sections }));

import { FashionQuickView } from '../../theme-03-fashion/components/product/FashionQuickView';
import { TechQuickView } from '../../theme-04-tech/components/product/TechQuickView';
import { pickerSettingsOf } from './pickerSettings';

afterEach(() => { cleanup(); state.sections = []; });
const withPicker = (settings: Record<string, unknown>) => [{ _id: 'm', type: 'product_main', settings: {}, blocks: [{ _id: 'b', type: 'product_variant_picker', settings }] }];

describe('pickerSettingsOf', () => {
  it('no block = buttons, medium circles', () => { expect(pickerSettingsOf([])).toEqual({ pickerStyle: undefined, shape: 'circle', size: 'md' }); });
  it('reads the seller choice', () => { expect(pickerSettingsOf(withPicker({ pickerStyle: 'swatches', swatchShape: 'square', swatchSize: 'lg' }) as never)).toEqual({ pickerStyle: 'swatches', shape: 'square', size: 'lg' }); });
});

describe.each([['Maison', FashionQuickView], ['Tech', TechQuickView]] as const)('%s quick view', (_n, Quick) => {
  const show = () => render(<MemoryRouter><Quick slug="tee" onClose={() => {}} /></MemoryRouter>);
  it('shows buttons until the seller chose another look', () => {
    show(); const container = document.body;
    expect(container.querySelectorAll('[data-swatch]')).toHaveLength(0);
    expect(screen.getByText('Navy Blue').tagName).toBe('BUTTON');
  });
  it('follows the product page picker: colour swatches, size stays buttons', () => {
    state.sections = withPicker({ pickerStyle: 'swatches' });
    show(); const container = document.body;
    expect(container.querySelectorAll('[data-swatch]')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'S' }).length).toBeGreaterThan(0);
  });
});
