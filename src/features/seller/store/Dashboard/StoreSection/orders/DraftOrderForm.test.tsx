import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];
const toastError = vi.fn();
const toastSuccess = vi.fn();
const updatePayloads: Record<string, unknown>[] = [];
let updateShouldFail = false;
let draftData: Record<string, unknown>;

vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ error: toastError, success: toastSuccess }) }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1', store: { baseCurrency: 'PKR' } }),
  StorePageHeader: ({ actions }: { actions?: React.ReactNode }) => <div>{actions}</div>,
}));
vi.mock('@/api/client', () => ({ default: { get: () => Promise.resolve({ items: [] }) } }));
vi.mock('@/api/services/product', () => ({ apiGetMyProductById: vi.fn() }));
vi.mock('./VariantPickModal', () => ({ VariantPickModal: () => null }));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal', () => ({ EntityPickerModal: () => null }));
vi.mock('@/api/services/draftOrders', () => ({
  apiSearchDraftOrderCustomers: vi.fn(() => Promise.resolve({ data: [] })),
  apiCreateDraftOrder: vi.fn(),
  apiGetDraftOrder: vi.fn(() => Promise.resolve({ data: draftData })),
  apiUpdateDraftOrder: vi.fn((_s: string, _id: string, payload: Record<string, unknown>) => {
    calls.push('update');
    updatePayloads.push(payload);
    return updateShouldFail ? Promise.reject(new Error('Save failed')) : Promise.resolve({ data: draftData });
  }),
  apiCancelDraftOrder: vi.fn(),
  apiCompleteDraftOrder: vi.fn(() => { calls.push('complete'); return Promise.resolve({ data: { orderId: 'o1', orderNumber: 'ORD-1' } }); }),
  apiMarkDraftOrderPaid: vi.fn(),
  apiDuplicateDraftOrder: vi.fn(),
  apiDeleteDraftOrderPermanently: vi.fn(),
  apiSendDraftOrderInvoice: vi.fn(() => { calls.push('send'); return Promise.resolve({ data: { invoiceUrl: 'x' } }); }),
}));

import DraftOrderForm from './DraftOrderForm';

const guestDraft = (over: Record<string, unknown> = {}) => ({
  _id: 'd1', status: 'open', isPaid: false, currency: 'PKR', customerId: null, customerName: 'Uzair', customerEmail: 'old@example.com', customerPhone: '',
  items: [{ productId: 'p1', variantId: 'v1', type: 'physical', name: 'Belt', image: null, sku: null, options: [], quantity: 1, unitPrice: 6500 }],
  discountType: null, discountValue: 0, shippingAmount: 0, taxAmount: 0, notes: '', shippingAddress: null, paymentTerms: null, invoiceSentAt: null,
  ...over,
});

const renderForm = () => render(
  <MemoryRouter initialEntries={['/store/s1/draft-orders/d1']}>
    <Routes><Route path="/store/:storeId/draft-orders/:draftId" element={<DraftOrderForm />} /></Routes>
  </MemoryRouter>,
);

beforeEach(() => { calls.length = 0; updatePayloads.length = 0; updateShouldFail = false; toastError.mockClear(); toastSuccess.mockClear(); draftData = guestDraft(); });
afterEach(cleanup);

describe('DraftOrderForm — guest draft', () => {
  it('shows Send Invoice for a guest who has an email', async () => {
    renderForm();
    expect(await screen.findByRole('button', { name: 'Send Invoice' })).toBeTruthy();
  });

  it('hides Send Invoice while the guest has no email', async () => {
    draftData = guestDraft({ customerEmail: '' });
    renderForm();
    await screen.findByDisplayValue('Uzair');
    expect(screen.queryByRole('button', { name: 'Send Invoice' })).toBeNull();
  });

  it('offers no Send Invoice for a draft already marked as paid (there is nothing to ask for)', async () => {
    draftData = guestDraft({ isPaid: true });
    renderForm();
    await screen.findByDisplayValue('Uzair');
    expect(screen.queryByRole('button', { name: /Send Invoice|Resend Invoice/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Complete Order' })).toBeTruthy(); // the way forward for a paid draft
  });

  it('saves the typed (unsaved) email first, then sends the invoice', async () => {
    renderForm();
    const email = await screen.findByDisplayValue('old@example.com');
    fireEvent.change(email, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invoice' }));
    await waitFor(() => expect(calls).toEqual(['update', 'send']));
    expect(updatePayloads[0].customerEmail).toBe('new@example.com');
  });

  it('does not send the invoice when the save fails, and says why', async () => {
    updateShouldFail = true;
    renderForm();
    await screen.findByDisplayValue('old@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send Invoice' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Save failed'));
    expect(calls).toEqual(['update']);
  });

  it('saves the on-screen edits before completing the order', async () => {
    renderForm();
    const email = await screen.findByDisplayValue('old@example.com');
    fireEvent.change(email, { target: { value: 'fresh@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Complete Order' }));
    // the confirmation dialog has its own "Complete Order" button
    const confirm = (await screen.findAllByRole('button', { name: 'Complete Order' })).pop()!;
    fireEvent.click(confirm);
    await waitFor(() => expect(calls).toEqual(['update', 'complete']));
    expect(updatePayloads[0].customerEmail).toBe('fresh@example.com');
  });
});
