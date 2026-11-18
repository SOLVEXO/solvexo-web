import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls: { op: string; args: unknown }[] = [];
let reorderFails = false;
const mk = (_id: string, name: string, extra: Record<string, unknown> = {}) => ({ _id, namespace: 'custom', key: name.toLowerCase(), name, type: 'single_line_text_field', required: false, categoryIds: [], ...extra });
let defs: ReturnType<typeof mk>[];
let storedValues: { namespace: string; key: string; value: string }[];

vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/hooks/store/useStoreCategoryTree', () => ({
  useStoreCategoryTree: () => ({ tree: [{ _id: 'cl', name: 'Clothing', children: [{ _id: 'sh', name: 'Shirts', children: [] }] }, { _id: 'el', name: 'Electronics', children: [] }], loading: false, error: '', refetch: () => undefined }),
}));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/customize/MetafieldsEditor', () => ({
  ValueInput: ({ entry, value, onChange }: { entry: { name: string; type: string }; value: string; onChange: (v: string) => void }) => <input aria-label={`value of ${entry.name}`} data-type={entry.type} value={value} onChange={e => onChange(e.target.value)} />,
}));
vi.mock('@/api/services/metafields', () => ({
  METAFIELD_TYPE_LABELS: { single_line_text_field: 'Single line text', multi_line_text_field: 'Multi-line text', number_integer: 'Integer', number_decimal: 'Decimal', boolean: 'True/False', date: 'Date', url: 'URL', color: 'Color', json: 'JSON' },
  apiListMetafieldDefinitions: vi.fn(() => Promise.resolve({ data: defs })),
  apiGetMetafieldValues: vi.fn(() => Promise.resolve({ data: storedValues })),
  apiSetMetafieldValues: vi.fn((_s: string, _r: string, _id: string, rows: unknown) => { calls.push({ op: 'setValues', args: rows }); return Promise.resolve({}); }),
  apiCreateMetafieldDefinition: vi.fn((_s: string, p: Record<string, unknown>) => { calls.push({ op: 'create', args: p }); return Promise.resolve({ data: mk('new', String(p.name), { type: p.type, categoryIds: p.categoryIds ?? [] }) }); }),
  apiUpdateMetafieldDefinition: vi.fn((_s: string, id: string, p: Record<string, unknown>) => { calls.push({ op: 'update', args: { id, ...p } }); return Promise.resolve({ data: { ...defs.find(d => d._id === id), ...p } }); }),
  apiReorderMetafieldDefinitions: vi.fn((_s: string, _r: string, ids: string[]) => { calls.push({ op: 'reorder', args: ids }); return reorderFails ? Promise.reject(new Error('x')) : Promise.resolve({ data: null }); }),
  apiDeleteMetafieldDefinition: vi.fn(), apiGetMetafieldDefinitionUsage: vi.fn(),
}));

import { ProductSpecsEditor } from './ProductSpecsEditor';

beforeEach(() => {
  calls.length = 0; reorderFails = false;
  defs = [mk('d1', 'Size'), mk('d2', 'Fabric'), mk('d3', 'Voltage', { categoryIds: ['el'] }), mk('d4', 'Fit', { categoryIds: ['cl'] })];
  storedValues = [];
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const order = () => screen.getAllByLabelText(/^value of /).map(e => e.getAttribute('aria-label')!.replace('value of ', ''));

describe('specs for a category', () => {
  it('shows the specs for everyone plus the ones for this product\'s category, and tucks the rest away', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl', 'sh']} />);
    await screen.findByLabelText('value of Size');
    expect(order()).toEqual(['Size', 'Fabric', 'Fit']); // Voltage is for Electronics
    expect(screen.getByText('Show 1 spec for other categories')).toBeTruthy();
  });

  it('"Show … for other categories" reveals them, and hides them again', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByText('Show 1 spec for other categories'));
    expect(order()).toContain('Voltage');
    fireEvent.click(screen.getByText('Hide the specs for other categories'));
    expect(order()).not.toContain('Voltage');
  });

  it('a spec for another category still shows when this product already has a value for it', async () => {
    storedValues = [{ namespace: 'custom', key: 'voltage', value: '220V' }];
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    await screen.findByLabelText('value of Size');
    expect(order()).toContain('Voltage');
  });

  it('with no category chosen yet, the category-specific specs wait', async () => {
    render(<ProductSpecsEditor storeId="s1" categoryIds={['', '']} />);
    await screen.findByLabelText('value of Size');
    expect(order()).toEqual(['Size', 'Fabric']);
  });

  it('saving sends only the specs this product shows (a hidden required spec cannot block it)', async () => {
    defs[2] = mk('d3', 'Voltage', { categoryIds: ['el'], required: true });
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.change(await screen.findByLabelText('value of Size'), { target: { value: 'M' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save specifications' }));
    await waitFor(() => expect(calls.some(c => c.op === 'setValues')).toBe(true));
    const rows = calls.find(c => c.op === 'setValues')!.args as { key: string }[];
    expect(rows.map(r => r.key)).toEqual(['size', 'fabric', 'fit']);
  });

  it('the menu\'s "Choose categories…" saves the ticked categories', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Manage spec Size' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Choose categories/ }));
    fireEvent.click(await screen.findByLabelText('Shirts'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(calls.find(c => c.op === 'update')).toBeTruthy());
    expect(calls.find(c => c.op === 'update')!.args).toEqual({ id: 'd1', categoryIds: ['sh'] });
  });

  it('a new spec can be limited to this product\'s category right away, and can have a type', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl', 'sh']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add spec' }));
    fireEvent.change(screen.getByPlaceholderText(/Spec name/), { target: { value: 'Collar' } });
    fireEvent.change(screen.getByLabelText('Spec type'), { target: { value: 'number_decimal' } });
    fireEvent.click(screen.getByLabelText('Only for products in this category'));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(calls.find(c => c.op === 'create')).toBeTruthy());
    const p = calls.find(c => c.op === 'create')!.args as Record<string, unknown>;
    expect(p.type).toBe('number_decimal');
    expect(p.categoryIds).toEqual(['sh']); // the most specific one
    expect(await screen.findByLabelText('value of Collar')).toBeTruthy();
  });

  it('without that tick, a new spec is for every product', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add spec' }));
    fireEvent.change(screen.getByPlaceholderText(/Spec name/), { target: { value: 'Care' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(calls.find(c => c.op === 'create')).toBeTruthy());
    expect((calls.find(c => c.op === 'create')!.args as Record<string, unknown>).categoryIds).toBeUndefined();
  });
});

describe('order of the specs', () => {
  it('Move down changes the order at once and saves every id in the new order', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Manage spec Size' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Move down/ }));
    expect(order().slice(0, 2)).toEqual(['Fabric', 'Size']);
    await waitFor(() => expect(calls.find(c => c.op === 'reorder')).toBeTruthy());
    expect(calls.find(c => c.op === 'reorder')!.args).toEqual(['d2', 'd1', 'd3', 'd4']);
  });

  it('Move up on the first spec does nothing', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Manage spec Size' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Move up/ }));
    expect(order()[0]).toBe('Size');
    expect(calls.find(c => c.op === 'reorder')).toBeUndefined();
  });

  it('dragging one spec onto another moves it there', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    const fit = (await screen.findByLabelText('Drag to move Fit'));
    const sizeCell = screen.getByLabelText('value of Size').closest('div[class*="relative"]') as HTMLElement;
    fireEvent.dragStart(fit, { dataTransfer: { effectAllowed: '' } });
    fireEvent.dragOver(sizeCell);
    fireEvent.drop(sizeCell);
    expect(order()).toEqual(['Fit', 'Size', 'Fabric']);
    await waitFor(() => expect(calls.find(c => c.op === 'reorder')).toBeTruthy());
  });

  it('puts the old order back and says so when saving the order fails', async () => {
    reorderFails = true;
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Manage spec Size' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Move down/ }));
    expect(await screen.findByText('Could not save the new order.')).toBeTruthy();
    expect(order().slice(0, 2)).toEqual(['Size', 'Fabric']);
  });
});

describe('suggested specs for the category', () => {
  it('offers the specs this kind of category usually has that the store lacks, and adds one on click for this category', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    const box = await screen.findByTestId('spec-suggestions');
    expect(box.textContent).toContain('Suggested for clothing');
    expect(box.textContent).toContain('Season');
    expect(box.textContent).toContain('Care instructions');
    expect(box.textContent).not.toContain('Fabric'); // the store already has it
    fireEvent.click(screen.getByRole('button', { name: /Season/ }));
    await waitFor(() => expect(calls.find(c => c.op === 'create')).toBeTruthy());
    const p = calls.find(c => c.op === 'create')!.args as Record<string, unknown>;
    expect(p.name).toBe('Season');
    expect(p.categoryIds).toEqual(['cl']);
    expect(await screen.findByLabelText('value of Season')).toBeTruthy();
  });

  it('"Add all" adds every suggestion with its own type', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    await screen.findByTestId('spec-suggestions');
    fireEvent.click(screen.getByRole('button', { name: 'Add all' }));
    await waitFor(() => expect(calls.filter(c => c.op === 'create').length).toBe(2));
    expect(calls.filter(c => c.op === 'create').map(c => (c.args as { name: string; type: string }).type)).toEqual(['single_line_text_field', 'multi_line_text_field']);
    await waitFor(() => expect(screen.queryByTestId('spec-suggestions')).toBeNull());
  });

  it('"Not now" hides the box', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['cl']} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByTestId('spec-suggestions')).toBeNull();
  });

  it('no box when no category is chosen or none fits', async () => {
    const { unmount } = render(<ProductSpecsEditor storeId="s1" productId="p1" categoryIds={['', '']} />);
    await screen.findByLabelText('value of Size');
    expect(screen.queryByTestId('spec-suggestions')).toBeNull();
    unmount();
  });
});
