import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { FbrInvoiceList } from './FbrInvoiceList';
import type { FbrInvoiceRow, FbrList } from '@/api/services/fbrDi';

vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));

const row = (over: Partial<FbrInvoiceRow>): FbrInvoiceRow => ({
  _id: 'r1', reference: 'INV-1', kind: 'sale', status: 'pending', mode: 'sandbox', fbrInvoiceNumber: null, note: null, errors: [],
  attempts: 0, nextAttemptAt: null, netAmount: 0, taxAmount: 0, createdAt: '2026-11-11T10:00:00Z', ...over,
} as FbrInvoiceRow);
const list = (items: FbrInvoiceRow[]): FbrList => ({ items, total: items.length, page: 1, limit: 20 } as FbrList);

describe('FbrInvoiceList (Phase 0 states)', () => {
  afterEach(cleanup);
  it('shows the on-hold label and no Send again button for held_rule', async () => {
    render(<FbrInvoiceList referenceLabel="Plan invoice" load={async () => list([row({ status: 'held_rule' })])} retry={async () => ({})} />);
    await waitFor(() => expect(screen.getAllByText(/On hold: tax treatment not verified/).length).toBeGreaterThan(0));
    expect(screen.queryByText('Send again')).toBeNull();
  });

  it('unknown_outcome: no automatic Send again, offers the two settle choices, validates the FBR number', async () => {
    const resolve = vi.fn().mockResolvedValue({});
    render(<FbrInvoiceList referenceLabel="Order" load={async () => list([row({ status: 'unknown_outcome' })])} retry={async () => ({})} resolve={resolve} />);
    await waitFor(() => expect(screen.getByText(/I checked: it WAS filed/)).toBeTruthy());
    expect(screen.queryByText('Send again')).toBeNull();
    fireEvent.click(screen.getByText(/I checked: it WAS filed/));
    const save = screen.getByText('Save as filed') as HTMLButtonElement;
    expect(save.closest('button')!.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/FBR invoice number/), { target: { value: 'abc' } });
    expect(screen.getByText(/does not look like an FBR invoice number/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/FBR invoice number/), { target: { value: '7000007DI1747119701593' } });
    expect(screen.getByText('Save as filed').closest('button')!.disabled).toBe(false);
    fireEvent.click(screen.getByText('Save as filed'));
    await waitFor(() => expect(resolve).toHaveBeenCalledWith('r1', { action: 'filed', fbrInvoiceNumber: '7000007DI1747119701593' }));
  });

  it('an already settled unknown_outcome shows a note and no buttons; without resolve right it tells to ask the owner', async () => {
    render(<FbrInvoiceList referenceLabel="Order" load={async () => list([row({ status: 'unknown_outcome', resolvedAt: '2026-11-11T11:00:00Z', resolution: 'resend' })])} resolve={async () => ({})} />);
    await waitFor(() => expect(screen.getByText(/already settled once/)).toBeTruthy());
    expect(screen.queryByText(/I checked/)).toBeNull();
  });

  it('without a resolve handler a person is told only the owner can settle it', async () => {
    render(<FbrInvoiceList referenceLabel="Order" load={async () => list([row({ status: 'unknown_outcome' })])} />);
    await waitFor(() => expect(screen.getByText(/Only the store owner can settle this/)).toBeTruthy());
  });

  it('Send again stays for failed / rejected / needs_info', async () => {
    render(<FbrInvoiceList referenceLabel="Order" retry={async () => ({})} load={async () => list([row({ _id: 'a', status: 'failed' }), row({ _id: 'b', status: 'rejected' }), row({ _id: 'c', status: 'needs_info' })])} />);
    await waitFor(() => expect(screen.getAllByText('Send again').length).toBe(3));
  });
});
