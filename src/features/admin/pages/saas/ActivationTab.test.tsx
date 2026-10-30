import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ActivationFunnel } from '@/api/services/analytics/saasMetrics';

const api = vi.hoisted(() => ({ apiGetActivationFunnel: vi.fn() }));
vi.mock('@/api/services/analytics/saasMetrics', () => api);

import { ActivationTab } from './ActivationTab';

const fixture: ActivationFunnel = {
  from: '2026-05-01T00:00:00Z', months: 6,
  steps: [
    { step: 'signed_up', label: 'Signed up', merchants: 100, percentOfSignups: 100, percentOfPrevious: null, medianDaysFromSignup: null },
    { step: 'verified', label: 'Verified email', merchants: 90, percentOfSignups: 90, percentOfPrevious: 90, medianDaysFromSignup: null },
    { step: 'store', label: 'Created a store', merchants: 80, percentOfSignups: 80, percentOfPrevious: 88.9, medianDaysFromSignup: 1 },
    { step: 'product', label: 'Added a product', merchants: 40, percentOfSignups: 40, percentOfPrevious: 50, medianDaysFromSignup: 6 },
    { step: 'sale', label: 'First sale', merchants: 30, percentOfSignups: 30, percentOfPrevious: 75, medianDaysFromSignup: 20 },
    { step: 'paying', label: 'Paying plan', merchants: 24, percentOfSignups: 24, percentOfPrevious: 80, medianDaysFromSignup: 15 },
  ],
  byCohort: [{ month: '2026-10', signups: 20, percent: { signed_up: 100, verified: 90, store: 80, product: 35, sale: 20, paying: 10 } }],
  bySource: [{ source: 'google', signups: 50, storePercent: 84, salePercent: 36, payingPercent: 28 }],
  stuck: [
    { sellerId: 'se1', name: 'Hamza Mart', email: 'h@x.pk', stuckAt: 'store', nextStep: 'product', daysStuck: 12, signedUpDaysAgo: 14 },
    { sellerId: 'se2', name: 'Sana Store', email: 's@x.pk', stuckAt: 'sale', nextStep: 'paying', daysStuck: 5, signedUpDaysAgo: 30 },
  ],
};
const renderTab = () => render(
  <MemoryRouter initialEntries={['/admin/saas-metrics']}>
    <Routes>
      <Route path="/admin/saas-metrics" element={<ActivationTab />} />
      <Route path="/admin/clients/:id" element={<p>client workspace</p>} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('ActivationTab', () => {
  it('shows each step, the conversion between steps, and names the biggest drop', async () => {
    api.apiGetActivationFunnel.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    expect(await screen.findByText(/Biggest drop:/)).toHaveTextContent('Biggest drop: Created a store → Added a product. Only 50% continue.');
    expect(screen.getByText('88.9% continue')).toBeInTheDocument();
    expect(api.apiGetActivationFunnel).toHaveBeenCalledWith(6);
  });

  it('lists stuck merchants with their next step, filters them in funnel order, and opens the client', async () => {
    api.apiGetActivationFunnel.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    const group = await screen.findByRole('group', { name: 'Stuck at' });
    expect(within(group).getAllByRole('button').map(b => b.textContent)).toEqual(['All', 'Add a first product', 'Choose a plan']);
    fireEvent.click(within(group).getByRole('button', { name: 'Choose a plan' }));
    expect(screen.queryByText('Hamza Mart')).toBeNull();
    fireEvent.click(screen.getByText('Sana Store'));
    expect(await screen.findByText('client workspace')).toBeInTheDocument();
  });

  it('changes the sign-up period', async () => {
    api.apiGetActivationFunnel.mockResolvedValue({ success: true, data: fixture });
    renderTab();
    await screen.findByText(/Biggest drop/);
    fireEvent.change(screen.getByLabelText('Sign-up period'), { target: { value: '12' } });
    await waitFor(() => expect(api.apiGetActivationFunnel).toHaveBeenLastCalledWith(12));
  });
});

describe('ActivationTab — long stuck list', () => {
  it('shows 10 merchants, then all on request', async () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ sellerId: `s${i}`, name: `Merchant ${i}`, email: `m${i}@x.pk`, stuckAt: 'store' as const, nextStep: 'product' as const, daysStuck: 20 - i, signedUpDaysAgo: 25 }));
    api.apiGetActivationFunnel.mockResolvedValue({ success: true, data: { ...fixture, stuck: many } });
    renderTab();
    await screen.findByText('Merchant 0');
    expect(screen.queryByText('Merchant 10')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show all 13' }));
    expect(screen.getByText('Merchant 12')).toBeInTheDocument();
  });
});
