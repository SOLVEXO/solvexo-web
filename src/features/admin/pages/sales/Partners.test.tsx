import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiPartners: vi.fn(), apiCommissionPlans: vi.fn(), apiSaveCommissionPlan: vi.fn(), apiPartner: vi.fn(), apiSavePartner: vi.fn(),
  apiPartnerLogins: vi.fn(), apiPartnerStatement: vi.fn(), apiRecordPayout: vi.fn(), apiAddReferral: vi.fn(), apiRemoveReferral: vi.fn(),
  apiAddAdjustment: vi.fn(), apiRunCommissions: vi.fn(), apiMyPartner: vi.fn(), apiMyStatement: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
const perm = vi.hoisted(() => ({ granted: new Set(['sales.manage', 'finance.payouts']) }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string | string[]) => (Array.isArray(p) ? p : [p]).some(x => perm.granted.has(x)) }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({ AdminPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));

import { PartnersTab } from './PartnersTab';
import { MyEarnings } from './MyEarnings';

afterEach(() => { cleanup(); vi.clearAllMocks(); perm.granted = new Set(['sales.manage', 'finance.payouts']); });

const plan = { _id: 'p1', name: 'Reseller', description: null, bountyPKR: 5000, percent: 20, percentMonths: 12, tiers: [], holdDays: 14, minPayoutPKR: 0, isArchived: false, partners: 1 };
const partner = { _id: 'k1', name: 'Kamran Agencies', kind: 'reseller', code: 'KAMRAN1', adminId: null, email: null, phone: '0300 1234567', city: 'Lahore', planId: 'p1', payoutMethod: 'jazzcash', payoutDetails: '0300 1234567 (Kamran)', status: 'active', notes: null, createdAt: '2026-10-01T00:00:00Z' };
const detail = {
  partner, link: 'https://solvexo.store/?partner=KAMRAN1', plan,
  balances: { pendingPKR: 560, payablePKR: 5560, paidPKR: 0, earnedPKR: 6120 },
  referrals: [{ sellerId: 's1', merchant: 'Sara Boutique', source: 'code', effectiveFrom: '2026-09-01T00:00:00Z', payingNow: true, earnedPKR: 6120 }],
  lines: [], payouts: [],
};
const statement = { month: '2026-11', openingPKR: 5000, earnedPKR: 1120, paidPKR: 0, closingPKR: 6120, lines: [{ _id: 'c1', earnedAt: '2026-11-01T00:00:00Z', payableAt: '', type: 'percent', description: '20% of invoice PP-2', merchant: 'Sara Boutique', amountPKR: 560, status: 'pending' }], payouts: [] };

describe('PartnersTab', () => {
  it('creates a plan with a plain-language preview', async () => {
    api.apiPartners.mockResolvedValue({ data: [] });
    api.apiCommissionPlans.mockResolvedValue({ data: [] });
    api.apiSaveCommissionPlan.mockResolvedValue({ data: [plan] });
    render(<MemoryRouter><PartnersTab /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: /New partner/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /New plan/ }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Reseller' } });
    fireEvent.change(screen.getByLabelText('One-time amount per new paying merchant (PKR)'), { target: { value: '5,000' } });
    fireEvent.change(screen.getByLabelText('Share of what they pay Solvexo (%)'), { target: { value: '20' } });
    expect(screen.getByText(/PKR 5,000 per new paying merchant · 20% of what they pay for 12 months/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }));
    await waitFor(() => expect(api.apiSaveCommissionPlan).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Reseller', bountyPKR: 5000, percent: 20, percentMonths: 12, holdDays: 14 })));
  });

  it('opens a partner with its link, merchants, statement and records a payout', async () => {
    api.apiPartners.mockResolvedValue({ data: [{ ...partner, planName: 'Reseller', referred: 1, payingNow: 1, pendingPKR: 560, payablePKR: 5560, paidPKR: 0 }] });
    api.apiCommissionPlans.mockResolvedValue({ data: [plan] });
    api.apiPartner.mockResolvedValue({ data: detail });
    api.apiPartnerStatement.mockResolvedValue({ data: statement });
    api.apiRecordPayout.mockResolvedValue({ data: { ...detail, balances: { ...detail.balances, payablePKR: 0, paidPKR: 5560 } } });
    render(<MemoryRouter><PartnersTab /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Kamran Agencies'));
    expect(await screen.findByText(detail.link)).toBeInTheDocument();
    expect(screen.getByText('Sara Boutique')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Statement' }));
    expect(await screen.findByText('20% of invoice PP-2')).toBeInTheDocument();
    expect(within(screen.getByText('Owed at end').closest('div')!).getByText('PKR 6,120')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Payouts/ }));
    expect(screen.getByText('Pay PKR 5,560')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Transaction ref'), { target: { value: 'JC-7781' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record payout' }));
    await waitFor(() => expect(api.apiRecordPayout).toHaveBeenCalledWith('k1', expect.objectContaining({ method: 'jazzcash', reference: 'JC-7781' })));
  });

  it('hides the payout form without the payouts permission', async () => {
    perm.granted = new Set(['sales.manage']);
    api.apiPartners.mockResolvedValue({ data: [{ ...partner, planName: 'Reseller', referred: 1, payingNow: 1, pendingPKR: 0, payablePKR: 5560, paidPKR: 0 }] });
    api.apiCommissionPlans.mockResolvedValue({ data: [plan] });
    api.apiPartner.mockResolvedValue({ data: detail });
    render(<MemoryRouter><PartnersTab /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Kamran Agencies'));
    fireEvent.click(await screen.findByRole('tab', { name: /Payouts/ }));
    expect(screen.queryByRole('button', { name: 'Record payout' })).not.toBeInTheDocument();
    expect(screen.getByText(/needs the Payouts permission/)).toBeInTheDocument();
  });
});

describe('MyEarnings', () => {
  it('shows a partner their link, merchants and statement', async () => {
    perm.granted = new Set(['partner.portal']);
    api.apiMyPartner.mockResolvedValue({ data: { ...detail, statement } });
    render(<MemoryRouter><MyEarnings /></MemoryRouter>);
    expect(await screen.findByText(detail.link)).toBeInTheDocument();
    expect(screen.getAllByText('Sara Boutique')).toHaveLength(2); // merchant list + statement line
    expect(screen.getByText('20% of invoice PP-2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('explains what to do when the login is not a partner', async () => {
    perm.granted = new Set(['sales.access']);
    api.apiMyPartner.mockResolvedValue({ data: null });
    render(<MemoryRouter><MyEarnings /></MemoryRouter>);
    expect(await screen.findByText('You are not set up as a partner yet')).toBeInTheDocument();
    expect(screen.getByText(/Ask your Solvexo manager/)).toBeInTheDocument();
  });
});
