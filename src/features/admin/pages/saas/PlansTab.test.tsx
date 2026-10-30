import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PlanInsightRow, PlanInsights } from '@/api/services/analytics/saasMetrics';

const api = vi.hoisted(() => ({ apiGetPlanInsights: vi.fn() }));
vi.mock('@/api/services/analytics/saasMetrics', () => api);

import { PlansTab } from './PlansTab';

const plan = (o: Partial<PlanInsightRow>): PlanInsightRow => ({
  planId: 'p', name: 'Plan', status: 'active', isFree: false, isPublic: true, isCustomPricing: false, monthlyPriceUSD: null, yearlyPriceUSD: null,
  yearlyDiscountPercent: null, transactionFeePercent: null, maxProducts: null, stores: 0, payingStores: 0, yearlyStores: 0, pastDueStores: 0,
  mrr: 0, mrrSharePercent: null, arpu: null, belowListStores: 0, belowListGapMrr: 0, cancelingStores: 0, cancelingMrr: 0,
  scheduledDowngrades: 0, scheduledDowngradeMrr: 0, newStores: 0, upgradesIn: 0, downgradesIn: 0, upgradesOut: 0, downgradesOut: 0,
  payingAtStart: 0, stoppedPaying: 0, stoppedPayingPercent: null, ...o,
});
const fixture: PlanInsights = {
  months: 12, from: '2025-11-01T00:00:00Z',
  summary: {
    mrr: 192.83, payingStores: 4, trialingStores: 1, freePlanStores: 1, yearlySharePercent: 25, newStores: 3, newMrr: 87,
    upgrades: 2, upgradeMrr: 100, downgrades: 1, downgradeMrr: 50, upgradeToDowngradeRatio: 2, intervalSwitches: 1, switchedToYearly: 1,
    belowListStores: 1, belowListGapMrr: 10, cancelingStores: 1, cancelingMrr: 19, scheduledDowngrades: 1, scheduledDowngradeMrr: 36.83,
    outgrowingStores: 2, upgradeOpportunityMrr: 89,
  },
  plans: [
    plan({ planId: 'basic', name: 'Basic', monthlyPriceUSD: 29, yearlyPriceUSD: 290, yearlyDiscountPercent: 16.67, stores: 2, payingStores: 2, mrr: 48, mrrSharePercent: 24.9, arpu: 24,
      belowListStores: 1, belowListGapMrr: 10, newStores: 3, upgradesOut: 2, downgradesIn: 1, payingAtStart: 2, stoppedPaying: 1, stoppedPayingPercent: 50, transactionFeePercent: 2 }),
    plan({ planId: 'free', name: 'Free', isFree: true, stores: 7 }),
  ],
  moves: [{ fromPlanId: 'basic', fromName: 'Basic', toPlanId: 'pro', toName: 'Pro', kind: 'upgrade', moves: 2, mrrChange: 100 }],
  monthly: [
    { month: '2026-09', new: 1, upgrades: 2, downgrades: 0, newMrr: 29, upgradeMrr: 100, downgradeMrr: 0 },
    { month: '2026-10', new: 2, upgrades: 0, downgrades: 1, newMrr: 58, upgradeMrr: 0, downgradeMrr: 50 },
  ],
  candidates: [
    { storeId: 's1', storeName: 'Hamza Mart', sellerId: 'se1', planId: 'basic', planName: 'Basic', products: 90, maxProducts: 100, usagePercent: 90,
      suggestedPlanId: 'pro', suggestedPlanName: 'Pro', mrrIfUpgraded: 79, currentMrr: 19 },
    { storeId: 's2', storeName: 'Ghost Store', sellerId: null, planId: 'free', planName: 'Free', products: 10, maxProducts: 10, usagePercent: 100,
      suggestedPlanId: null, suggestedPlanName: null, mrrIfUpgraded: null, currentMrr: 0 },
  ],
};
const renderTab = () => render(
  <MemoryRouter initialEntries={['/admin/saas-metrics']}>
    <Routes>
      <Route path="/admin/saas-metrics" element={<PlansTab />} />
      <Route path="/admin/clients/:id" element={<p>client workspace</p>} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('PlansTab', () => {
  it('shows the headline numbers and a row per plan', async () => {
    api.apiGetPlanInsights.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    expect(await screen.findByText('2 / 1')).toBeInTheDocument();
    expect(screen.getByText('2.0 up per down')).toBeInTheDocument();
    expect(screen.getByText('$56')).toBeInTheDocument(); // MRR at risk: 19 + 36.83
    expect(screen.getByText('+$89/mo')).toBeInTheDocument();
    const table = screen.getByRole('heading', { name: 'Plans' }).closest('section')!;
    const basic = within(table).getByText('Basic').closest('tr')!;
    expect(within(basic).getByText('$290/yr (−17%)')).toBeInTheDocument();
    expect(within(basic).getByText('1 of 2')).toBeInTheDocument();
    expect(within(basic).getByText('−$10.00/mo')).toBeInTheDocument();
    const free = within(table).getByText('7 on it').closest('tr')!;
    expect(within(free).getAllByText('Free')).toHaveLength(2); // the name and its tag
  });

  it('switches plan changes to a table and opens an outgrowing store in Clients', async () => {
    api.apiGetPlanInsights.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: 'Table' }));
    const oct = screen.getByText('Oct 26').closest('tr')!;
    expect(within(oct).getByText('+$8.00')).toBeInTheDocument(); // 58 − 50
    expect(screen.getByRole('button', { name: /Ghost Store/ })).toBeDisabled();
    expect(screen.getByText('No bigger plan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hamza Mart/ }));
    expect(await screen.findByText('client workspace')).toBeInTheDocument();
  });

  it('reloads with the chosen range', async () => {
    api.apiGetPlanInsights.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    await screen.findByText('2 / 1');
    fireEvent.change(screen.getByLabelText('Months shown'), { target: { value: '6' } });
    await waitFor(() => expect(api.apiGetPlanInsights).toHaveBeenLastCalledWith(6));
  });
});
