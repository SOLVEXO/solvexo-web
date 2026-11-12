import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SellerVerification } from '@/api/services/store';

const api = vi.hoisted(() => ({
  get: vi.fn(), req: vi.fn(), update: vi.fn(), upload: vi.fn(), submit: vi.fn(),
}));
vi.mock('@/api/services/store', () => ({
  apiGetStoreVerification: api.get,
  apiGetStoreVerificationRequirements: api.req,
  apiUpdateStoreVerification: api.update,
  apiUploadVerificationDocument: api.upload,
  apiSubmitStoreVerification: api.submit,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { VerifyBusinessPage } from './VerifyBusinessPage';
import { DashboardVerificationBanner } from './VerificationBanner';

const REQ = {
  country: 'PK', businessType: 'individual', verificationLevel: 'basic',
  requiredFields: ['legalBusinessName', 'businessAddress', 'idDocumentType', 'authorizedContact.name', 'authorizedContact.email', 'authorizedContact.phone', 'taxId', 'cnicNumber'],
  requiredDocuments: ['owner_id', 'tax_registration', 'address_proof'],
  optionalDocuments: ['authorization_proof'],
};

const verification = (over: Partial<SellerVerification> = {}): SellerVerification => ({
  country: 'PK', businessType: 'individual', verificationLevel: 'basic', verificationStatus: 'not_started',
  legalBusinessName: 'GlowSkin Store', registrationNumber: null, taxId: null, businessAddress: null, idDocumentType: 'cnic',
  authorizedContact: null, documents: [
    { type: 'owner_id', required: true, state: 'uploaded', fileName: 'cnic.pdf', uploadedAt: '2026-11-10', viewUrl: 'https://signed/x' },
    { type: 'tax_registration', required: true, state: 'missing', fileName: null, uploadedAt: null, viewUrl: null },
    { type: 'address_proof', required: true, state: 'missing', fileName: null, uploadedAt: null, viewUrl: null },
  ],
  missingFields: [], missingDocuments: [], canSubmit: false, history: [], storeStatus: 'active', rejectionReason: null,
  requirements: REQ as SellerVerification['requirements'],
  deadline: { enforcementStarted: true, limited: false, dueAt: '2099-11-30T00:00:00Z' },
  ...over,
});

const renderPage = (v: SellerVerification) => {
  api.get.mockResolvedValue({ success: true, data: v });
  return render(<MemoryRouter><VerifyBusinessPage storeId="s1" /></MemoryRouter>);
};

afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

describe('VerifyBusinessPage', () => {
  it('step 1 shows the PK fields with NTN required and a format hint, and saves through the API', async () => {
    api.update.mockResolvedValue({ success: true });
    renderPage(verification());
    const sameAsCnic = await screen.findByLabelText(/My NTN is my CNIC/);
    expect(screen.getByText('CNIC number')).toBeInTheDocument();
    expect(screen.getByText(/Verify your business by 30 Nov 2099/)).toBeInTheDocument();

    // A separate NTN: untick "My NTN is my CNIC" and type it.
    fireEvent.click(sameAsCnic);
    const ntn = screen.getByPlaceholderText('1234567-8');
    fireEvent.change(ntn, { target: { value: '123' } });
    fireEvent.blur(ntn);
    expect(screen.getAllByText(/7 digits and a check digit/).length).toBeGreaterThan(0);

    fireEvent.change(ntn, { target: { value: '45218732' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('s1', expect.objectContaining({ taxId: '4521873-2', idDocumentType: 'cnic' })));
    expect(await screen.findByText(/Address proof/)).toBeInTheDocument();
  });

  it('shows the API error message when a save is refused', async () => {
    api.update.mockRejectedValue(new Error('NTN must be 7 digits and a check digit, like 1234567-8'));
    renderPage(verification());
    fireEvent.click(await screen.findByRole('button', { name: 'Save draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('NTN must be 7 digits');
  });

  it('documents step lists required docs with upload state', async () => {
    renderPage(verification());
    fireEvent.click(await screen.findByRole('button', { name: /Documents/ }));
    expect(screen.getByText('cnic.pdf')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Upload' })).toHaveLength(3); // tax, address, optional authorization letter
    expect(screen.getByText(/companies and partnerships/)).toBeInTheDocument();
  });

  it('products step asks for a licence upload when a regulated category is picked, and submits', async () => {
    api.update.mockResolvedValue({ success: true });
    api.submit.mockResolvedValue({ success: true });
    renderPage(verification());
    fireEvent.click(await screen.findByRole('button', { name: /Products and services/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cosmetics or skin care' }));
    expect(screen.getByText(/DRAP registration/)).toBeInTheDocument();
    expect(screen.getByText(/Product licence/, { selector: 'p' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/ }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledWith('s1'));
    expect(api.update).toHaveBeenCalledWith('s1', expect.objectContaining({ businessProfile: expect.objectContaining({ regulatedCategories: ['cosmetics'] }) }));
  });

  it('lists what the API says is missing when submit is refused', async () => {
    api.update.mockResolvedValue({ success: true });
    api.submit.mockRejectedValue(Object.assign(new Error('Please complete every required field and document before submitting'), {
      details: { missingFields: ['taxId'], missingDocuments: ['address_proof'] },
    }));
    renderPage(verification());
    fireEvent.click(await screen.findByRole('button', { name: /Products and services/ }));
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('NTN, Address proof');
  });

  it('needs info: shows the admin message and offers resubmit', async () => {
    renderPage(verification({
      verificationStatus: 'needs_info',
      history: [{ action: 'info_requested', note: 'Please upload a clearer CNIC photo', actorRole: 'admin', at: '2026-11-10T00:00:00Z' }],
    }));
    expect(await screen.findByText('Solvexo needs more information')).toBeInTheDocument();
    expect(screen.getAllByText(/clearer CNIC photo/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Products and services/ }));
    expect(screen.getByRole('button', { name: /Resubmit for review/ })).toBeInTheDocument();
  });

  it('pending and verified are read-only', async () => {
    renderPage(verification({ verificationStatus: 'verified' }));
    expect(await screen.findByText('Your business is verified')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save and continue' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Verify your business by/)).not.toBeInTheDocument();
    cleanup();
    renderPage(verification({ verificationStatus: 'pending' }));
    expect(await screen.findByText('Submitted for review')).toBeInTheDocument();
    expect(screen.getByLabelText(/My NTN is my CNIC/)).toBeDisabled();
  });

  it('an individual can use their CNIC as their NTN', async () => {
    api.update.mockResolvedValue({ success: true });
    renderPage(verification());
    const box = await screen.findByLabelText(/My NTN is my CNIC/);
    expect(box).toBeChecked();
    const [cnicInput, ntnInput] = screen.getAllByPlaceholderText('12345-1234567-1');
    expect(ntnInput).toBeDisabled();
    fireEvent.change(cnicInput, { target: { value: '4240120120513' } });
    expect(ntnInput).toHaveValue('4240120120513');
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('s1', expect.objectContaining({ cnicNumber: '42401-2012051-3', taxId: '42401-2012051-3' })));
  });

  it('rejected shows the reason', async () => {
    renderPage(verification({ verificationStatus: 'rejected', rejectionReason: 'NTN certificate is unreadable' }));
    expect(await screen.findByText('Verification was not approved')).toBeInTheDocument();
    expect(screen.getAllByText(/NTN certificate is unreadable/).length).toBeGreaterThan(0);
  });
});

describe('DashboardVerificationBanner', () => {
  it('shows days left and opens the verification tab; hidden once verified', async () => {
    api.get.mockResolvedValue({ success: true, data: verification() });
    render(<MemoryRouter><DashboardVerificationBanner storeId="s1" /></MemoryRouter>);
    expect(await screen.findByText(/Verify your business by 30 Nov 2099/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify now/ })).toBeInTheDocument();
    cleanup();
    api.get.mockResolvedValue({ success: true, data: verification({ verificationStatus: 'verified' }) });
    const { container } = render(<MemoryRouter><DashboardVerificationBanner storeId="s1" /></MemoryRouter>);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(container).toBeEmptyDOMElement();
  });
});
