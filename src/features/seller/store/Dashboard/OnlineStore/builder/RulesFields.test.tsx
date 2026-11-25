import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { RulesPreviewField, ValueListField } from './RulesFields';
import { SectionFields } from './SectionFields';
import { dropdown, optionsOf, shownText } from '@/components/comman/ui/dropdownTesting';

const getProducts = vi.fn();
vi.mock('@/api/services/store', async importOriginal => {
  const actual = await importOriginal<typeof import('@/api/services/store')>();
  return { ...actual, apiGetPublicStoreProducts: (...a: unknown[]) => getProducts(...a) };
});

const FACETS = {
  tags: [{ value: 'summer', count: 3 }, { value: 'winter', count: 1 }],
  vendors: [{ value: 'Nike', count: 2 }],
  price: { min: 5, max: 250, currency: 'PKR' },
};
const respond = (total: number) => (_storeId: string, params: { facets?: boolean }) =>
  Promise.resolve({ data: { products: [], pagination: { page: 1, limit: 1, total, totalPages: 1 }, ...(params?.facets ? { facets: FACETS } : {}) } });

beforeEach(() => { getProducts.mockReset(); getProducts.mockImplementation(respond(3)); });
afterEach(cleanup);

function ListHarness({ source, initial = [] as string[], spy }: { source: 'tags' | 'vendors'; initial?: string[]; spy?: (v: string[]) => void }) {
  const [v, setV] = useState(initial);
  return <ValueListField value={v} source={source} storeId="S1" onChange={n => { setV(n); spy?.(n); }} />;
}

describe('ValueListField', () => {
  it('suggests the store\'s real tags (with counts), and picking / typing adds a chip', async () => {
    render(<ListHarness source="tags" />);
    await waitFor(() => expect(document.querySelectorAll('datalist option').length).toBe(2));
    expect(Array.from(document.querySelectorAll('datalist option')).map(o => o.textContent)).toEqual(['summer (3)', 'winter (1)']);
    const input = screen.getByLabelText('Add a tag');
    fireEvent.change(input, { target: { value: '  Clearance, sale  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Clearance sale')).toBeTruthy(); // commas can never be part of a value
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('suggestions leave out what is already chosen; chips can be removed', async () => {
    const spy = vi.fn();
    render(<ListHarness source="tags" initial={['summer']} spy={spy} />);
    await waitFor(() => expect(document.querySelectorAll('datalist option').length).toBe(1));
    expect(document.querySelector('datalist option')?.getAttribute('value')).toBe('winter');
    fireEvent.click(screen.getByLabelText('Remove summer'));
    expect(spy).toHaveBeenLastCalledWith([]);
  });

  it('ignores a duplicate (any letter case) and an empty entry', () => {
    const spy = vi.fn();
    render(<ListHarness source="tags" initial={['Summer']} spy={spy} />);
    const input = screen.getByLabelText('Add a tag');
    fireEvent.change(input, { target: { value: 'summer' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('a value typed and left (blur) is not lost', () => {
    const spy = vi.fn();
    render(<ListHarness source="vendors" spy={spy} />);
    const input = screen.getByLabelText('Add a vendor');
    fireEvent.change(input, { target: { value: 'Adidas' } });
    fireEvent.blur(input);
    expect(spy).toHaveBeenCalledWith(['Adidas']);
  });

  it('stops at 20 values', () => {
    const many = Array.from({ length: 20 }, (_, i) => `t${i}`);
    render(<ListHarness source="tags" initial={many} />);
    expect((screen.getByLabelText('Add a tag') as HTMLInputElement).disabled).toBe(true);
  });

  it('vendors come from the store\'s vendor list', async () => {
    render(<ListHarness source="vendors" />);
    await waitFor(() => expect(document.querySelector('datalist option')?.getAttribute('value')).toBe('Nike'));
  });
});

describe('RulesPreviewField', () => {
  it('counts the matching products for the rules as they are, and asks for one row only', async () => {
    render(<RulesPreviewField storeId="S1" settings={{ source: 'rules', ruleTags: ['summer'], rulePriceMax: 100, ruleSort: 'price_asc' }} />);
    expect(await screen.findByText('3 products match these rules.', {}, { timeout: 3000 })).toBeTruthy();
    const call = getProducts.mock.calls.find(c => !c[1]?.facets)!;
    expect(call[0]).toBe('S1');
    expect(call[1]).toMatchObject({ limit: 1, tags: ['summer'], maxPrice: 100, sort: 'price_asc' });
    expect(screen.getByText(/Your prices run from 5 to 250 PKR/)).toBeTruthy();
  });

  it('one product: singular wording', async () => {
    getProducts.mockImplementation(respond(1));
    render(<RulesPreviewField storeId="S1" settings={{ source: 'rules' }} />);
    expect(await screen.findByText('1 product matches these rules.', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('none: says the section will not show', async () => {
    getProducts.mockImplementation(respond(0));
    render(<RulesPreviewField storeId="S1" settings={{ source: 'rules', ruleTags: ['nothing'] }} />);
    expect(await screen.findByText(/No products match these rules yet, so this section will not show/, {}, { timeout: 3000 })).toBeTruthy();
  });

  it('a failed check does not break the form', async () => {
    getProducts.mockImplementation((_s: string, p: { facets?: boolean }) => (p?.facets ? respond(1)('S1', p) : Promise.reject(new Error('offline'))));
    render(<RulesPreviewField storeId="S1" settings={{ source: 'rules' }} />);
    expect(await screen.findByText(/Could not check right now/, {}, { timeout: 3000 })).toBeTruthy();
  });
});

describe('Featured products form', () => {
  const mount = (settings: Record<string, unknown>) =>
    render(<SectionFields type="featured_products" settings={settings} onChange={vi.fn()} storeId="S1" />);

  it('"Products that match rules" shows the rule fields and the live count', async () => {
    mount({ source: 'rules', limit: 8 });
    for (const label of ['Tags', 'Brand / vendor', 'Lowest price', 'Highest price', 'Kind of product', 'Stock', 'Only products on sale', 'Order', 'Matching products']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(await screen.findByText(/products? match/, {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.queryByText('Hide sold-out products')).toBeNull(); // the rule "Stock" covers it
  });

  it('the fixed lists keep their simple form plus "Hide sold-out products"', () => {
    mount({ source: 'bestsellers', limit: 8 });
    expect(screen.getByText('Hide sold-out products')).toBeTruthy();
    expect(screen.queryByText('Lowest price')).toBeNull();
    expect(screen.queryByText('Matching products')).toBeNull();
  });

  it('choosing the new source in the list is possible', () => {
    mount({ source: 'newArrivals' });
    const select = dropdown('New Arrivals');
    expect(shownText(select)).toBe('New Arrivals');
    expect(optionsOf(select).map(o => o.value)).toContain('rules');
  });
});
