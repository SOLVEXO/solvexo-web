import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { StoreData } from '@/api/services/store';

const api = vi.hoisted(() => ({
  progress: vi.fn(), plan: vi.fn(), stripe: vi.fn(), integrations: vi.fn(), zones: vi.fn(),
}));
vi.mock('@/api/services/platformPlans', () => ({ apiGetOnboardingProgress: api.progress, apiGetStorePlatformPlan: api.plan }));
vi.mock('@/api/services/stripeConnect', () => ({ apiGetStripeConnectStatus: api.stripe }));
vi.mock('@/api/services/integrations', () => ({ apiListStoreIntegrations: api.integrations }));
vi.mock('@/api/services/shipping', () => ({ apiListStoreShippingZones: api.zones }));

import { SetupGuideCard } from './SetupGuideCard';

const setup = (integrations: unknown) => {
  api.progress.mockResolvedValue({ data: { hasPlatformPaymentMethod: false } });
  api.plan.mockResolvedValue({ data: { status: 'trialing', trialEndsAt: '2099-01-01' } });
  api.stripe.mockResolvedValue({ data: { chargesEnabled: false } });
  api.zones.mockResolvedValue({ data: [] });
  api.integrations.mockResolvedValue({ data: integrations });
  render(
    <MemoryRouter initialEntries={['/store/s1/dashboard']}>
      <Routes>
        <Route path="/store/s1/dashboard" element={<SetupGuideCard storeId="s1" totalProducts={0} store={{ customDomain: null } as unknown as StoreData} />} />
        <Route path="/store/s1/settings/domains" element={<p>domains tab</p>} />
      </Routes>
    </MemoryRouter>,
  );
};

afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

describe('SetupGuideCard', () => {
  it('counts a non-Stripe gateway switched on at checkout as payments set up', async () => {
    setup({ payment: [{ provider: 'safepay', status: 'connected', isEnabledForCheckout: true }], manualMethods: [] });
    expect(await screen.findByText('1 of 6 done')).toBeInTheDocument();
  });

  it('counts an active transfer method, but not a connected gateway left off at checkout', async () => {
    setup({ payment: [{ provider: 'safepay', status: 'connected', isEnabledForCheckout: false }], manualMethods: [{ id: 'm', isActive: true }] });
    expect(await screen.findByText('1 of 6 done')).toBeInTheDocument();
  });

  it('leaves payments open with nothing connected, and opens the Domains tab', async () => {
    setup({ payment: [], manualMethods: [] });
    expect(await screen.findByText('0 of 6 done')).toBeInTheDocument();
    expect(screen.getByText(/Cash on Delivery is already on/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Set up domain/ }));
    expect(await screen.findByText('domains tab')).toBeInTheDocument();
  });
});
