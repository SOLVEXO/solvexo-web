import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ProductVariant } from '@/api/services/marketplace';

const variants = [{ _id: 'v1', productId: 'P1', sku: 'v1', price: 25, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active', currency: 'USD', isDefault: true, options: [] }] as unknown as ProductVariant[];
const detail = { product: { _id: 'P1', slug: 'tee', name: 'Tee', description: 'A tee', images: ['https://cdn.example.com/a.jpg'], categoryId: 'c1', tags: [], templateKey: 'default', storeId: 'S1' }, variants, defaultVariant: variants[0] };
const calls = { viewed: [] as unknown[], added: [] as unknown[], templateFetches: [] as unknown[], asked: [] as unknown[] };

vi.mock('@/hooks/marketplace/useProductById', () => ({ useProductById: () => ({ detail, loading: false, error: null, refetch() {} }) }));
vi.mock('@/hooks/marketplace/useRecordProductView', () => ({ useRecordProductView: (id: unknown) => { if (id) calls.viewed.push(id); } }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: async (...a: unknown[]) => { calls.added.push(a); return true; }, adding: null }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => false, fixedPriceFor: () => null, ratesLoaded: true }) }));
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ theme: null, store: { storeId: 'S1', name: 'Shop', baseCurrency: 'USD', lowStockThreshold: 3 }, resolveLink: actual.resolveStorefrontLink }) };
});
vi.mock('@/contexts/WishlistContext', () => ({ useWishlistContext: () => ({ isWishlisted: () => false, toggleWishlist: async () => {}, wishlisting: null, wishlistCount: 0 }) }));
vi.mock('@/contexts/AuthGateContext', async importOriginal => ({ ...(await importOriginal<typeof import('@/contexts/AuthGateContext')>()), useAuthGate: () => ({ requireAuth: (fn: () => unknown) => fn(), open() {} }) }));
vi.mock('../../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer() {}, mounted: false }) }));
vi.mock('../b2b/useWholesale', () => ({ useWholesaleGate: () => ({ locked: false, approved: false, loading: false }), useWholesalePrice: () => null }));
vi.mock('../../useReviewedProducts', () => ({ useReviewedProducts: () => ({ byProduct: new Map(), reload() {} }) }));
vi.mock('@/api/services/rating', () => ({ apiGetProductReviews: () => Promise.resolve({ data: { stats: { average: 0, total: 0 }, reviews: [] } }) }));
vi.mock('@/api/services/metafields', () => ({ apiGetPublicMetafieldValues: () => Promise.resolve({ data: [] }) }));
vi.mock('@/api/services/store', async importOriginal => ({ ...(await importOriginal<typeof import('@/api/services/store')>()), apiGetPublicStoreProducts: () => Promise.resolve({ data: { products: [] } }) }));
vi.mock('@/api/services/productQuestions', () => ({ apiGetPublicQuestions: () => Promise.resolve({ items: [] }), apiAskQuestion: (...a: unknown[]) => { calls.asked.push(a); return Promise.resolve({ ok: true, message: 'ok' }); } }));
vi.mock('@/api/services/merchandising', async importOriginal => ({ ...(await importOriginal<typeof import('@/api/services/merchandising')>()),
  apiPublicRecommendations: () => Promise.resolve({ data: { items: [{ id: 'P2', variantId: 'v9', type: 'physical', slug: 'cap', name: 'Cap', image: null, price: 10, compareAtPrice: null, source: 'manual' }] } }) }));
vi.mock('../pageHooks', async importOriginal => {
  const actual = await importOriginal<typeof import('../pageHooks')>();
  return { ...actual, useTemplateSections: (storeId: unknown) => { calls.templateFetches.push(storeId); return []; } };
});

import { FashionProductMainPreview } from '../../theme-03-fashion/pages/FashionProductPage';
import { TechProductMainPreview } from '../../theme-04-tech/pages/TechProductPage';
import { LedupProductMainPreview } from '../../theme-05-ledup/pages/LedupProductPage';

beforeEach(() => { calls.viewed.length = 0; calls.added.length = 0; calls.templateFetches.length = 0; calls.asked.length = 0; document.title = 'Editor'; });
afterEach(cleanup);

// the seller's DRAFT section, including the blocks that only exist in the draft
const draft = { _id: 'main', type: 'product_main', settings: {}, blocks: [
  { _id: 'b1', type: 'product_media', settings: { layout: 'grid' } },
  { _id: 'b2', type: 'product_title', settings: {} },
  { _id: 'b3', type: 'product_price', settings: {} },
  { _id: 'b5', type: 'product_buy_buttons', settings: {} },
  { _id: 'b6', type: 'product_trust_badges', settings: { items: [{ icon: 'truck', title: 'Draft-only badge' }] } },
  { _id: 'b7', type: 'product_frequently_bought', settings: {} },
  { _id: 'b8', type: 'product_questions', settings: {} },
] } as never;

describe.each([['Maison', FashionProductMainPreview], ['Tech', TechProductMainPreview]] as const)('%s editor preview of the Main Product card', (_n, Preview) => {
  const show = () => render(<MemoryRouter><Preview slug="tee" section={draft} /></MemoryRouter>);

  it('draws the real page body from the DRAFT section: buy button, trust badges, photo layout, Q&A, bought-together', async () => {
    const { container } = show();
    await screen.findByText('Draft-only badge');
    expect(container.querySelector('[data-photo-stack="grid"]')).toBeTruthy();
    expect(container.querySelector('[data-product-questions]')).toBeTruthy();
    await screen.findByText('Cap'); // bought-together pick
    expect(screen.getAllByRole('button', { name: /add to cart/i }).length).toBeGreaterThan(0);
  });
  it('does not fetch the published template, record a view, or touch the editor tab title', async () => {
    show();
    await screen.findByText('Draft-only badge');
    expect(calls.templateFetches.every(s => s === undefined)).toBe(true);
    expect(calls.viewed).toHaveLength(0);
    expect(document.title).toBe('Editor');
  });
  it('buttons never touch a real cart; the question form and add-all send nothing', async () => {
    show();
    await screen.findByText('Draft-only badge');
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Add selected to cart' }));
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Is it machine washable?' } });
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ali' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
    await new Promise(r => setTimeout(r, 30));
    expect(calls.added).toHaveLength(0);
    expect(calls.asked).toHaveLength(0);
  });
  it('shows no reviews block (the card is only the main product)', async () => {
    show();
    await screen.findByText('Draft-only badge');
    expect(document.querySelector('#fx-reviews, #tx-reviews')).toBeNull();
  });
});

describe('Ledup editor preview of the Main Product card', () => {
  it('draws the real page and never records a view or adds to a cart', async () => {
    render(<MemoryRouter><LedupProductMainPreview slug="tee" /></MemoryRouter>);
    const add = await screen.findAllByRole('button', { name: /add to cart|add/i });
    fireEvent.click(add[0]);
    await new Promise(r => setTimeout(r, 30));
    expect(calls.viewed).toHaveLength(0);
    expect(calls.added).toHaveLength(0);
    expect(document.title).toBe('Editor');
  });
});
