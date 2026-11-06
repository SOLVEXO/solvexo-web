import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import WholesaleHub from './WholesaleHub';

const ok = (items: unknown[]) => ({ items, total: items.length, page: 1, limit: 20 });

beforeEach(() => {
  get.mockReset(); post.mockReset();
  get.mockImplementation((url: string) => {
    if (url.includes('/catalogs')) return Promise.resolve([{ _id: 'cat1', name: 'Wholesale', status: 'active', defaultAdjustmentPercent: -20, includeAllProducts: true, itemCount: 2 }]);
    if (url.includes('/companies')) return Promise.resolve(ok([{ _id: 'c1', name: 'Acme Traders', status: 'approved', taxId: null, taxExempt: false, catalogId: 'cat1', paymentTerms: { type: 'net', netDays: 30 }, allowedPaymentMethods: [], creditLimit: 5000, depositPercent: 0, note: null }]));
    if (url.includes('/applications')) return Promise.resolve(ok([{ _id: 'a1', email: 'x@y.com', companyName: 'New Co', taxId: null, phone: null, message: 'Hello', status: 'pending', decisionNote: null, createdAt: '2026-01-01T00:00:00Z' }]));
    if (url.includes('/reports/outstanding')) return Promise.resolve({ items: [{ companyId: 'c1', companyName: 'Acme Traders', currency: 'PKR', orders: 2, outstanding: 125, overdue: 75, oldestDue: '2026-01-01T00:00:00Z' }] });
    if (url.includes('/orders')) return Promise.resolve(ok([{ _id: 'o1', orderNumber: 'ORD-1', createdAt: '2026-01-01T00:00:00Z', orderStatus: 'pending', isPaid: false, currency: 'PKR', b2b: { companyName: 'Acme Traders', poNumber: 'PO-9', payments: [] },
      receivable: { total: 100, paid: 0, outstanding: 100, status: 'unpaid', dueDate: '2026-01-02T00:00:00Z', overdue: true, depositRequired: 0, depositMet: true } }]));
    return Promise.resolve(ok([]));
  });
});

const renderHub = () => render(<MemoryRouter><WholesaleHub /></MemoryRouter>);

describe('WholesaleHub', () => {
  it('lists companies with their terms', async () => {
    renderHub();
    expect((await screen.findAllByText('Acme Traders')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Net 30').length).toBeGreaterThan(0);
  });

  it('shows pending applications and opens the approve dialog', async () => {
    renderHub();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Applications' }))[0]);
    expect((await screen.findAllByText('New Co')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    expect(await screen.findByText(/makes x@y.com its location admin/)).toBeTruthy();
  });

  it('shows the outstanding report with the overdue amount and a wholesale order with PO number', async () => {
    renderHub();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Orders & balances' }))[0]);
    await waitFor(() => expect(screen.getAllByText('PO PO-9').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Record payment' }).length).toBeGreaterThan(0);
  });

  it('shows an error with a retry when the list cannot be loaded', async () => {
    get.mockImplementation((url: string) => (url.includes('/companies') ? Promise.reject(new Error('boom')) : Promise.resolve([])));
    renderHub();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
