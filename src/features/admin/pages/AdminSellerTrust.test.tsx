import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { listFixture, rowFixture, summaryFixture } from './sellerTrust/trust.fixtures';

const api = vi.hoisted(() => ({
  apiGetSellerTrustSummary: vi.fn(), apiListSellerTrustStores: vi.fn(), apiTrustRemind: vi.fn(),
  apiUpdateSellerTrustSettings: vi.fn(), apiExportSellerTrustStores: vi.fn(),
}));
vi.mock('@/api/services/admin/adminSellerTrust', async (orig) => ({ ...(await orig<typeof import('@/api/services/admin/adminSellerTrust')>()), ...api }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({ AdminPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { AdminSellerTrust } from './AdminSellerTrust';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const rows = [
  rowFixture({}),
  rowFixture({ storeId: 'st2', storeName: 'Noor Fabrics', sellerName: 'Ayesha Khan', hasNtn: true, ntn: '4521873-2', verificationStatus: 'verified', riskLevel: 'low', riskReasons: [], categories: [] }),
];
const setup = (summary = summaryFixture()) => {
  api.apiGetSellerTrustSummary.mockResolvedValue({ success: true, data: summary });
  api.apiListSellerTrustStores.mockResolvedValue({ success: true, data: listFixture(rows) });
  return render(
    <MemoryRouter initialEntries={['/admin/seller-trust']}>
      <Routes>
        <Route path="/admin/seller-trust" element={<AdminSellerTrust />} />
        <Route path="/admin/seller-trust/:storeId" element={<p>review page</p>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('AdminSellerTrust', () => {
  it('shows the audit tiles, the progress bar and the stores with NTN, verification and risk', async () => {
    setup();
    expect(await screen.findByText('Registered businesses')).toBeInTheDocument();
    expect(screen.getByText('117 missing')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /12 verified, 6 waiting, 2 need more info, 3 rejected, 125 not started/ })).toBeInTheDocument();
    expect((await screen.findAllByText('GlowSkin Store')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Missing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4521873-2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cosmetics or skin care').length).toBeGreaterThan(0);
    expect(api.apiListSellerTrustStores).toHaveBeenCalledWith(expect.objectContaining({ sort: 'risk', page: 1, limit: 25 }));
  });

  it('changes how many stores show per page (25 / 50 / 100)', async () => {
    setup();
    await screen.findAllByText('GlowSkin Store');
    const picker = screen.getByLabelText('stores per page');
    expect([...(picker as HTMLSelectElement).options].map(o => o.value)).toEqual(['25', '50', '100']);
    fireEvent.change(picker, { target: { value: '100' } });
    await waitFor(() => expect(api.apiListSellerTrustStores).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 100 })));
  });

  it('filters, switches to the review queue (oldest submission first) and opens a store', async () => {
    setup();
    await screen.findAllByText('GlowSkin Store');
    fireEvent.change(screen.getByDisplayValue('NTN: any'), { target: { value: 'no' } });
    await waitFor(() => expect(api.apiListSellerTrustStores).toHaveBeenLastCalledWith(expect.objectContaining({ ntn: 'no' })));
    fireEvent.click(screen.getByRole('button', { name: /Review queue/ }));
    await waitFor(() => expect(api.apiListSellerTrustStores).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'pending', sort: 'submitted' })));
    fireEvent.click(screen.getAllByText('Noor Fabrics')[0]);
    expect(await screen.findByText('review page')).toBeInTheDocument();
  });

  it('starts enforcement only after an in-page confirm, with the grace days', async () => {
    api.apiUpdateSellerTrustSettings.mockResolvedValue({ success: true, data: { enforcementStartedAt: '2026-11-12T00:00:00Z', graceDays: 45 } });
    setup();
    const panel = await screen.findByRole('region', { name: 'Enforcement' });
    fireEvent.change(within(panel).getByLabelText('Grace days'), { target: { value: '45' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Start enforcement' }));
    expect(api.apiUpdateSellerTrustSettings).not.toHaveBeenCalled();
    const confirm = within(panel).getByRole('alertdialog', { name: 'Confirm start' });
    expect(confirm).toHaveTextContent('(45 days)');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Yes, start now' }));
    await waitFor(() => expect(api.apiUpdateSellerTrustSettings).toHaveBeenCalledWith({ enforcementStartedAt: 'now', graceDays: 45 }));
    expect(toast.success).toHaveBeenCalledWith('Enforcement started.');
  });

  it('shows the running enforcement with its first deadline and can stop it', async () => {
    api.apiUpdateSellerTrustSettings.mockResolvedValue({ success: true, data: { enforcementStartedAt: null, graceDays: 30 } });
    setup(summaryFixture({ deadlinePassed: 4, enforcement: { startedAt: '2026-10-31T00:00:00Z', graceDays: 30, firstDueAt: '2026-11-30T00:00:00Z' } }));
    const panel = await screen.findByRole('region', { name: 'Enforcement' });
    expect(within(panel).getByText('30 Nov 2026')).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Stop enforcement' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Yes, stop' }));
    await waitFor(() => expect(api.apiUpdateSellerTrustSettings).toHaveBeenCalledWith({ enforcementStartedAt: null }));
  });

  it('sends reminders to everyone matching the filters after confirming', async () => {
    api.apiTrustRemind.mockResolvedValue({ success: true, data: { sent: 1, skipped: 1 } });
    setup();
    await screen.findAllByText('GlowSkin Store');
    fireEvent.change(screen.getByDisplayValue('Risk: any'), { target: { value: 'high' } });
    await waitFor(() => expect(api.apiListSellerTrustStores).toHaveBeenLastCalledWith(expect.objectContaining({ risk: 'high' })));
    fireEvent.click(screen.getByRole('button', { name: 'Remind all matching' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Confirm reminders' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Send reminders' }));
    await waitFor(() => expect(api.apiTrustRemind).toHaveBeenCalledWith({ filter: expect.objectContaining({ risk: 'high' }) }));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Reminders sent: 1. Skipped: 1'));
  });
});
