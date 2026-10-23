import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProductPageContext, type ProductPageValue } from '../../../productContext';
import { RelatedProductsSection } from './RelatedProductsSection';
import type { Section } from '@/api/services/storefrontTypes';

const api = vi.fn();
vi.mock('@/api/services/store', () => ({ apiGetPublicStoreProducts: (...a: unknown[]) => api(...a) }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 'store1' } }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'PKR' }) }));
vi.mock('../../components/FashionProductCard', () => ({ FashionProductCard: ({ product }: { product: { _id: string; name: string } }) => <div data-testid="card">{product.name}</div> }));
vi.mock('../SectionShell', () => ({ SectionShell: ({ heading, children }: { heading?: string; children: ReactNode }) => <section><h2>{heading}</h2>{children}</section> }));

const p = (n: number) => ({ _id: `p${n}`, name: `Product ${n}` });
const reply = (...n: number[]) => Promise.resolve({ data: { products: n.map(p) } });
const colors = {} as never;

function show(settings: Record<string, unknown>, product: ProductPageValue | null = { productId: 'p1', categoryId: 'root', subCategoryId: 'sub', complementaryProductIds: [] }) {
  const section = { type: 'related_products', settings } as unknown as Section;
  return render(
    <ProductPageContext.Provider value={product}>
      <RelatedProductsSection section={section} blocks={[]} colors={colors} />
    </ProductPageContext.Provider>,
  );
}
const shown = () => screen.queryAllByTestId('card').map(c => c.textContent);

beforeEach(() => { api.mockReset(); });
// No vitest globals here, so Testing Library's automatic cleanup is off — without this every render piles up in one document.
afterEach(cleanup);

describe('RelatedProductsSection (Product Recommendations)', () => {
  it('related: asks for the product\'s own subcategory first, hides the viewed product', async () => {
    api.mockReturnValue(reply(1, 2, 3, 4, 5));
    show({ heading: 'You may also like', source: 'related', limit: 4 });
    await waitFor(() => expect(shown()).toEqual(['Product 2', 'Product 3', 'Product 4', 'Product 5']));
    expect(api).toHaveBeenCalledWith('store1', expect.objectContaining({ categoryId: 'sub', sort: 'best_selling' }));
    expect(screen.getByText('You may also like')).toBeTruthy();
  });

  it('related: tops up from the main category when the subcategory has too few', async () => {
    api.mockReturnValueOnce(reply(1, 2)).mockReturnValueOnce(reply(1, 2, 3, 4, 5));
    show({ source: 'related', limit: 4 });
    await waitFor(() => expect(shown()).toEqual(['Product 2', 'Product 3', 'Product 4', 'Product 5']));
    expect(api).toHaveBeenNthCalledWith(2, 'store1', expect.objectContaining({ categoryId: 'root' }));
  });

  it('related: a section saved before `source` existed still behaves as related', async () => {
    api.mockReturnValue(reply(1, 2, 3));
    show({ heading: 'Old', limit: 4, columns: 4 });
    await waitFor(() => expect(shown()).toEqual(['Product 2', 'Product 3']));
  });

  it('related and complementary render nothing outside a product page', async () => {
    show({ source: 'related' }, null);
    show({ source: 'complementary' }, null);
    await new Promise(r => setTimeout(r, 20));
    expect(api).not.toHaveBeenCalled();
    expect(shown()).toEqual([]);
  });

  it('complementary: shows exactly the products picked for this product', async () => {
    api.mockReturnValue(reply(7, 8));
    show({ source: 'complementary', limit: 3 }, { productId: 'p1', categoryId: 'root', complementaryProductIds: ['p7', 'p8'] });
    await waitFor(() => expect(shown()).toEqual(['Product 7', 'Product 8']));
    expect(api).toHaveBeenCalledWith('store1', expect.objectContaining({ ids: ['p7', 'p8'] }));
  });

  it('complementary: a product with no picks shows nothing and asks the server for nothing', async () => {
    show({ source: 'complementary' });
    await new Promise(r => setTimeout(r, 20));
    expect(api).not.toHaveBeenCalled();
    expect(shown()).toEqual([]);
  });

  it('category / collection / manual work anywhere, with or without a product page', async () => {
    api.mockReturnValue(reply(2, 3));
    show({ source: 'category', categoryId: 'catX' }, null);
    await waitFor(() => expect(shown()).toEqual(['Product 2', 'Product 3']));
    expect(api).toHaveBeenCalledWith('store1', expect.objectContaining({ categoryId: 'catX' }));
  });

  it('collection: asks for that collection', async () => {
    api.mockReturnValue(reply(2));
    show({ source: 'collection', collectionId: 'colY' }, null);
    await waitFor(() => expect(shown()).toEqual(['Product 2']));
    expect(api).toHaveBeenCalledWith('store1', expect.objectContaining({ collectionId: 'colY' }));
  });

  it('manual: shows the section\'s own hand-picked list', async () => {
    api.mockReturnValue(reply(4, 5));
    show({ source: 'manual', productIds: ['p4', 'p5'] }, null);
    await waitFor(() => expect(shown()).toEqual(['Product 4', 'Product 5']));
    expect(api).toHaveBeenCalledWith('store1', expect.objectContaining({ ids: ['p4', 'p5'] }));
  });

  it('category / collection with nothing chosen yet, and manual with no picks, render nothing', async () => {
    show({ source: 'category' }, null);
    show({ source: 'collection' }, null);
    show({ source: 'manual', productIds: [] }, null);
    await new Promise(r => setTimeout(r, 20));
    expect(api).not.toHaveBeenCalled();
    expect(shown()).toEqual([]);
  });

  it('a failed request renders nothing instead of crashing', async () => {
    api.mockReturnValue(Promise.reject(new Error('boom')));
    show({ source: 'related' });
    await new Promise(r => setTimeout(r, 20));
    expect(shown()).toEqual([]);
  });
});
