import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
let perms: Record<string, boolean> = {};
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), put: (...a: unknown[]) => put(...a), patch: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => perms[p] ?? false }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { CashBookTab, ExpensesTab, ProfitTaxTab, SuppliersTab } from './AccountingBooksTabs';
import { fmt } from './accountingUtils';

const acc = (key: string, code: string, name: string, type: string, balanceMinor = 0, group = '') => ({ key, code, name, type, group, system: true, archived: false, externalCode: null, debitMinor: 0, creditMinor: 0, balanceMinor });
const accounts = [acc('cash', '1000', 'Cash in hand', 'asset', 250000, 'Cash and bank'), acc('bank', '1100', 'Bank', 'asset', 900000, 'Cash and bank'), acc('exp_rent', '6100', 'Rent', 'expense'), acc('exp_other', '6190', 'Other expenses', 'expense')] as never[];
const props = { storeId: 's1', exponent: 2, currency: 'PKR', accounts, tick: 0, refresh: vi.fn(), openLedger: vi.fn() };
const wrap = <T,>(data: T) => ({ success: true, data });

function route(map: Record<string, unknown>) {
  get.mockImplementation((url: string) => {
    const hit = Object.keys(map).find(k => url.includes(k));
    return hit ? Promise.resolve(map[hit]) : Promise.reject(new Error(`unexpected ${url}`));
  });
}

beforeEach(() => { get.mockReset(); post.mockReset(); put.mockReset(); perms = { 'accounting.view': true, 'accounting.manage': true }; });
afterEach(cleanup);

const expense = { id: 'e1', number: 'EXP-000007', category: 'rent', amountMinor: 3000000, payee: 'Landlord', method: 'bank', note: null, occurredAt: '2026-11-05', sessionId: null, status: 'recorded', decisionNote: null, hasReceipt: true, employeeName: null };

describe('Expenses tab', () => {
  it('lists expenses with totals by category', async () => {
    route({ '/expenses?': wrap({ expenses: [expense], totalsByCategoryMinor: { rent: 3000000 } }) });
    render(<ExpensesTab {...props} />);
    expect((await screen.findAllByText('EXP-000007')).length).toBeGreaterThan(0);
    expect(screen.getByText(`Total ${fmt(3000000, 2)} PKR`)).toBeTruthy();
    expect(get.mock.calls[0][0]).toContain('/api/accounting/s1/expenses?');
  });

  it('records an expense in minor units with a request id', async () => {
    route({ '/expenses?': wrap({ expenses: [], totalsByCategoryMinor: {} }) });
    post.mockResolvedValue({});
    render(<ExpensesTab {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Record expense' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Amount (PKR)'), { target: { value: '1,500.25' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record' }));
    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/api/accounting/s1/expenses');
    expect(body).toMatchObject({ category: 'rent', amountMinor: 150025, method: 'bank' });
    expect(String(body.requestId)).toMatch(/^web:/);
  });

  it('a manager can approve an expense awaiting approval; rejecting needs a note', async () => {
    route({ '/expenses?': wrap({ expenses: [expense], totalsByCategoryMinor: {} }), '/expenses/e1': wrap({ expense }) });
    post.mockResolvedValue({});
    render(<ExpensesTab {...props} />);
    fireEvent.click((await screen.findAllByText('EXP-000007'))[0]);
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByRole('button', { name: 'Reject' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/expenses/e1/decision', { decision: 'approve', note: undefined }));
  });

  it('view-only staff cannot record or change expenses', async () => {
    perms = { 'accounting.view': true };
    route({ '/expenses?': wrap({ expenses: [expense], totalsByCategoryMinor: {} }), '/expenses/e1': wrap({ expense }) });
    render(<ExpensesTab {...props} />);
    fireEvent.click((await screen.findAllByText('EXP-000007'))[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'View receipt' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Record expense' })).toBeNull();
  });
});

describe('Cash book tab', () => {
  it('shows cash and bank balances and the till daybook for the day', async () => {
    route({ '/daybook': wrap({ shifts: [{ sessionId: 'ss1', registerName: 'Front till', employeeName: 'Sana', status: 'closed', openedAt: '2026-11-20T09:00:00Z', closedAt: '2026-11-20T18:00:00Z', expectedCashMinor: 1200000, countedMinor: 1199500, varianceMinor: -500, reconciled: true, unreconciledMinor: 0, lines: [{ at: '2026-11-20T09:00:00Z', type: 'opening', label: 'Opening float', amountMinor: 500000, runningMinor: 500000, employeeName: null }] }] }) });
    render(<CashBookTab {...props} />);
    expect(screen.getByText(fmt(900000, 2))).toBeTruthy();
    expect(await screen.findByText('Front till')).toBeTruthy();
    expect(screen.getByText(`Short ${fmt(500, 2)}`)).toBeTruthy();
    fireEvent.click(screen.getByText('1100 · Bank'));
    expect(props.openLedger).toHaveBeenCalled();
  });
});

describe('Suppliers tab', () => {
  it('shows what is owed and its age', async () => {
    route({ '/payables': wrap({ suppliers: [{ supplierId: 'sp1', supplierName: 'Karachi Traders', balanceMinor: 800000, currentMinor: 300000, d30Minor: 0, d60Minor: 0, d90Minor: 500000 }], totals: { balanceMinor: 800000, currentMinor: 300000, d30Minor: 0, d60Minor: 0, d90Minor: 500000 } }) });
    render(<SuppliersTab {...props} />);
    expect((await screen.findAllByText('Karachi Traders')).length).toBeGreaterThan(0);
    expect(screen.getByText(/60 days old or more/)).toBeTruthy();
  });
});

describe('Profit & tax tab', () => {
  it('shows the POS profit figures and net sales tax', async () => {
    route({
      '/reports/profit': wrap({ totals: { netSalesMinor: 1000000, costOfGoodsSoldMinor: 600000, grossMarginMinor: 400000, marginPercent: 40, costCoveragePercent: 90, expensesMinor: 100000, expensesByCategoryMinor: { rent: 100000 }, afterExpensesMinor: 300000, supplierPaymentsMinor: 50000 } }),
      '/reports/tax': wrap({ rows: [{ taxCategory: 'standard', hsCode: null, salesNetMinor: 1000000, salesTaxMinor: 180000, returnsNetMinor: 0, returnsTaxMinor: 0, netMinor: 1000000, taxMinor: 180000 }], totals: { salesTaxMinor: 180000, returnsTaxMinor: 0, netTaxMinor: 180000, invoices: 12, creditNotes: 0 } }),
    });
    render(<ProfitTaxTab {...props} />);
    expect(await screen.findByText('Gross margin')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText(/Cost prices are known for 90%/)).toBeTruthy();
    expect(await screen.findByText(/from 12 invoice/)).toBeTruthy();
  });
});
