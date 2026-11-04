import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { applyMerchantThemeOverrides } from '../theme.config';
import { TechProductCard } from './TechProductCard';

vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', baseCurrency: 'USD', lowStockThreshold: 3 } }) }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: vi.fn(), adding: null }) }));
vi.mock('@/contexts/WishlistContext', () => ({ useWishlistContext: () => ({ isWishlisted: () => false, toggleWishlist: vi.fn() }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({
  useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => true, fixedPriceFor: () => null }),
}));
vi.mock('@/hooks/useLocalize', () => ({ useLocalize: () => ({ product: (p: unknown) => p }) }));
vi.mock('../../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer: vi.fn(), mounted: false }) }));
vi.mock('./compare', () => ({ useCompare: () => ({ has: () => false, full: false, toggle: vi.fn() }) }));
vi.mock('./product/TechQuickView', () => ({ TechQuickView: () => null }));

const product = {
  _id: 'p1', name: 'Gaming laptop', slug: 'gaming-laptop', vendor: 'Acme', variantId: 'v1', type: 'physical',
  defaultVariantPrice: 90, compareAtPrice: 100, inStock: true, images: [], averageRating: 4,
} as never;

const show = (p: unknown = product) => render(<MemoryRouter><TechProductCard product={p as never} currency="USD" /></MemoryRouter>);

describe('Tech product card follows the seller settings', () => {
  beforeEach(() => applyMerchantThemeOverrides(null));
  afterEach(cleanup);

  it('shows sale badge, wishlist, add button and quick view by default, vendor only when switched on', () => {
    show();
    expect(screen.getByText('-10%')).toBeTruthy();
    expect(screen.queryByText('Acme')).toBeNull();
    expect(screen.getByRole('button', { name: /wishlist/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /quick view/i })).toBeTruthy();
    cleanup();
    applyMerchantThemeOverrides({ cardTag: 'show' } as never);
    show();
    expect(screen.getByText('Acme')).toBeTruthy();
  });

  it('hides each part when the seller switches it off', () => {
    applyMerchantThemeOverrides({ saleBadge: 'hide', cardTag: 'hide', cardWishlist: 'hide', cardButton: 'hide', quickView: 'hide' } as never);
    show();
    expect(screen.queryByText('-10%')).toBeNull();
    expect(screen.queryByText('Acme')).toBeNull();
    expect(screen.queryByRole('button', { name: /wishlist/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /add to cart/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /quick view/i })).toBeNull();
  });

  it('can say "Sale" instead of the percentage, and flags sold-out products', () => {
    applyMerchantThemeOverrides({ saleBadgeText: 'label' } as never);
    show();
    expect(screen.getByText('Sale')).toBeTruthy();
    cleanup();
    show({ ...(product as object), inStock: false });
    expect(screen.getAllByText('Sold out').length).toBeGreaterThan(0);
  });
});
