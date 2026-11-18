import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let permitted = true;
let usage = 2;
const calls: string[] = [];
const defs = [
  { _id: 'd1', namespace: 'custom', key: 'size', name: 'Size', type: 'single_line_text_field', required: false },
  { _id: 'd2', namespace: 'custom', key: 'fabric', name: 'Fabric', type: 'single_line_text_field', required: false },
];

vi.mock('@/hooks/auth/useCan', () => ({ can: () => permitted }));
vi.mock('@/hooks/store/useStoreCategoryTree', () => ({ useStoreCategoryTree: () => ({ tree: [], loading: false, error: '', refetch: () => undefined }) }));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/customize/MetafieldsEditor', () => ({
  ValueInput: ({ entry, value, onChange }: { entry: { name: string }; value: string; onChange: (v: string) => void }) => <input aria-label={`value of ${entry.name}`} value={value} onChange={e => onChange(e.target.value)} />,
}));
vi.mock('@/api/services/metafields', () => ({
  apiListMetafieldDefinitions: vi.fn(() => Promise.resolve({ data: defs })),
  apiGetMetafieldValues: vi.fn(() => Promise.resolve({ data: [{ namespace: 'custom', key: 'size', value: '4.5 Meters' }, { namespace: 'custom', key: 'fabric', value: 'Polyester' }] })),
  apiSetMetafieldValues: vi.fn(),
  apiCreateMetafieldDefinition: vi.fn(),
  apiGetMetafieldDefinitionUsage: vi.fn(() => Promise.resolve({ data: { used: usage } })),
  apiUpdateMetafieldDefinition: vi.fn((_s: string, id: string, p: { name: string }) => { calls.push(`rename:${id}:${p.name}`); return Promise.resolve({ data: { ...defs.find(d => d._id === id), name: p.name } }); }),
  apiDeleteMetafieldDefinition: vi.fn((_s: string, id: string) => { calls.push(`delete:${id}`); return Promise.resolve({ data: null }); }),
  apiReorderMetafieldDefinitions: vi.fn(() => Promise.resolve({ data: null })),
  METAFIELD_TYPE_LABELS: { single_line_text_field: 'Single line text', multi_line_text_field: 'Multi-line text', number_integer: 'Integer', number_decimal: 'Decimal', boolean: 'True/False', date: 'Date', url: 'URL', color: 'Color', json: 'JSON' },
}));

import { ProductSpecsEditor } from './ProductSpecsEditor';

beforeEach(() => {
  calls.length = 0; permitted = true; usage = 2;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const openMenu = async (name: string) => {
  fireEvent.click(await screen.findByRole('button', { name: `Manage spec ${name}` }));
};

describe('Specifications card: rename and delete a spec', () => {
  it('tells the seller an empty spec is simply not shown, and that specs are shared', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    expect(await screen.findByText(/leave empty is not shown in this product/i)).toBeTruthy();
  });

  it('delete asks first, says how many products lose it, and only then deletes', async () => {
    const changes: Record<string, string>[] = [];
    render(<ProductSpecsEditor storeId="s1" productId="p1" onValuesChange={v => changes.push(v)} />);
    await openMenu('Fabric');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    expect(await screen.findByText('Delete "Fabric"?')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('delete-usage').textContent).toContain('2 products'));
    expect(calls).toEqual([]); // nothing deleted yet
    fireEvent.click(screen.getByRole('button', { name: 'Delete spec' }));
    await waitFor(() => expect(calls).toEqual(['delete:d2']));
    await waitFor(() => expect(screen.queryByLabelText('value of Fabric')).toBeNull());
    expect(screen.getByLabelText('value of Size')).toBeTruthy(); // the other spec is untouched
    expect(Object.keys(changes[changes.length - 1])).not.toContain('custom:fabric');
  });

  it('cancel deletes nothing', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    await openMenu('Size');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(calls).toEqual([]);
    expect(screen.getByLabelText('value of Size')).toBeTruthy();
  });

  it('says it plainly when no product uses the spec, and for one product', async () => {
    usage = 0;
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    await openMenu('Size');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    await waitFor(() => expect(screen.getByTestId('delete-usage').textContent).toContain('No product has a value'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    usage = 1;
    await openMenu('Fabric');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    await waitFor(() => expect(screen.getByTestId('delete-usage').textContent).toContain('1 product,'));
  });

  it('rename keeps the values and changes the name everywhere', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    await openMenu('Fabric');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Rename/ }));
    fireEvent.change(await screen.findByLabelText('Spec name'), { target: { value: 'Material' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(calls).toEqual(['rename:d2:Material']));
    expect(await screen.findByText('Material')).toBeTruthy();
    expect((screen.getByLabelText('value of Material') as HTMLInputElement).value).toBe('Polyester');
  });

  it('rename refuses a name another spec already has', async () => {
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    await openMenu('Fabric');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Rename/ }));
    fireEvent.change(await screen.findByLabelText('Spec name'), { target: { value: 'size' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('You already have a spec with this name.')).toBeTruthy();
    expect(calls).toEqual([]);
  });

  it('a person without the content permission sees no manage menu', async () => {
    permitted = false;
    render(<ProductSpecsEditor storeId="s1" productId="p1" />);
    await screen.findByLabelText('value of Size');
    expect(screen.queryByRole('button', { name: /Manage spec/ })).toBeNull();
  });
});
