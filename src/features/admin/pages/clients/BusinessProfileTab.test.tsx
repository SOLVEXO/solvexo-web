import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { businessProfileFixture } from '../sellerTrust/trust.fixtures';

const api = vi.hoisted(() => ({ apiGetClientBusinessProfile: vi.fn(), apiTrustRemind: vi.fn(), apiTrustPayoutHold: vi.fn() }));
vi.mock('@/api/services/admin/adminSellerTrust', async (orig) => ({ ...(await orig<typeof import('@/api/services/admin/adminSellerTrust')>()), ...api }));
const perms = vi.hoisted(() => ({ manage: true }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => (p === 'marketplace.manage' ? perms.manage : true) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { BusinessProfileTab } from './BusinessProfileTab';

afterEach(() => { cleanup(); vi.clearAllMocks(); perms.manage = true; });

const renderTab = () => render(
  <MemoryRouter initialEntries={['/admin/clients/se1']}>
    <Routes>
      <Route path="/admin/clients/:id" element={<BusinessProfileTab sellerId="se1" />} />
      <Route path="/admin/seller-trust/:storeId" element={<p>review page</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('BusinessProfileTab', () => {
  it('shows contact, sign-up answers, where they came from, and the store verification with risk signals', async () => {
    api.apiGetClientBusinessProfile.mockResolvedValue({ success: true, data: businessProfileFixture() });
    renderTab();
    expect(await screen.findByText('Contact and sign-up')).toBeInTheDocument();
    expect(api.apiGetClientBusinessProfile).toHaveBeenCalledWith('se1');
    expect(screen.getByText('Signed up with Google')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText(/facebook · \(paid\) · campaign "Nov launch" · landing \/start/)).toBeInTheDocument();
    expect(screen.getByText('Cosmetics, Skin care')).toBeInTheDocument();

    const card = screen.getByRole('heading', { name: 'Business verification · GlowSkin Store' }).closest('section')!;
    expect(within(card).getByText('Missing')).toBeInTheDocument();
    expect(within(card).getByText('Store Settings: empty')).toBeInTheDocument();
    expect(within(card).getByText(/30 Nov 2026 \(\d+ days? left|overdue|Due today/)).toBeInTheDocument();
    expect(within(card).getByText('Sells cosmetics without DRAP licence')).toBeInTheDocument();
    expect(within(card).getByText('Info')).toBeInTheDocument();
    const wa = within(card).getByRole('link', { name: /WhatsApp seller/ });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/923217654321\?text=/);
  });

  it('sends a reminder and holds payouts with a reason through an in-page confirm', async () => {
    api.apiGetClientBusinessProfile.mockResolvedValue({ success: true, data: businessProfileFixture() });
    api.apiTrustRemind.mockResolvedValue({ success: true, data: { sent: 1, skipped: 0 } });
    api.apiTrustPayoutHold.mockResolvedValue({ success: true, data: null });
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: /Send reminder/ }));
    await waitFor(() => expect(api.apiTrustRemind).toHaveBeenCalledWith({ storeIds: ['st1'] }));
    expect(toast.success).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Hold payouts/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: 'No DRAP licence' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold payouts' }));
    await waitFor(() => expect(api.apiTrustPayoutHold).toHaveBeenCalledWith('st1', true, 'No DRAP licence'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the Seller trust review, and hides actions from read-only admins', async () => {
    perms.manage = false;
    api.apiGetClientBusinessProfile.mockResolvedValue({ success: true, data: businessProfileFixture() });
    renderTab();
    await screen.findByText('Contact and sign-up');
    expect(screen.queryByRole('button', { name: /Send reminder/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hold payouts/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open review/ }));
    expect(await screen.findByText('review page')).toBeInTheDocument();
  });
});
