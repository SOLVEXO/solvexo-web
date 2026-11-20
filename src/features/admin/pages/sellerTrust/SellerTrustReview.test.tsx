import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { detailFixture } from './trust.fixtures';

const api = vi.hoisted(() => ({
  apiGetSellerTrustStore: vi.fn(), apiTrustApprove: vi.fn(), apiTrustMarkUnderReview: vi.fn(), apiTrustNtnCheck: vi.fn(),
  apiTrustReject: vi.fn(), apiTrustRequestInfo: vi.fn(), apiTrustRemind: vi.fn(), apiTrustPayoutHold: vi.fn(),
  apiTrustApproveChange: vi.fn(), apiTrustRejectChange: vi.fn(),
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
  for (const k of ['apiTrustApprove', 'apiTrustMarkUnderReview', 'apiTrustNtnCheck', 'apiTrustReject', 'apiTrustRequestInfo', 'apiTrustPayoutHold', 'apiTrustApproveChange', 'apiTrustRejectChange'] as const) {
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
    expect(screen.getByRole('link', { name: /Check NTN on FBR/ })).toHaveAttribute('href', 'https://www.fbr.gov.pk/categ/active-taxpayer-list-income-tax/51147/30859/71169');
    expect(screen.getByText(/ATL/)).toBeInTheDocument();
    expect(screen.getByText('9966')).toBeInTheDocument();
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

describe('SellerTrustReview: change request of a verified seller', () => {
  const pendingChange = () => detailFixture({
    verificationStatus: 'verified',
    change: {
      status: 'pending',
      fields: { businessAddress: 'New Street, Karachi', authorizedContact: { phone: '0311 7654321' } },
      documents: [{ type: 'owner_id', fileName: 'new-cnic.pdf', uploadedAt: '2026-11-20T10:00:00Z', viewUrl: 'https://files.test/signed/new-cnic.pdf' }],
      sellerNote: 'We moved to a new shop', requestedAt: '2026-11-20T10:00:00Z', reviewedAt: null, rejectionReason: null,
      consent: { acceptedAt: '2026-11-20T10:00:00Z', version: '2026-11-20' },
    },
  });

  it('shows what is now vs what is requested, the new file link and the seller note', async () => {
    setup(pendingChange());
    const panel = await screen.findByRole('region', { name: 'Change request' });
    expect(within(panel).getByText('Waiting for review')).toBeInTheDocument();
    expect(within(panel).getByText('New Street, Karachi')).toBeInTheDocument();
    expect(within(panel).getByText('0311 7654321')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /new-cnic.pdf/ })).toHaveAttribute('href', 'https://files.test/signed/new-cnic.pdf');
    expect(within(panel).getByText(/We moved to a new shop/)).toBeInTheDocument();
    expect(within(panel).getByText(/Nothing is live yet/)).toBeInTheDocument();
  });

  it('approves the change only after the inline confirm', async () => {
    setup(pendingChange());
    const panel = await screen.findByRole('region', { name: 'Change request' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Approve change' }));
    expect(api.apiTrustApproveChange).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Confirm change approval' })).getByRole('button', { name: 'Yes, approve change' }));
    await waitFor(() => expect(api.apiTrustApproveChange).toHaveBeenCalledWith('st3'));
    expect(toast.success).toHaveBeenCalledWith('Change approved and applied.');
  });

  it('rejects the change with a written reason', async () => {
    setup(pendingChange());
    const panel = await screen.findByRole('region', { name: 'Change request' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Reject change' }));
    const dialog = await screen.findByRole('dialog');
    const reject = within(dialog).getByRole('button', { name: 'Reject change' });
    expect(reject).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'The new address proof is unreadable.' } });
    fireEvent.click(reject);
    await waitFor(() => expect(api.apiTrustRejectChange).toHaveBeenCalledWith('st3', 'The new address proof is unreadable.'));
  });

  it('a decided request shows its outcome without action buttons; no request shows no panel', async () => {
    const decided = detailFixture({ verificationStatus: 'verified', change: { status: 'rejected', fields: { businessAddress: 'X' }, documents: [], sellerNote: null, requestedAt: null, reviewedAt: '2026-11-21T10:00:00Z', rejectionReason: 'Not enough proof', consent: null } });
    setup(decided);
    const panel = await screen.findByRole('region', { name: 'Change request' });
    expect(within(panel).getByText('Rejected')).toBeInTheDocument();
    expect(within(panel).getByText(/Not enough proof/)).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: 'Approve change' })).not.toBeInTheDocument();
    cleanup();
    setup(detailFixture({ verificationStatus: 'verified' }));
    await screen.findByRole('heading', { name: 'Tech Corner' });
    expect(screen.queryByRole('region', { name: 'Change request' })).not.toBeInTheDocument();
  });
});

describe('SellerTrustReview: director or partner', () => {
  it('shows the director of a company, and nothing for an individual', async () => {
    const base = detailFixture();
    setup(detailFixture({ businessType: 'company', verification: { ...base.verification, director: { name: 'Bilal Khan', idNumber: '35202-1234567-1' } } }));
    expect(await screen.findByText('Director or partner')).toBeInTheDocument();
    expect(screen.getByText('Bilal Khan · 35202-1234567-1')).toBeInTheDocument();
    cleanup();
    setup(detailFixture({ businessType: 'individual' }));
    await screen.findByRole('heading', { name: 'Tech Corner' });
    expect(screen.queryByText('Director or partner')).not.toBeInTheDocument();
  });

  it('a change request for the director shows now vs requested', async () => {
    const base = detailFixture();
    setup(detailFixture({
      businessType: 'company', verificationStatus: 'verified',
      verification: { ...base.verification, director: { name: 'Bilal Khan', idNumber: '35202-1234567-1' } },
      change: { status: 'pending', fields: { director: { idNumber: '35202-7654321-9' } }, documents: [], sellerNote: null, requestedAt: null, reviewedAt: null, rejectionReason: null, consent: null },
    }));
    const panel = await screen.findByRole('region', { name: 'Change request' });
    expect(within(panel).getByText('Director ID number')).toBeInTheDocument();
    expect(within(panel).getByText('35202-1234567-1')).toBeInTheDocument();
    expect(within(panel).getByText('35202-7654321-9')).toBeInTheDocument();
  });
});
