import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
let perms: Record<string, boolean> = {};
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), put: (...a: unknown[]) => put(...a), patch: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => perms[p] ?? false }));
vi.mock('@/components/layouts/StoreLayout', () => ({ useStoreWorkspace: () => ({ storeId: 's1' }), StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import AccountingHub from './AccountingHub';
import { fmt, toMinor } from './accountingUtils';

const settingsOn = {
  enabled: true, currency: 'PKR', exponent: 2,
  settings: { enabled: true, goLiveDate: '2026-11-01T00:00:00.000Z', baseCurrency: 'PKR', lastSyncAt: null, openingEntryId: null, lastSync: null, skippedTotals: { currency: 3 }, lastCheck: { at: '2026-11-22', ok: true, debitMinor: 1, creditMinor: 1, entries: 1 } },
};
const acc = (key: string, code: string, name: string, type: string, balanceMinor = 0) => ({ key, code, name, type, group: '', system: true, archived: false, externalCode: null, debitMinor: 0, creditMinor: 0, balanceMinor });
const accounts = [acc('cash', '1000', 'Cash in hand', 'asset', 1180000), acc('payables', '2000', 'Trade payables', 'liability'), acc('capital', '3000', "Owner's capital", 'equity'), acc('sales_pos', '4010', 'Sales: POS', 'income', 1000000), acc('output_tax', '2100', 'Output sales tax payable', 'liability', 180000)];

function route(map: Record<string, unknown>) {
  get.mockImplementation((url: string) => {
    const hit = Object.keys(map).find(k => url.includes(k));
    return hit ? Promise.resolve(map[hit]) : Promise.reject(new Error(`unexpected ${url}`));
  });
}

beforeEach(() => { get.mockReset(); post.mockReset(); put.mockReset(); perms = { 'accounting.view': true, 'accounting.manage': true }; });
afterEach(cleanup);

describe('accounting utils', () => {
  it('formats minor units and parses typed amounts', () => {
    expect(fmt(1234500, 2)).toBe((12345).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    expect(toMinor('1,250.5', 2)).toBe(125050);
    expect(toMinor('', 2)).toBe(0);
    expect(toMinor('-5', 2)).toBeNull();
  });
});

describe('AccountingHub', () => {
  it('without accounting.view shows no access and loads nothing', () => {
    perms = {};
    render(<AccountingHub />);
    expect(screen.getByText('No access')).toBeTruthy();
    expect(get).not.toHaveBeenCalled();
  });

  it('turns accounting on with the chosen go-live date', async () => {
    route({ '/settings': { enabled: false, settings: null, currency: 'PKR', exponent: 2 } });
    post.mockResolvedValue({});
    render(<AccountingHub />);
    fireEvent.change(await screen.findByLabelText('Books start on'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on accounting' }));
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/setup', { goLiveDate: '2026-11-01' }));
  });

  it('staff who can only view are told to ask the owner instead of seeing the switch', async () => {
    perms = { 'accounting.view': true };
    route({ '/settings': { enabled: false, settings: null, currency: 'PKR', exponent: 2 } });
    render(<AccountingHub />);
    expect(await screen.findByText(/Ask the store owner/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on accounting' })).toBeNull();
  });

  it('the overview shows balances and what was left out of the books', async () => {
    route({ '/settings': settingsOn, '/accounts': accounts });
    render(<AccountingHub />);
    expect(await screen.findByText('Profit since go-live')).toBeTruthy();
    expect((await screen.findAllByText(fmt(1180000, 2))).length).toBeGreaterThan(0);
    expect(screen.getByText(/3 record\(s\) in another currency/)).toBeTruthy();
    expect(screen.getByText('Books balance')).toBeTruthy();
  });

  it('opening balances send each amount on its normal side, in minor units', async () => {
    route({ '/settings': settingsOn, '/accounts': accounts });
    put.mockResolvedValue({});
    render(<AccountingHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Enter opening balances' }));
    fireEvent.change(screen.getByLabelText('1000 · Cash in hand'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('2000 · Trade payables'), { target: { value: '200' } });
    expect(screen.getByText(/difference of/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save opening balances' }));
    await vi.waitFor(() => expect(put).toHaveBeenCalledWith('/api/accounting/s1/opening-balances', { lines: [
      { accountKey: 'cash', debitMinor: 50000, creditMinor: 0 },
      { accountKey: 'payables', debitMinor: 0, creditMinor: 20000 },
    ] }));
  });

  it('a manual entry can be posted only when debits equal credits', async () => {
    route({ '/settings': settingsOn, '/accounts': accounts, '/journal?': { items: [], total: 0 } });
    post.mockResolvedValue({});
    render(<AccountingHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Journal' }));
    fireEvent.click(await screen.findByRole('button', { name: 'New journal entry' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Line 1 account'), { target: { value: 'cash' } });
    fireEvent.change(within(dialog).getByLabelText('Line 1 debit'), { target: { value: '100' } });
    fireEvent.change(within(dialog).getByLabelText('Line 2 account'), { target: { value: 'capital' } });
    fireEvent.change(within(dialog).getByLabelText('Line 2 credit'), { target: { value: '90' } });
    const postBtn = within(dialog).getByRole('button', { name: 'Post entry' }) as HTMLButtonElement;
    expect(postBtn.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText('Line 2 credit'), { target: { value: '100' } });
    expect(postBtn.disabled).toBe(false);
    fireEvent.click(postBtn);
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/journal', expect.objectContaining({
      lines: [{ accountKey: 'cash', debitMinor: 10000, creditMinor: 0, memo: '' }, { accountKey: 'capital', debitMinor: 0, creditMinor: 10000, memo: '' }],
    })));
  });

  it('the trial balance lists accounts with a balance on their side', async () => {
    route({ '/settings': settingsOn, '/accounts': accounts, '/trial-balance': { rows: accounts, totals: { debitMinor: 1180000, creditMinor: 1180000, balanced: true } } });
    render(<AccountingHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Trial balance' }));
    expect(await screen.findByText('Debits equal credits')).toBeTruthy();
    expect(screen.getAllByText('Sales: POS').length).toBeGreaterThan(0);
    expect(screen.queryByText("Owner's capital")).toBeNull(); // zero balance: not listed
  });
});
