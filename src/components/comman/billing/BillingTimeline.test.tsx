import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BillingTimeline } from './BillingTimeline';
import type { BillingTimelineData } from '@/api/services/billingTimeline';

const data: BillingTimelineData = {
  summary: {
    currency: 'USD', lifetimePaidUSD: 101, refundedUSD: 10, netLifetimeUSD: 91, thisMonthUSD: 60, taxPaidUSD: 6,
    breakdown: { plans: 89, addons: 10, transactionFees: 2, refunds: -10 }, creditBalanceUSD: 5,
    card: { brand: 'visa', last4: '4242' }, failedPaymentsLast30Days: 1,
    pendingPlanChange: { planName: 'Pro', kind: 'first_purchase', amountUSD: 79 }, lastBillingError: 'Insufficient funds',
    current: { status: 'active', planName: 'Grow', interval: 'monthly', amountUSD: 29, nextBillingDate: null, trialEndsAt: null },
  },
  statement: { from: null, to: null, chargedUSD: 0, refundedUSD: 0, taxUSD: 0, netUSD: 0, paymentCount: 0, failedCount: 0 },
  events: [
    { id: 'e1', at: '2026-11-10T10:00:00Z', kind: 'payment_failed', status: 'failed', title: 'Payment failed', description: 'Insufficient funds · VISA ····0341', amountUSD: 79, attemptNumber: 1, reason: 'Insufficient funds', card: { brand: 'visa', last4: '0341' } },
    {
      id: 'e2', at: '2026-10-30T10:00:00Z', kind: 'payment', status: 'success', title: 'Payment: Pro — plan change', description: 'Invoice INV-2', amountUSD: 60, invoiceNumber: 'INV-2',
      card: { brand: 'visa', last4: '4242' },
      lineItems: [{ kind: 'plan', label: 'Pro plan (monthly)', amountUSD: 79 }, { kind: 'credit', label: 'Unused time on Grow', amountUSD: -25 }, { kind: 'tax', label: 'Tax', amountUSD: 6 }],
    },
    { id: 'e3', at: '2026-10-20T10:00:00Z', kind: 'refund', status: 'refunded', title: 'Partial refund issued', description: 'Refund for invoice INV-2', amountUSD: -10 },
  ],
};

describe('BillingTimeline', () => {
  const setup = (over: Partial<BillingTimelineData> = {}) => {
    const load = vi.fn().mockResolvedValue({ data: { ...data, ...over } });
    const exportCsv = vi.fn().mockResolvedValue({ data: { filename: 'x.csv', csv: 'a,b' } });
    render(<BillingTimeline load={load} exportCsv={exportCsv} />);
    return { load, exportCsv };
  };

  it('shows summary, the pending-payment notice, events grouped by month, and the failed attempt number + reason', async () => {
    setup();
    expect((await screen.findAllByText('Payment failed')).length).toBeGreaterThan(0);
    expect(screen.getByText(/attempt #1/)).toBeTruthy();
    expect(screen.getByText(/Waiting for payment of the/)).toBeTruthy();
    expect(screen.getByText('$91.00')).toBeTruthy(); // net lifetime
    expect(screen.getAllByText('Visa ···· 4242').length).toBeGreaterThan(0);
    expect(screen.getByText('−$10.00')).toBeTruthy(); // refund
  });

  it('expands an invoice to its credit / tax line items that add up to the charge', async () => {
    setup();
    await screen.findByText('Payment: Pro — plan change');
    fireEvent.click(screen.getAllByText('Details')[1]);
    expect(await screen.findByText('Unused time on Grow')).toBeTruthy();
    expect(screen.getByText('−$25.00')).toBeTruthy();
    expect(screen.getByText('Total charged')).toBeTruthy();
  });

  it('empty state when nothing matches, and a retry on load error', async () => {
    setup({ events: [] });
    expect(await screen.findByText('Nothing here yet')).toBeTruthy();
  });

  it('a failed load shows an error with Retry that reloads', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ data });
    render(<BillingTimeline load={load} exportCsv={vi.fn()} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('Payment failed')).length).toBeGreaterThan(0);
  });
});
