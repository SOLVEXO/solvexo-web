import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { SellerVerification } from '@/api/services/store';

const api = vi.hoisted(() => ({ request: vi.fn(), cancel: vi.fn(), upload: vi.fn() }));
vi.mock('@/api/services/store', () => ({
  apiRequestVerificationChange: api.request,
  apiCancelVerificationChange: api.cancel,
}));
vi.mock('@/api/upload', () => ({ apiUploadPrivateFile: api.upload }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { ChangeRequestPanel } from './ChangeRequestPanel';

const verified = (over: Partial<SellerVerification> = {}): SellerVerification => ({
  country: 'PK', businessType: 'individual', verificationLevel: 'basic', verificationStatus: 'verified',
  legalBusinessName: 'Ali Traders', registrationNumber: null, taxId: '1234567-8', cnicNumber: '12345-1234567-1', strn: null,
  businessAddress: 'Old Street, Lahore', idDocumentType: 'cnic',
  authorizedContact: { name: 'Ali', designation: 'Owner', email: 'ali@x.pk', phone: '0300 1234567' },
  documents: [{ type: 'owner_id', required: true, state: 'uploaded', fileName: 'cnic.pdf', uploadedAt: '2026-11-10', viewUrl: null }],
  missingFields: [], missingDocuments: [], canSubmit: true, history: [], storeStatus: 'active', rejectionReason: null,
  change: null, ...over,
});

const reload = vi.fn();
const renderPanel = (v = verified()) => render(<ChangeRequestPanel storeId="s1" v={v} reload={reload} />);
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('ChangeRequestPanel', () => {
  it('a verified seller is offered a change request, not editing', async () => {
    renderPanel();
    expect(screen.getByText('Need to change your details?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    expect(await screen.findByDisplayValue('Old Street, Lahore')).toBeInTheDocument();
  });

  it('sends ONLY what changed, with the declaration, and refreshes', async () => {
    api.request.mockResolvedValue({ success: true });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.change(await screen.findByDisplayValue('Old Street, Lahore'), { target: { value: 'New Street, Karachi' } });
    fireEvent.change(screen.getByDisplayValue('0300 1234567'), { target: { value: '0311 7654321' } });
    fireEvent.click(screen.getByLabelText(/I confirm the details and documents/));
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    await waitFor(() => expect(api.request).toHaveBeenCalledWith('s1', {
      declarationAccepted: true, businessAddress: 'New Street, Karachi', authorizedContact: { phone: '0311 7654321' },
    }));
    expect(reload).toHaveBeenCalled();
  });

  it('will not send when nothing changed or the declaration is not ticked', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Send change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Change something first');
    fireEvent.change(screen.getByDisplayValue('Old Street, Lahore'), { target: { value: 'New Street' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('tick the declaration');
    expect(api.request).not.toHaveBeenCalled();
  });

  it('checks the CNIC and NTN format before sending', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.change(await screen.findByDisplayValue('1234567-8'), { target: { value: '123' } });
    fireEvent.click(screen.getByLabelText(/I confirm the details and documents/));
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    expect((await screen.findAllByText(/7 digits plus 1 last digit/)).length).toBeGreaterThan(0);
    expect(api.request).not.toHaveBeenCalled();
  });

  it('uploads a replacement file privately and sends it with the request', async () => {
    api.upload.mockResolvedValue({ data: { publicId: 'private/kyc-documents/u1/new', resourceType: 'raw', fileName: 'new-cnic.pdf' } });
    api.request.mockResolvedValue({ success: true });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Upload new file/ }));
    const input = screen.getByLabelText('Choose the new document') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF-1.7'], 'new-cnic.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByText(/New file: new-cnic.pdf/)).toBeInTheDocument();
    expect(api.upload).toHaveBeenCalledWith(expect.any(File), 'kyc_document');
    fireEvent.click(screen.getByLabelText(/I confirm the details and documents/));
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    await waitFor(() => expect(api.request).toHaveBeenCalledWith('s1', {
      declarationAccepted: true, documents: [{ type: 'owner_id', publicId: 'private/kyc-documents/u1/new', resourceType: 'raw', fileName: 'new-cnic.pdf' }],
    }));
  });

  it('shows the API reason when a request is refused, including what would be left empty', async () => {
    api.request.mockRejectedValue(Object.assign(new Error('This change would leave required details empty'), { details: { missingFields: ['businessAddress'] } }));
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.change(await screen.findByDisplayValue('Old Street, Lahore'), { target: { value: '' } });
    fireEvent.click(screen.getByLabelText(/I confirm the details and documents/));
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Business address');
  });

  it('a waiting request shows what was asked, says nothing changes yet, and can be withdrawn after a confirm', async () => {
    api.cancel.mockResolvedValue({ success: true });
    renderPanel(verified({
      change: {
        status: 'pending', fields: { businessAddress: 'New Street', authorizedContact: { phone: '0311' } },
        documents: [{ type: 'owner_id', fileName: 'new-cnic.pdf', uploadedAt: null, viewUrl: null }],
        sellerNote: 'We moved', requestedAt: '2026-11-20T10:00:00Z', reviewedAt: null, rejectionReason: null, consent: null,
      },
    }));
    expect(screen.getByText('Change request waiting for review')).toBeInTheDocument();
    expect(screen.getByText('New Street')).toBeInTheDocument();
    expect(screen.getByText('0311')).toBeInTheDocument();
    expect(screen.getByText('new-cnic.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Request a change/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw request' }));
    expect(api.cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, withdraw' }));
    await waitFor(() => expect(api.cancel).toHaveBeenCalledWith('s1'));
    expect(reload).toHaveBeenCalled();
  });

  it('a rejected request shows the reason and the seller can send a new one', () => {
    renderPanel(verified({ change: { status: 'rejected', fields: {}, documents: [], sellerNote: null, requestedAt: null, reviewedAt: null, rejectionReason: 'Address proof is unreadable', consent: null } }));
    expect(screen.getByText('Your last change request was not approved')).toBeInTheDocument();
    expect(screen.getByText(/Address proof is unreadable/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request a change/ })).toBeInTheDocument();
  });
});

describe('ChangeRequestPanel: director', () => {
  const company = () => verified({ businessType: 'company', director: { name: 'Bilal Khan', idNumber: '35202-1234567-1' } });

  it('a verified company can change its director and only the changed key is sent', async () => {
    api.request.mockResolvedValue({ success: true });
    renderPanel(company());
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    fireEvent.change(await screen.findByDisplayValue('35202-1234567-1'), { target: { value: '35202-7654321-9' } });
    fireEvent.click(screen.getByLabelText(/I confirm the details and documents/));
    fireEvent.click(screen.getByRole('button', { name: 'Send change request' }));
    await waitFor(() => expect(api.request).toHaveBeenCalledWith('s1', { declarationAccepted: true, director: { idNumber: '35202-7654321-9' } }));
  });

  it('an individual has no director fields', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Request a change/ }));
    await screen.findByDisplayValue('Old Street, Lahore');
    expect(screen.queryByText('Director or partner')).not.toBeInTheDocument();
  });

  it('a waiting request shows the requested director details', () => {
    renderPanel(verified({ businessType: 'company', change: { status: 'pending', fields: { director: { name: 'New Director' } }, documents: [], sellerNote: null, requestedAt: null, reviewedAt: null, rejectionReason: null, consent: null } }));
    expect(screen.getByText('Director name:')).toBeInTheDocument();
    expect(screen.getByText('New Director')).toBeInTheDocument();
  });
});
