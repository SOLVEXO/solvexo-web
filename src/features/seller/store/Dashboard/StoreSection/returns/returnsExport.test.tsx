import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const downloads: { name: string; text: string }[] = [];
const toastError = vi.fn();
const toastSuccess = vi.fn();
const calls: { status?: string; page?: number }[] = [];

const line = (over: Record<string, unknown> = {}) => ({
  orderId: 'o1', orderNumber: 'ORD-1', itemId: 'i1', customer: { name: 'Umer', email: 'u@x.co' }, storeId: 's1',
  productName: 'Ring, "smart"', productImage: null, returnReason: 'damage', amount: 2001, refundedAmount: 2001, returnStatus: 'refunded',
  returnRejectReason: null, returnRequestedAt: '2026-11-16T10:00:00Z', quantity: 1, itemType: 'physical', ...over,
});
const PAGES: Record<number, unknown[]> = {
  1: [line(), line({ itemId: 'i2', orderNumber: 'ORD-2', returnStatus: 'approved', refundedAmount: 0, productName: 'Belt' })],
  2: [line({ itemId: 'i3', orderNumber: 'ORD-3', customer: { name: 'Sara', email: null }, productName: 'Scarf' })],
};

vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ error: toastError, success: toastSuccess }) }));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/utils/csvFile', async importOriginal => ({ ...(await importOriginal<object>()), downloadTextFile: (name: string, text: string) => { downloads.push({ name, text }); } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1', store: { baseCurrency: 'PKR' } }),
  StorePageHeader: () => null,
  hasNavPermission: () => true,
}));
vi.mock('@/api/services/product', () => ({ apiGetSellerOrderDetail: vi.fn() }));
vi.mock('../orders/ExchangeModal', () => ({ ExchangeModal: () => null }));
vi.mock('./ReturnWorkflowModal', () => ({ ReturnWorkflowModal: () => null }));
vi.mock('@/api/services/orders', () => ({
  apiGetSellerReturns: vi.fn((p: { status?: string; page?: number }) => {
    calls.push(p);
    const page = p.page ?? 1;
    const rows = (PAGES[page] ?? []).filter(r => !p.status || (r as { returnStatus: string }).returnStatus === p.status);
    return Promise.resolve({ data: { stats: { openRequests: 1, returnRate: '5%', totalRefunded: 1 }, pagination: { page, limit: 10, total: 3, totalPages: 2 }, returns: rows } });
  }),
}));

import { StoreReturnList } from './ReturnList';
import { returnsToCsv, matchesReturnSearch } from './returnsCsv';
import type { SellerReturnItem } from '@/api/services/orders';

beforeEach(() => { window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia; downloads.length = 0; calls.length = 0; toastError.mockClear(); toastSuccess.mockClear(); });
afterEach(cleanup);
const renderList = () => render(<MemoryRouter><StoreReturnList /></MemoryRouter>);

describe('returnsToCsv', () => {
  it('writes a header, one row per returned line, quotes commas and quotes, and keeps dates and outcomes readable', () => {
    const csv = returnsToCsv([line({ returnResolution: 'refund', returnRefundTo: 'store_credit', returnRestock: 'restock', returnResolvedAt: '2026-11-17T09:00:00Z', returnLabel: { trackingNumber: 'TRK1' } }) as unknown as SellerReturnItem]);
    const [head, row] = csv.trim().split('\r\n');
    expect(head.startsWith('Order,Customer,Customer email,Product,Quantity,Reason,Amount,Refunded amount,Status')).toBe(true);
    expect(row).toContain('ORD-1,Umer,u@x.co,"Ring, ""smart""",1,damage,2001,2001,Refunded,2026-11-16');
    expect(row).toContain('2026-11-17,Refund,Store credit,Restocked,TRK1');
  });
  it('leaves unset fields empty and never lets a customer-typed reason run as a spreadsheet formula', () => {
    const csv = returnsToCsv([line({ returnReason: '=HYPERLINK("http://x")', customer: { name: 'A', email: null } }) as unknown as SellerReturnItem]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv.trim().split('\r\n')[1]).toContain('ORD-1,A,,');
  });
});

describe('matchesReturnSearch', () => {
  it('looks at order, customer and product, ignoring case; blank matches everything', () => {
    const r = line() as unknown as SellerReturnItem;
    expect(matchesReturnSearch(r, '')).toBe(true);
    expect(matchesReturnSearch(r, 'ord-1')).toBe(true);
    expect(matchesReturnSearch(r, 'UMER')).toBe(true);
    expect(matchesReturnSearch(r, 'smart')).toBe(true);
    expect(matchesReturnSearch(r, 'nobody')).toBe(false);
  });
});

describe('Returns page', () => {
  it('Export CSV downloads every page, not only the 10 on screen', async () => {
    renderList();
    await screen.findAllByText('ORD-1');
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => expect(downloads.length).toBe(1));
    expect(calls.filter(c => c.page === 2).length).toBeGreaterThan(0);
    const body = downloads[0].text;
    expect(body).toContain('ORD-1');
    expect(body).toContain('ORD-2');
    expect(body).toContain('ORD-3'); // from page 2
    expect(downloads[0].name).toMatch(/^returns-all-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exports with the status filter chosen on the page', async () => {
    renderList();
    await screen.findAllByText('ORD-1');
    fireEvent.change(screen.getByLabelText('Filter by return status'), { target: { value: 'refunded' } });
    await waitFor(() => expect(calls.some(c => c.status === 'refunded')).toBe(true));
    calls.length = 0;
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => expect(downloads.length).toBe(1));
    expect(calls.every(c => c.status === 'refunded')).toBe(true);
    expect(downloads[0].text).toContain('ORD-1');
    expect(downloads[0].text).not.toContain('ORD-2'); // approved, filtered out
    expect(downloads[0].name).toContain('returns-refunded-');
  });

  it('exports only what the search box shows, and says so when nothing matches', async () => {
    renderList();
    await screen.findAllByText('ORD-1');
    fireEvent.change(screen.getByLabelText('Search returns on this page'), { target: { value: 'scarf' } });
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => expect(downloads.length).toBe(1));
    expect(downloads[0].text).toContain('ORD-3');
    expect(downloads[0].text).not.toContain('ORD-1');
    fireEvent.change(screen.getByLabelText('Search returns on this page'), { target: { value: 'zzz' } });
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('There are no returns to export for this filter.'));
    expect(downloads.length).toBe(1);
  });

  it('each row has one ⋮ menu instead of a row of buttons; the next step comes first', async () => {
    renderList();
    await screen.findAllByText('ORD-2');
    expect(screen.queryByRole('button', { name: 'Mark as received' })).toBeNull();
    const menus = screen.getAllByRole('button', { name: /^Actions for ORD-/ });
    expect(menus.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Actions for ORD-2' })[0]);
    const items = (await screen.findAllByRole('menuitem')).map(i => i.textContent);
    expect(items[0]).toBe('Mark as received');
    expect(items).toContain('Close');
    expect(items).toContain('Exchange');
    expect(items[items.length - 1]).toBe('Open order / label');
  });
});
