import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a), delete: (...a: unknown[]) => del(...a) } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1', store: { checkoutBranding: null } }),
  hasNavPermission: () => allowManage,
  StorePageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <div><h1>{title}</h1>{actions}</div>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal', () => ({ EntityPickerModal: () => null }));

import CheckoutRulesHub from './CheckoutRulesHub';

const fields = [{ field: 'subtotal', kind: 'number', needsAddress: false }, { field: 'country', kind: 'string', needsAddress: true }, { field: 'isB2B', kind: 'boolean', needsAddress: false }, { field: 'maxLineQuantity', kind: 'number', needsAddress: false }];
const rule = { _id: 'r1', name: 'No COD big orders', type: 'payment', status: 'active', priority: 100, conditions: [{ field: 'subtotal', op: 'gt', value: 500 }], action: { mode: 'hide', methods: ['cash_on_delivery'] } };

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); del.mockReset(); allowManage = true;
  get.mockImplementation((url: string) => Promise.resolve(url.includes('shipping') ? { success: true, data: [] } : { rules: [rule], fields }));
});
afterEach(cleanup);

describe('CheckoutRulesHub', () => {
  it('lists rules in plain words and switches one off', async () => {
    patch.mockResolvedValue({});
    render(<CheckoutRulesHub />);
    expect(await screen.findByText('No COD big orders')).toBeTruthy();
    expect(screen.getByText(/Hide: cash_on_delivery/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    await waitFor(() => expect(patch.mock.calls[0]).toEqual(['/api/checkout-rules/s1/r1', { status: 'draft' }]));
  });

  it('view-only people get no New rule / Edit / Delete', async () => {
    allowManage = false;
    render(<CheckoutRulesHub />);
    await screen.findByText('No COD big orders');
    expect(screen.queryByRole('button', { name: /new rule/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('building an order-limit rule posts typed numbers and the customer message', async () => {
    post.mockResolvedValue({});
    render(<CheckoutRulesHub />);
    await screen.findByText('No COD big orders');
    fireEvent.click(screen.getByRole('button', { name: /new rule/i }));
    fireEvent.change(await screen.findByLabelText('Rule name'), { target: { value: 'Max 5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    fireEvent.change(screen.getByLabelText('Condition field'), { target: { value: 'maxLineQuantity' } });
    fireEvent.change(screen.getByLabelText('Condition operator'), { target: { value: 'gt' } });
    fireEvent.change(screen.getByLabelText('Condition value'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Message the customer sees/), { target: { value: 'At most 5 of one item.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/api/checkout-rules/s1');
    expect(post.mock.calls[0][1]).toEqual({ name: 'Max 5', type: 'validation', status: 'draft', priority: 100, conditions: [{ field: 'maxLineQuantity', op: 'gt', value: 5 }], action: { message: 'At most 5 of one item.' } });
  });

  it('a discount rule cannot pick address fields (the address is not known yet)', async () => {
    render(<CheckoutRulesHub />);
    await screen.findByText('No COD big orders');
    fireEvent.click(screen.getByRole('button', { name: /new rule/i }));
    fireEvent.change(await screen.findByLabelText('What it does'), { target: { value: 'discount' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    const options = Array.from((screen.getByLabelText('Condition field') as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toContain('subtotal');
    expect(options).not.toContain('country');
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    render(<CheckoutRulesHub />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
