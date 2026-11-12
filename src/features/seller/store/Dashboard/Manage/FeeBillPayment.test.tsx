import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FeeBillPayment } from './FeeBillPayment';
import type { FeePayTo, TransactionFeeBill } from '@/api/services/platformPlans';

const report = vi.fn();
vi.mock('@/api/services/platformPlans', async (orig) => ({ ...(await orig<object>()), apiReportFeeBillPaid: (...a: unknown[]) => report(...a) }));

const bill = (over: Partial<TransactionFeeBill> = {}): TransactionFeeBill => ({
  _id: 'b1', periodKey: '2026-10', amountUSD: 20, taxAmountUSD: 3.6, saleCount: 4, status: 'awaiting_payment',
  hostedInvoiceUrl: null, createdAt: '2026-11-01T00:00:00Z', breakdown: [], dueAt: '2026-11-15T00:00:00Z', ...over,
});
const payTo: FeePayTo = { bankName: 'Meezan Bank', accountTitle: 'Solvexo Pvt Ltd', accountNumber: '0123456', iban: 'PK00MEZN0001', jazzcashNumber: null, easypaisaNumber: null, instructions: 'Use your store name as the reference.' };

afterEach(cleanup);
beforeEach(() => { report.mockReset(); report.mockResolvedValue({ success: true, data: { alreadyReported: false, reportedAt: '' } }); });

describe('FeeBillPayment', () => {
  it('shows the total with tax and where to send it', () => {
    render(<FeeBillPayment storeId="s1" bill={bill()} payTo={payTo} onReported={() => undefined} />);
    expect(screen.getByText(/send \$23\.60/i)).toBeTruthy();
    expect(screen.getByText('Meezan Bank')).toBeTruthy();
    expect(screen.getByText('PK00MEZN0001')).toBeTruthy();
    expect(screen.getByText('Use your store name as the reference.')).toBeTruthy();
    expect(screen.queryByText('JazzCash')).toBeNull(); // empty lines are hidden
  });

  it('without payment details it tells the seller to ask through Help', () => {
    render(<FeeBillPayment storeId="s1" bill={bill()} payTo={null} onReported={() => undefined} />);
    expect(screen.getByText(/ask us through help/i)).toBeTruthy();
  });

  it('"I have paid" sends the note once and refreshes the list', async () => {
    const onReported = vi.fn();
    render(<FeeBillPayment storeId="s1" bill={bill()} payTo={payTo} onReported={onReported} />);
    fireEvent.click(screen.getByRole('button', { name: /i have paid/i }));
    fireEvent.change(await screen.findByLabelText(/transfer reference/i), { target: { value: ' Ref 77 ' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() => expect(onReported).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith('s1', 'b1', 'Ref 77');
  });

  it('shows the error and does not refresh when sending fails', async () => {
    report.mockRejectedValueOnce(new Error('This bill is not waiting for a payment.'));
    const onReported = vi.fn();
    render(<FeeBillPayment storeId="s1" bill={bill()} payTo={payTo} onReported={onReported} />);
    fireEvent.click(screen.getByRole('button', { name: /i have paid/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^send$/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onReported).not.toHaveBeenCalled();
  });

  it('after the seller has reported, the button is replaced by a note', () => {
    render(<FeeBillPayment storeId="s1" bill={bill({ sellerReportedPaidAt: '2026-11-05T00:00:00Z' })} payTo={payTo} onReported={() => undefined} />);
    expect(screen.queryByRole('button', { name: /i have paid/i })).toBeNull();
    expect(screen.getByText(/we will mark this bill paid/i)).toBeTruthy();
  });
});
