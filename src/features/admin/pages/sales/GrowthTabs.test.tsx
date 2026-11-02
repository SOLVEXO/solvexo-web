import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiListCampaigns: vi.fn(), apiGetCampaign: vi.fn(), apiSaveCampaign: vi.fn(), apiAddSpend: vi.fn(), apiRemoveSpend: vi.fn(),
  apiSalesTeam: vi.fn(), apiSaveTargets: vi.fn(), apiSalesSettings: vi.fn(), apiSaveSalesSettings: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { CampaignsTab } from './CampaignsTab';
import { TeamTab } from './TeamTab';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const result = {
  id: 'c1', code: 'eid-sale', name: 'Eid sale', channel: 'facebook', isArchived: false, startDate: null, endDate: null, budgetPKR: 100000,
  spendPKR: 60000, leads: 12, wonLeads: 2, signups: 6, trials: 4, paying: 3, payingNow: 3, mrrUSD: 30, mrrPKR: 8400,
  costPerLeadPKR: 5000, costPerSignupPKR: 10000, costPerPayingPKR: 20000, paybackMonths: 7.1,
  link: 'https://solvexo.store/book-demo?utm_source=facebook&utm_medium=paid_social&utm_campaign=eid-sale',
};
const detail = { ...result, utmSource: 'facebook', utmMedium: 'paid_social', landingPath: '/book-demo', notes: null, spend: [{ _id: 's1', date: '2026-11-01T00:00:00Z', amountPKR: 60000, note: 'Boost' }], recentLeads: [] };

describe('CampaignsTab', () => {
  it('shows what each campaign cost and brought in, and offers to track unknown codes', async () => {
    api.apiListCampaigns.mockResolvedValue({ data: { campaigns: [result], totals: { spendPKR: 60000, leads: 12, signups: 6, paying: 3, mrrUSD: 30, costPerPayingPKR: 20000 }, untracked: [{ code: 'summer', leads: 2, signups: 1 }], pkrPerUSD: 280 } });
    api.apiSaveCampaign.mockResolvedValue({ data: { ...detail, id: 'c2', code: 'summer', name: 'Summer' } });
    api.apiGetCampaign.mockResolvedValue({ data: detail });
    render(<MemoryRouter><CampaignsTab /></MemoryRouter>);
    const row = (await screen.findByText('Eid sale')).closest('tr')!;
    expect(within(row).getByText('PKR 20,000')).toBeInTheDocument();
    expect(within(row).getByText('PKR 8,400')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /summer/ }));
    expect(screen.getByLabelText('Link code')).toHaveValue('summer');
    expect(screen.getByLabelText('Name')).toHaveValue('Summer');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiSaveCampaign).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Summer', code: 'summer', channel: 'facebook', landingPath: '/book-demo' })));
  });

  it('opens a campaign with its link and logs spend', async () => {
    api.apiListCampaigns.mockResolvedValue({ data: { campaigns: [result], totals: { spendPKR: 60000, leads: 12, signups: 6, paying: 3, mrrUSD: 30, costPerPayingPKR: 20000 }, untracked: [], pkrPerUSD: 280 } });
    api.apiGetCampaign.mockResolvedValue({ data: detail });
    api.apiAddSpend.mockResolvedValue({ data: { ...detail, spendPKR: 75000 } });
    render(<MemoryRouter><CampaignsTab /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Eid sale'));
    expect(await screen.findByText(result.link)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Amount (PKR)'), { target: { value: '15,000' } });
    fireEvent.change(screen.getByLabelText('Spend note'), { target: { value: 'Second boost' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/ }));
    await waitFor(() => expect(api.apiAddSpend).toHaveBeenCalledWith('c1', expect.objectContaining({ amountPKR: 15000, note: 'Second boost' })));
  });
});

describe('TeamTab', () => {
  const rep = (name: string, over: Record<string, unknown> = {}) => ({
    adminId: name, name, newLeads: 3, activities: 20, demos: 2, won: 1, wonValuePKR: 60000, lost: 1, winRate: 50, openLeads: 4, openValuePKR: 120000, overdue: 1,
    target: null, progress: { wonDeals: null, wonValuePKR: null, activities: null }, ...over,
  });

  it('shows the leaderboard with progress, and lets a manager set targets and share out leads', async () => {
    api.apiSalesTeam.mockResolvedValue({ data: { month: '2026-11', reps: [rep('Bilal', { target: { adminId: 'Bilal', wonDeals: 4, wonValuePKR: null, activities: null }, progress: { wonDeals: 25, wonValuePKR: null, activities: null } }), rep('Sana', { won: 0, wonValuePKR: 0 })], unassignedOpen: 2 } });
    api.apiSaveTargets.mockResolvedValue({ data: { month: '2026-11', reps: [], unassignedOpen: 0 } });
    api.apiSalesSettings.mockResolvedValue({ data: { autoAssign: false, assigneeIds: [] } });
    api.apiSaveSalesSettings.mockImplementation(async (s: unknown) => ({ data: s }));
    render(<TeamTab isManager owners={[{ _id: 'Bilal', name: 'Bilal', email: '' }, { _id: 'Sana', name: 'Sana', email: '' }]} />);
    expect(await screen.findByRole('cell', { name: 'Bilal' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '25% of target' })).toBeInTheDocument();
    expect(screen.getByText(/2 open leads have no owner/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Set targets/ }));
    fireEvent.change(screen.getByLabelText('Value won target for Sana'), { target: { value: '100,000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save targets' }));
    await waitFor(() => expect(api.apiSaveTargets).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}$/), [
      { adminId: 'Bilal', wonDeals: 4, wonValuePKR: null, activities: null },
      { adminId: 'Sana', wonDeals: null, wonValuePKR: 100000, activities: null },
    ]));

    const sw = await screen.findByRole('switch', { name: 'Share out new leads automatically' });
    expect(sw).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sana' }));
    await waitFor(() => expect(api.apiSaveSalesSettings).toHaveBeenCalledWith({ autoAssign: false, assigneeIds: ['Sana'] }));
    await waitFor(() => expect(sw).not.toBeDisabled());
    fireEvent.click(sw);
    await waitFor(() => expect(api.apiSaveSalesSettings).toHaveBeenLastCalledWith({ autoAssign: true, assigneeIds: ['Sana'] }));
  });

  it('shows a rep the leaderboard without manager controls', async () => {
    api.apiSalesTeam.mockResolvedValue({ data: { month: '2026-11', reps: [rep('Bilal')], unassignedOpen: 3 } });
    render(<TeamTab isManager={false} owners={[]} />);
    expect(await screen.findByText('Bilal')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Set targets/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/no owner/)).not.toBeInTheDocument();
    expect(api.apiSalesSettings).not.toHaveBeenCalled();
  });
});
