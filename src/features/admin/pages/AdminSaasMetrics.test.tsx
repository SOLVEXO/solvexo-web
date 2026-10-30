import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { SaasMetrics, SaasMonth } from '@/api/services/analytics/saasMetrics';

const api = vi.hoisted(() => ({ apiGetSaasMetrics: vi.fn(), apiExportSaasMetrics: vi.fn() }));
vi.mock('@/api/services/analytics/saasMetrics', () => api);
// The real header carries the notification bell (needs app providers); the page only passes it title + actions.
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({
  AdminPageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <header><h1>{title}</h1>{actions}</header>,
}));

import { AdminSaasMetrics } from './AdminSaasMetrics';

const month = (m: string, o: Partial<SaasMonth>): SaasMonth => ({
  month: m, source: 'reconstructed', mrr: 0, arr: 0, payingStores: 0, arpu: 0, startMrr: 0, endMrr: 0, startStores: 0, endStores: 0,
  newMrr: 0, expansionMrr: 0, contractionMrr: 0, churnedMrr: 0, reactivationMrr: 0, netNewMrr: 0,
  newStores: 0, churnedStores: 0, reactivatedStores: 0, expandedStores: 0, contractedStores: 0,
  nrrPercent: null, grrPercent: null, logoChurnPercent: null, revenueChurnPercent: null, quickRatio: null, ...o,
});
const fixture: SaasMetrics = {
  asOf: '2026-10-29T12:00:00Z', months: 12,
  current: {
    mrr: 1200, arr: 14400, payingStores: 20, arpu: 60, netNewMrrThisMonth: 150,
    nrrPercentTrailing12: null, nrrPercentThisMonth: 101.5, grrPercentThisMonth: 97, logoChurnPercentThisMonth: 5, revenueChurnPercentThisMonth: 3,
    quickRatioThisMonth: 2.5, avgMonthlyLogoChurnPercent: 4, ltv: 1500, expectedLifetimeMonths: 25,
  },
  periodTotals: { newMrr: 1300, expansionMrr: 50, reactivationMrr: 0, contractionMrr: 0, churnedMrr: 150 },
  monthly: [month('2026-09', { mrr: 1050, payingStores: 18 }), month('2026-10', { source: 'live', mrr: 1200, payingStores: 20, churnedMrr: 30, newMrr: 180, netNewMrr: 150 })],
  byPlan: [{ planId: 'pro', planName: 'Pro', stores: 20, mrr: 1200 }],
  cohorts: [{ cohort: '2026-09', stores: 4, startMrr: 200, retention: [{ month: 0, storesPercent: 100, revenuePercent: 100 }, { month: 1, storesPercent: 75, revenuePercent: 110 }] }],
  trials: [{ month: '2026-10', started: 10, converted: 4, stillTrialing: 2, conversionPercent: 50, avgDaysToConvert: 6 }],
  dataQuality: { firstDailySnapshot: null, reconstructedMonths: ['2026-09'] },
};

const renderPage = () => render(<MemoryRouter><AdminSaasMetrics /></MemoryRouter>);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('AdminSaasMetrics', () => {
  it('shows the headline numbers, falling back to this month\'s NRR when there is no 12-month history', async () => {
    api.apiGetSaasMetrics.mockResolvedValue({ success: true, data: fixture });
    renderPage();
    expect(await screen.findByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText('ARR $14,400')).toBeInTheDocument();
    expect(screen.getByText('101.5%')).toBeInTheDocument();
    expect(screen.getByText('This month, existing stores')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText(/Months marked "est\." \(Sep 26\)/)).toBeInTheDocument();
    expect(api.apiGetSaasMetrics).toHaveBeenCalledWith(12);
  });

  it('monthly table shows losses with a minus sign and zero losses as $0.00', async () => {
    api.apiGetSaasMetrics.mockResolvedValue({ success: true, data: fixture });
    renderPage();
    const table = (await screen.findByText('Monthly detail')).closest('section')!;
    const oct = within(table).getByText('Oct 26').closest('tr')!;
    expect(oct).toHaveTextContent('−$30.00');
    expect(oct).not.toHaveTextContent('-$0.00');
    expect(within(table).getByText('est.')).toBeInTheDocument();
  });

  it('cohorts switch between stores and revenue retention; range and CSV use the chosen months', async () => {
    api.apiGetSaasMetrics.mockResolvedValue({ success: true, data: fixture });
    api.apiExportSaasMetrics.mockResolvedValue(undefined);
    renderPage();
    expect(await screen.findByText('75%')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('group', { name: 'Retention measure' })).getByRole('button', { name: 'Revenue' }));
    expect(screen.getByText('110%')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Months shown'), { target: { value: '24' } });
    await waitFor(() => expect(api.apiGetSaasMetrics).toHaveBeenLastCalledWith(24));
    fireEvent.click(await screen.findByRole('button', { name: /CSV/ }));
    await waitFor(() => expect(api.apiExportSaasMetrics).toHaveBeenCalledWith(24));
  });

  it('shows a retry state when loading fails', async () => {
    api.apiGetSaasMetrics.mockRejectedValue(new Error('Your admin role doesn\'t have permission to do this'));
    renderPage();
    expect(await screen.findByText(/doesn't have permission/)).toBeInTheDocument();
  });
});
