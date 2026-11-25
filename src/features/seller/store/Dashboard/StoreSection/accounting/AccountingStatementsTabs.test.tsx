import { dropdown, chooseValue } from '@/components/comman/ui/dropdownTesting';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
let perms: Record<string, boolean> = {};
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), put: vi.fn(), patch: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => perms[p] ?? false }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { SettlementsTab, StatementsTab } from './AccountingStatementsTabs';
import { fmt } from './accountingUtils';

const props = { storeId: 's1', exponent: 2, currency: 'PKR', tick: 0, refresh: vi.fn() };
function route(map: Record<string, unknown>) {
  get.mockImplementation((url: string) => {
    const hit = Object.keys(map).find(k => url.includes(k));
    return hit ? Promise.resolve(map[hit]) : Promise.reject(new Error(`unexpected ${url}`));
  });
}
beforeEach(() => { get.mockReset(); post.mockReset(); perms = { 'accounting.view': true, 'accounting.manage': true }; });
afterEach(cleanup);

const pnl = {
  buckets: ['2026-11', '2026-12'], labels: { '2026-11': '2026-11', '2026-12': '2026-12' }, currency: 'PKR', exponent: 2, locations: [{ id: 'loc1', name: 'Gulberg' }],
  sections: [
    { id: 'income', title: 'Sales', lines: [{ key: 'sales_pos', code: '4010', name: 'Sales: POS', values: { '2026-11': 100000, '2026-12': 0 }, total: 100000 }], values: { '2026-11': 100000, '2026-12': 0 }, total: 100000 },
    { id: 'cost_of_sales', title: 'Cost of sales', lines: [{ key: 'cogs', code: '5000', name: 'Cost of goods sold', values: { '2026-11': 60000, '2026-12': 0 }, total: 60000 }], values: { '2026-11': 60000, '2026-12': 0 }, total: 60000 },
    { id: 'expenses', title: 'Operating expenses', lines: [], values: { '2026-11': 0, '2026-12': 0 }, total: 0 },
    { id: 'other_income', title: 'Other income', lines: [], values: { '2026-11': 0, '2026-12': 0 }, total: 0 },
  ],
  grossProfit: { values: { '2026-11': 40000, '2026-12': 0 }, total: 40000 }, netProfit: { values: { '2026-11': 40000, '2026-12': 0 }, total: 40000 },
};

describe('Statements tab', () => {
  it('shows the profit and loss with gross and net profit, and reloads by channel', async () => {
    route({ '/statements/profit-and-loss': pnl });
    render(<StatementsTab {...props} />);
    expect(await screen.findByText('4010 · Sales: POS')).toBeTruthy();
    expect(screen.getByText('Gross profit')).toBeTruthy();
    expect(screen.getAllByText(fmt(40000, 2)).length).toBeGreaterThan(0);
    chooseValue(dropdown('Columns'), 'channel');
    await vi.waitFor(() => expect(get.mock.calls.some(c => String(c[0]).includes('groupBy=channel'))).toBe(true));
    await screen.findByLabelText('Branch');
    chooseValue(dropdown('Branch'), 'loc1');
    await vi.waitFor(() => expect(get.mock.calls.some(c => String(c[0]).includes('locationId=loc1'))).toBe(true));
  });

  it('the balance sheet shows whether it balances; the sales tax shows what is payable', async () => {
    route({
      '/statements/balance-sheet': { assets: [{ key: 'cash', code: '1000', name: 'Cash in hand', balanceMinor: 150000 }], liabilities: [{ key: 'payables', code: '2000', name: 'Trade payables', balanceMinor: 30000 }], equity: [{ key: 'capital', code: '3000', name: "Owner's capital", balanceMinor: 100000 }], currentProfitMinor: 20000, totals: { assetsMinor: 150000, liabilitiesMinor: 30000, equityMinor: 120000, balanced: true } },
      '/statements/sales-tax': { months: [{ month: '2026-11', outputMinor: 18000, inputMinor: 5000, payableMinor: 13000 }], totals: { outputMinor: 18000, inputMinor: 5000, payableMinor: 13000 }, note: 'A working paper.' },
    });
    render(<StatementsTab {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Balance sheet' }));
    expect(await screen.findByText('Assets = liabilities + equity')).toBeTruthy();
    expect(screen.getByText('Profit for the period (not yet closed)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sales tax' }));
    expect(await screen.findByText(/Sales tax payable for the period/)).toBeTruthy();
  });

  it('downloads Excel with the same query', async () => {
    route({ '/statements/profit-and-loss': pnl, '/exports/': new Blob(['x']) });
    const createUrl = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    render(<StatementsTab {...props} />);
    await screen.findByText('4010 · Sales: POS');
    fireEvent.click(screen.getByRole('button', { name: /Excel/ }));
    await vi.waitFor(() => expect(get.mock.calls.some(c => String(c[0]).includes('/api/accounting/s1/exports/profit-and-loss?') && String(c[0]).includes('groupBy=month'))).toBe(true));
    await vi.waitFor(() => expect(createUrl).toHaveBeenCalled());
  });
});

const settlement = {
  _id: 'st1', gateway: 'jazzcash', fileName: 'jazz.csv', settledOn: '2026-11-20', status: 'draft', createdAt: '2026-11-21',
  totals: { grossMinor: 128000, feeMinor: 3150, netMinor: 124850, matched: 1, unmatched: 1 },
  lines: [
    { row: 2, date: null, reference: 'T1', grossMinor: 118000, feeMinor: 2950, netMinor: 115050, match: { status: 'matched', orderNumbers: ['ORD-77'], expectedMinor: 118000 } },
    { row: 3, date: null, reference: 'T99', grossMinor: 10000, feeMinor: 200, netMinor: 9800, match: { status: 'unmatched', orderNumbers: [], expectedMinor: null } },
  ],
};

describe('Settlements tab', () => {
  it('uploads a file and opens the review; posting sends it to the books', async () => {
    route({ '/settlements?': { sources: [{ key: 'jazzcash', label: 'JazzCash' }], items: [] }, '/settlements/st1': settlement });
    post.mockImplementation((url: string) => Promise.resolve(url.endsWith('/settlements') ? { settlement: { _id: 'st1' }, skippedRows: 0 } : {}));
    render(<SettlementsTab {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: /Upload settlement/ }));
    const dialog = screen.getByRole('dialog');
    const file = new File(['pp_TxnRefNo,Amount,Fee\nT1,1180,29.5\n'], 'jazz.csv', { type: 'text/csv' });
    fireEvent.change(within(dialog).getByLabelText('Settlement file'), { target: { files: [file] } });
    await vi.waitFor(() => expect((within(dialog).getByRole('button', { name: 'Import' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import' }));
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/settlements', expect.objectContaining({ gateway: 'jazzcash', fileName: 'jazz.csv', csv: expect.stringContaining('T1,1180') }), { toast: false }));
    expect((await screen.findAllByText('ORD-77')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not found').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Post to the books' }));
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/settlements/st1/post', {}));
  });

  it('asks which column is which when the headings are not recognised', async () => {
    route({ '/settlements?': { sources: [{ key: 'jazzcash', label: 'JazzCash' }], items: [] } });
    post.mockRejectedValue({ response: { data: { message: 'Which column holds the transaction reference or order number?', headers: ['Ref', 'Value'], columns: {} } } });
    render(<SettlementsTab {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: /Upload settlement/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Settlement file'), { target: { files: [new File(['Ref,Value\nA,1\n'], 'x.csv')] } });
    await vi.waitFor(() => expect((within(dialog).getByRole('button', { name: 'Import' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import' }));
    expect(await within(dialog).findByText('Which column is which?')).toBeTruthy();
    chooseValue(dropdown('Transaction reference or order number', dialog), '0');
    chooseValue(dropdown('Gross amount', dialog), '1');
    post.mockResolvedValue({ settlement: { _id: 'st2' }, skippedRows: 0 });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import' }));
    await vi.waitFor(() => expect(post).toHaveBeenLastCalledWith('/api/accounting/s1/settlements', expect.objectContaining({ columns: { reference: 0, gross: 1 } }), { toast: false }));
  });
});
