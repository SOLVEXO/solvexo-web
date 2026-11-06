import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { applyMerchantThemeOverrides } from './theme.config';
import { TechProductCard } from './components/TechProductCard';
import { ProductDescriptionTabs } from './components/product/ProductDescriptionTabs';
import { TechButton } from './ui/techUi';
import { TechDialog } from './ui/techDialog';
import { TechCard, TechFactStrip, TechPanel } from './ui/techPanels';
import { techTd, techTh } from './ui/techPanelStyles';

vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', baseCurrency: 'USD', lowStockThreshold: 3 } }) }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: vi.fn(), adding: null }) }));
vi.mock('@/contexts/WishlistContext', () => ({ useWishlistContext: () => ({ isWishlisted: () => false, toggleWishlist: vi.fn() }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({
  useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => true, fixedPriceFor: () => null }),
}));
vi.mock('@/hooks/useLocalize', () => ({ useLocalize: () => ({ product: (p: unknown) => p }) }));
vi.mock('../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer: vi.fn(), mounted: false }) }));
vi.mock('./components/compare', () => ({ useCompare: () => ({ has: () => false, full: false, toggle: vi.fn() }) }));
vi.mock('./components/product/TechQuickView', () => ({ TechQuickView: () => null }));

const sale = { _id: 'p1', name: 'Gaming laptop', slug: 'gaming-laptop', vendor: 'Acme', variantId: 'v1', type: 'physical', defaultVariantPrice: 90, compareAtPrice: 100, inStock: true, images: ['/a.jpg'], averageRating: 4 };
const soldOut = { ...sale, _id: 'p2', name: 'Desktop PC', slug: 'desktop-pc', inStock: false, compareAtPrice: undefined };
const tabs = [
  { key: 'description', title: 'Description', content: 'Main text', html: false },
  { key: 'specs', title: 'Specs', content: '16 GB memory', html: false },
];

// Automated accessibility checks (axe-core) on Tech's building blocks. This is not a full-page browser audit.
describe('Tech accessibility', () => {
  beforeEach(() => applyMerchantThemeOverrides(null));
  afterEach(cleanup);

  it('product cards have no violations (on sale, sold out, centred text, square badges)', async () => {
    applyMerchantThemeOverrides({ cardTextAlign: 'center', badgeStyle: 'square', cardTag: 'show' } as never);
    const { container } = render(
      <MemoryRouter>
        <ul style={{ listStyle: 'none' }}>
          <li><TechProductCard product={sale as never} currency="USD" /></li>
          <li><TechProductCard product={soldOut as never} currency="USD" /></li>
          <li><TechProductCard product={sale as never} currency="USD" layout="list" /></li>
        </ul>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('buttons have no violations', async () => {
    const { container } = render(<div><TechButton>Add to cart</TechButton><TechButton variant="outline" disabled>Sold out</TechButton></div>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('dialog has no violations', async () => {
    const { baseElement } = render(<TechDialog title="Quick view" onClose={() => undefined}><p>Details</p></TechDialog>);
    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it('product tabs and accordion have no violations', async () => {
    const tabsView = render(<ProductDescriptionTabs tabs={tabs} />);
    expect(await axe(tabsView.container)).toHaveNoViolations();
    cleanup();
    applyMerchantThemeOverrides({ themeSettings: { techProductTabs: 'accordion' } } as never);
    const accordion = render(<ProductDescriptionTabs tabs={tabs} />);
    expect(await axe(accordion.container)).toHaveNoViolations();
  });

  it('panels, fact strip and data tables have no violations', async () => {
    const { container } = render(
      <div>
        <TechFactStrip items={[{ label: 'Order', value: '#1001' }, { label: 'Placed', value: 'Nov 4' }]} />
        <TechPanel title="Items" flush>
          <table>
            <thead><tr><th scope="col" style={techTh()}>Product</th><th scope="col" style={techTh()}>Total</th></tr></thead>
            <tbody><tr><td style={techTd()}>Laptop</td><td style={techTd()}>$900</td></tr></tbody>
          </table>
        </TechPanel>
        <TechCard><p>A list row</p></TechCard>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
