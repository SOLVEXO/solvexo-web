import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { detailFixture } from './trust.fixtures';

const api = vi.hoisted(() => ({
  apiGetSellerTrustStore: vi.fn(), apiTrustApprove: vi.fn(), apiTrustMarkUnderReview: vi.fn(), apiTrustNtnCheck: vi.fn(),
  apiTrustReject: vi.fn(), apiTrustRequestInfo: vi.fn(), apiTrustRemind: vi.fn(), apiTrustPayoutHold: vi.fn(),
}));
vi.mock('@/api/services/admin/adminSellerTrust', async (orig) => ({ ...(await orig<typeof import('@/api/services/admin/adminSellerTrust')>()), ...api }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({ AdminPageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <header><h1>{title}</h1>{actions}</header> }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { SellerTrustReview } from './SellerTrustReview';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const setup = (d = detailFixture()) => {
  api.apiGetSellerTrustStore.mockResolvedValue({ success: true, data: d });
  for (const k of ['apiTrustApprove', 'apiTrustMarkUnderReview', 'apiTrustNtnCheck', 'apiTrustReject', 'apiTrustRequestInfo', 'apiTrustPayoutHold'] as const) {
    api[k].mockResolvedValue({ success: true, data: null });
  }
  return render(
    <MemoryRouter initialEntries={['/admin/seller-trust/st3']}>
      <Routes><Route path="/admin/seller-trust/:storeId" element={<SellerTrustReview />} /></Routes>
    </MemoryRouter>,
  );
};

describe('SellerTrustReview', () => {
  it('shows the submission: details, documents with signed links, answers, risk and history', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'Tech Corner' })).toBeInTheDocument();
    expect(api.apiGetSellerTrustStore).toHaveBeenCalledWith('st3');
    expect(screen.getByText('35202-1234567-1')).toBeInTheDocument();
    expect(screen.getByText('Not checked')).toBeInTheDocument();
    const docs = screen.getByRole('region', { name: 'Documents' });
    const links = within(docs).getAllByRole('link', { name: /View/ });
    expect(links[0]).toHaveAttribute('href', 'https://files.test/signed/cnic.pdf');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(within(docs).getByText('Not uploaded')).toBeInTheDocument();
    expect(screen.getByText('Buys and resells')).toBeInTheDocument();
    expect(screen.getByText('Sells mobile phones without a PTA approval')).toBeInTheDocument();
    expect(screen.getByText('Submitted for review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Check NTN on FBR/ })).toHaveAttribute('href', 'https://e.fbr.gov.pk/esbn/Verification.aspx');
    expect(screen.getByRole('link', { name: /WhatsApp seller/ }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/923339988776\?text=/);
  });

  it('records the NTN check result and marks under review', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Tech Corner' });
    fireEvent.click(within(screen.getByRole('group', { name: 'Record NTN result' })).getByRole('button', { name: 'Active' }));
    await waitFor(() => expect(api.apiTrustNtnCheck).toHaveBeenCalledWith('st3', 'active'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark under review' }));
    await waitFor(() => expect(api.apiTrustMarkUnderReview).toHaveBeenCalledWith('st3'));
    expect(api.apiGetSellerTrustStore).toHaveBeenCalledTimes(3);
  });

  it('approves only after the inline confirm', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Tech Corner' });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(api.apiTrustApprove).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Confirm approval' })).getByRole('button', { name: 'Yes, approve' }));
    await waitFor(() => expect(api.apiTrustApprove).toHaveBeenCalledWith('st3'));
    expect(toast.success).toHaveBeenCalledWith('Store approved and verified.');
  });

  it('asks for more info and rejects with a written message', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Tech Corner' });
    fireEvent.click(screen.getByRole('button', { name: 'Ask for more info' }));
    let dialog = await screen.findByRole('dialog');
    const send = within(dialog).getByRole('button', { name: 'Send request' });
    expect(send).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Message to the seller'), { target: { value: 'Please upload the PTA approval letter.' } });
    fireEvent.click(send);
    await waitFor(() => expect(api.apiTrustRequestInfo).toHaveBeenCalledWith('st3', 'Please upload the PTA approval letter.'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Reject with reason' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'NTN not found on FBR.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(api.apiTrustReject).toHaveBeenCalledWith('st3', 'NTN not found on FBR.'));
  });

  it('hides review actions once verified, warns about Stripe Connect when holding payouts', async () => {
    setup(detailFixture({ verificationStatus: 'verified', stripeConnect: true }));
    await screen.findByRole('heading', { name: 'Tech Corner' });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send reminder/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hold payouts' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Stripe Connect/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold payouts' }));
    await waitFor(() => expect(api.apiTrustPayoutHold).toHaveBeenCalledWith('st3', true, undefined));
  });
});
