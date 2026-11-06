import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => (p === 'khata.manage' ? allowManage : true) }));
vi.mock('@/components/layouts/StoreLayout', () => ({ useStoreWorkspace: () => ({ storeId: 's1' }), StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import KhataHub from './KhataHub';

const list = { items: [{ _id: 'a1', name: 'Ali Traders', phone: '0300', currency: 'PKR', balance: 1500, creditLimit: 5000, lastEntryAt: null }], total: 1, page: 1, limit: 20, totalOwed: 1500, customersOwing: 1 };

beforeEach(() => { get.mockReset(); post.mockReset(); allowManage = true; get.mockResolvedValue(list); });
afterEach(cleanup);

describe('KhataHub', () => {
  it('lists customers with what they owe and the total', async () => {
    render(<KhataHub />);
    expect((await screen.findAllByText('Ali Traders')).length).toBeGreaterThan(0);
    expect(screen.getByText(/owe you/)).toBeTruthy();
    expect(get.mock.calls[0][0]).toContain('/api/khata/s1/accounts');
  });

  it('hides Add customer from people who cannot manage', async () => {
    allowManage = false;
    render(<KhataHub />);
    await screen.findAllByText('Ali Traders');
    expect(screen.queryByRole('button', { name: 'Add customer' })).toBeNull();
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    render(<KhataHub />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });

  it('adding a customer posts only the typed fields', async () => {
    post.mockResolvedValue({});
    render(<KhataHub />);
    await screen.findAllByText('Ali Traders');
    fireEvent.click(screen.getByRole('button', { name: 'Add customer' }));
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Zara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await screen.findAllByText('Ali Traders');
    expect(post).toHaveBeenCalledWith('/api/khata/s1/accounts', { name: 'Zara', phone: undefined, creditLimit: null });
  });
});
