import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { RevenueModel, RevenueStream } from '@/api/services/analytics/saasMetrics';

const api = vi.hoisted(() => ({ apiGetRevenueModel: vi.fn() }));
vi.mock('@/api/services/analytics/saasMetrics', () => api);

import { RevenueModelTab } from './RevenueModelTab';

const streams = (o: Partial<Record<RevenueStream, number>>): Record<RevenueStream, number> =>
  ({ plans: 0, transactionFees: 0, commission: 0, addons: 0, posPlans: 0, promotions: 0, ...o });
const fixture: RevenueModel = {
  months: 12, from: '2025-11-01T00:00:00Z',
  summary: {
    totalRevenue: 1500, totalGmv: 50000, takeRatePercent: 3.05, transactionalTakeRatePercent: 1.2, subscriptionSharePercent: 60,
    thisMonthSoFar: 300, lastFullMonth: { month: '2026-09', revenue: 1200, takeRatePercent: 3 }, revenuePerPayingStore: 75, payingStores: 20,
  },
  monthly: [
    { month: '2026-09', streams: streams({ plans: 700, commission: 500 }), total: 1200, subscription: 700, transactional: 500, gmv: 40000, orders: 400, takeRatePercent: 3, transactionalTakeRatePercent: 1.25 },
    { month: '2026-10', streams: streams({ plans: 200, commission: 100 }), total: 300, subscription: 200, transactional: 100, gmv: 10000, orders: 90, takeRatePercent: 3, transactionalTakeRatePercent: 1 },
  ],
  streams: [
    { stream: 'plans', label: 'Plan fees', total: 900, sharePercent: 60, lastMonth: 700, previousMonth: 500, changePercent: 40 },
    { stream: 'commission', label: 'Sales commission', total: 600, sharePercent: 40, lastMonth: 500, previousMonth: 0, changePercent: null },
  ],
  concentration: {
    top10SharePercent: 80,
    top: [
      { storeId: 's1', storeName: 'Hamza Mart', sellerId: 'se1', amount: 800, sharePercent: 53.3 },
      { storeId: 's2', storeName: 'Ghost Store', sellerId: null, amount: 400, sharePercent: 26.7 },
    ],
  },
  notes: { excluded: ['Store-app build fees'], unconvertedCurrencies: ['XYZ'] },
};
const renderTab = () => render(
  <MemoryRouter initialEntries={['/admin/saas-metrics']}>
    <Routes>
      <Route path="/admin/saas-metrics" element={<RevenueModelTab />} />
      <Route path="/admin/clients/:id" element={<p>client workspace</p>} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('RevenueModelTab', () => {
  it('shows revenue, take rate and the streams table', async () => {
    api.apiGetRevenueModel.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    expect(await screen.findByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('3.05%')).toBeInTheDocument();
    expect(screen.getByText('1.2%')).toBeInTheDocument();
    expect(screen.getByText('20 stores paid Solvexo')).toBeInTheDocument();
    const table = screen.getByText('Streams').closest('section')!;
    const plans = within(table).getByText('Plan fees').closest('tr')!;
    expect(within(plans).getByText('+40%')).toBeInTheDocument();
    const commission = within(table).getByText('Sales commission').closest('tr')!;
    expect(within(commission).getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/XYZ have no exchange rate/)).toBeInTheDocument();
    expect(screen.getByText(/Store-app build fees/)).toBeInTheDocument();
  });

  it('opens a top store in Clients, and a store without a seller is not clickable', async () => {
    api.apiGetRevenueModel.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    const hamza = await screen.findByRole('button', { name: /Hamza Mart/ });
    expect(screen.getByRole('button', { name: /Ghost Store/ })).toBeDisabled();
    fireEvent.click(hamza);
    expect(await screen.findByText('client workspace')).toBeInTheDocument();
  });

  it('reloads with the chosen range and shows a retry state on failure', async () => {
    api.apiGetRevenueModel.mockResolvedValueOnce({ success: true, data: fixture }).mockRejectedValueOnce(new Error('boom'));
    renderTab();
    await screen.findByText('$1,500');
    fireEvent.change(screen.getByLabelText('Months shown'), { target: { value: '24' } });
    await waitFor(() => expect(api.apiGetRevenueModel).toHaveBeenLastCalledWith(24));
    expect(api.apiGetRevenueModel).toHaveBeenCalledWith(12);
  });
});
