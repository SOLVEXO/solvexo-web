import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { ProductVariant } from '@/api/services/marketplace';

const photos = ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg', 'https://cdn.example.com/c.jpg'];
const variants = [{ _id: 'v1', productId: 'P1', sku: 'v1', price: 25, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active', currency: 'USD', isDefault: true, options: [] }] as unknown as ProductVariant[];
const detail = {
  product: { _id: 'P1', slug: 'tee', name: 'Tee', description: 'A tee', images: photos, categoryId: 'c1', tags: [], templateKey: 'default', storeId: 'S1' },
  variants, defaultVariant: variants[0],
};

const state: { media: Record<string, unknown>; trust?: Record<string, unknown>; extra: unknown[]; asked: unknown[] } = { media: {}, extra: [], asked: [] };

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
vi.mock('@/api/services/productQuestions', () => ({
  apiGetPublicQuestions: () => Promise.resolve({ items: [{ id: 'q1', askerName: 'Sara', question: 'Does it shrink?', answer: 'No, pre-washed.', answeredAt: null, askedAt: '' }] }),
  apiAskQuestion: (...a: unknown[]) => { state.asked.push(a); return Promise.resolve({ ok: true, message: 'ok' }); },
}));
vi.mock('@/api/services/merchandising', async importOriginal => ({ ...(await importOriginal<typeof import('@/api/services/merchandising')>()),
  apiPublicRecommendations: () => Promise.resolve({ data: { items: [{ id: 'P2', variantId: 'v9', type: 'physical', slug: 'cap', name: 'Cap', image: null, price: 10, compareAtPrice: null, source: 'manual' }] } }) }));
vi.mock('@/api/services/metafields', () => ({ apiGetPublicMetafieldValues: () => Promise.resolve({ data: [] }) }));
vi.mock('../pageHooks', async importOriginal => {
  const actual = await importOriginal<typeof import('../pageHooks')>();
  return {
    ...actual,
    useTemplateSections: () => [{ _id: 'main', type: 'product_main', settings: {}, blocks: [
      { _id: 'b1', type: 'product_media', settings: state.media },
      { _id: 'b2', type: 'product_title', settings: {} },
      { _id: 'b3', type: 'product_price', settings: {} },
      ...(state.trust ? [{ _id: 'b4', type: 'product_trust_badges', settings: state.trust }] : []),
      { _id: 'b5', type: 'product_buy_buttons', settings: {} },
      ...state.extra,
    ] }],
  };
});

import { FashionProductPage } from '../../theme-03-fashion/pages/FashionProductPage';
import { TechProductPage } from '../../theme-04-tech/pages/TechProductPage';

beforeEach(() => { state.media = {}; state.trust = undefined; state.extra = []; state.asked = []; window.history.replaceState({}, '', '/'); });
afterEach(cleanup);

const pages: [string, () => ReactElement][] = [['Maison', () => <FashionProductPage />], ['Tech', () => <TechProductPage />]];

describe.each(pages)('%s product page: photo layouts and trust badges', (_name, Page) => {
  const show = () => render(<MemoryRouter initialEntries={['/products/tee']}><Routes><Route path="/products/:slug" element={<Page />} /></Routes></MemoryRouter>);

  it('keeps the thumbnail gallery by default (nothing changes for existing stores)', async () => {
    const { container } = show();
    await screen.findByText('Tee', { selector: 'h1' });
    expect(container.querySelector('[data-photo-stack]')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Show image/ })).toHaveLength(3);
  });

  it('grid shows every photo big in two columns, stacked in one', async () => {
    state.media = { layout: 'grid' };
    const { container } = show();
    await screen.findByText('Tee', { selector: 'h1' });
    const grid = container.querySelector('[data-photo-stack="grid"]') as HTMLElement;
    expect(grid.querySelectorAll('img')).toHaveLength(3);
    expect(grid.style.gridTemplateColumns).toContain('repeat(2');
    cleanup();
    state.media = { layout: 'stacked' };
    const again = show();
    await screen.findByText('Tee', { selector: 'h1' });
    expect((again.container.querySelector('[data-photo-stack="stacked"]') as HTMLElement).style.gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  it('photo shape follows the choice', async () => {
    state.media = { layout: 'grid', aspect: 'landscape' };
    const { container } = show();
    await screen.findByText('Tee', { selector: 'h1' });
    expect((container.querySelector('[data-photo-stack] button') as HTMLElement).style.aspectRatio.replace(/\s/g, '')).toBe('4/3');
  });

  it('zoom off: photos are not clickable', async () => {
    state.media = { layout: 'grid', zoom: false };
    const { container } = show();
    await screen.findByText('Tee', { selector: 'h1' });
    expect(container.querySelectorAll('[data-photo-stack] button')).toHaveLength(0);
    expect(container.querySelectorAll('[data-photo-stack] img')).toHaveLength(3);
  });

  it('trust badges appear with their titles and icons; empty titles are skipped', async () => {
    state.trust = { layout: 'grid', style: 'boxed', items: [{ icon: 'truck', title: 'Free shipping', text: 'Over $50' }, { icon: 'lock', title: '' }, { icon: 'return', title: 'Easy returns' }] };
    const { container } = show();
    await screen.findByText('Free shipping');
    expect(screen.getByText('Over $50')).toBeTruthy();
    expect(screen.getByText('Easy returns')).toBeTruthy();
    expect(container.querySelectorAll('[data-trust-badges] li')).toHaveLength(2);
  });

  it('no trust badge block, nothing drawn', async () => {
    const { container } = show();
    await screen.findByText('Tee', { selector: 'h1' });
    expect(container.querySelector('[data-trust-badges]')).toBeNull();
  });

  it('Questions block lists answered questions and sends a new one', async () => {
    state.extra = [{ _id: 'q', type: 'product_questions', settings: {} }];
    show();
    await screen.findByText('Does it shrink?');
    expect(screen.getByText('No, pre-washed.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Is it machine washable?' } });
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ali' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
    await screen.findByRole('status');
    expect(state.asked).toHaveLength(1);
    expect((state.asked[0] as unknown[])[2]).toMatchObject({ name: 'Ali', question: 'Is it machine washable?' });
  });

  it('Questions block can hide the form', async () => {
    state.extra = [{ _id: 'q', type: 'product_questions', settings: { showForm: false } }];
    show();
    await screen.findByText('Does it shrink?');
    expect(screen.queryByRole('button', { name: 'Send question' })).toBeNull();
  });

  it('Frequently bought together shows this item plus the picks and a total', async () => {
    state.extra = [{ _id: 'f', type: 'product_frequently_bought', settings: {} }];
    const { container } = show();
    await screen.findByText('Cap');
    expect(container.querySelectorAll('[data-fbt] li')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Add selected to cart' })).toBeTruthy();
  });
});
