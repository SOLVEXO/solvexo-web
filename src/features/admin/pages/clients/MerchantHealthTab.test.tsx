import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MerchantHealthData, MerchantHealthRow } from '@/api/services/admin/adminClients';

const api = vi.hoisted(() => ({ apiGetMerchantHealth: vi.fn(), apiExportMerchantHealth: vi.fn() }));
vi.mock('@/api/services/admin/adminClients', () => api);

import { MerchantHealthTab } from './MerchantHealthTab';

const row = (o: Partial<MerchantHealthRow>): MerchantHealthRow => ({
  storeId: 'st1', storeName: 'Quiet Books', storeSlug: 'quiet', storeStatus: 'active', storeCreatedAt: '2026-01-01T00:00:00Z',
  sellerId: 'se1', sellerName: 'Bo', sellerEmail: 'bo@quiet.test', score: 22, band: 'at_risk', mrr: 29,
  parts: { sales: { points: 3, max: 30 }, engagement: { points: 0, max: 20 }, billing: { points: 2, max: 25 }, catalog: { points: 12, max: 15 }, customers: { points: 5, max: 10 } },
  reasons: [
    { factor: 'billing', lost: 23, text: 'Payment failed (3 attempts)' },
    { factor: 'sales', lost: 17, text: 'Last order 75 days ago' },
    { factor: 'engagement', lost: 20, text: "Seller hasn't signed in for over 90 days" },
  ],
  planStatus: 'past_due', lastOrderAt: null, lastSellerLoginAt: null, activeProducts: 8, revenueLast30: 0, ...o,
});
const data = (items: MerchantHealthRow[]): { success: boolean; data: MerchantHealthData } => ({
  success: true,
  data: { summary: { stores: 40, averageScore: 69, healthy: 24, attention: 7, atRisk: 9, mrrAtRisk: 307, mrrNeedsAttention: 553 }, total: items.length, page: 1, limit: 25, items, computedAt: '2026-10-30T12:00:00Z' },
});
const renderTab = () => render(
  <MemoryRouter initialEntries={['/admin/clients']}>
    <Routes>
      <Route path="/admin/clients" element={<MerchantHealthTab />} />
      <Route path="/admin/clients/:id" element={<p>client workspace</p>} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('MerchantHealthTab', () => {
  it('opens on the at-risk stores with the summary, the score, the top reasons and the MRR', async () => {
    api.apiGetMerchantHealth.mockResolvedValue(data([row({})]));
    renderTab();
    expect(await screen.findAllByText('Quiet Books')).not.toHaveLength(0);
    expect(api.apiGetMerchantHealth).toHaveBeenCalledWith({ band: 'at_risk', search: undefined, page: 1, limit: 25 });
    expect(screen.getByText('$307 MRR at risk')).toBeInTheDocument();
    expect(screen.getAllByText('Payment failed (3 attempts)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+1 more').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Payment failed').length).toBeGreaterThan(0); // plan column
  });

  it('switches band, exports with the same filter, and opens the client workspace on click', async () => {
    api.apiGetMerchantHealth.mockResolvedValue(data([row({})]));
    api.apiExportMerchantHealth.mockResolvedValue(undefined);
    renderTab();
    await screen.findAllByText('Quiet Books');
    fireEvent.click(screen.getByRole('button', { name: 'Healthy' }));
    await waitFor(() => expect(api.apiGetMerchantHealth).toHaveBeenLastCalledWith({ band: 'healthy', search: undefined, page: 1, limit: 25 }));
    fireEvent.click(screen.getByRole('button', { name: /CSV/ }));
    await waitFor(() => expect(api.apiExportMerchantHealth).toHaveBeenCalledWith(expect.objectContaining({ band: 'healthy' })));
    fireEvent.click(screen.getAllByText('Quiet Books')[0]);
    expect(await screen.findByText('client workspace')).toBeInTheDocument();
  });

  it('says so when nobody is at risk', async () => {
    api.apiGetMerchantHealth.mockResolvedValue(data([]));
    renderTab();
    expect(await screen.findByText('No stores at risk right now')).toBeInTheDocument();
  });
});
