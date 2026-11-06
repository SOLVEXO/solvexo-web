import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSettings = vi.fn();
const saveSettings = vi.fn();
const confirmOrder = vi.fn();
const resend = vi.fn();
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('@/api/services/codProtection', () => ({
  apiGetCodSettings: (...a: unknown[]) => getSettings(...a),
  apiSaveCodSettings: (...a: unknown[]) => saveSettings(...a),
  apiConfirmCodOrder: (...a: unknown[]) => confirmOrder(...a),
  apiResendCodConfirmation: (...a: unknown[]) => resend(...a),
}));
vi.mock('@/components/layouts/StoreLayout', () => ({ useStoreWorkspace: () => ({ storeId: 's1' }), StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import CodProtectionPage from './CodProtectionPage';
import { CodRiskCard } from './CodRiskCard';

const settings = { enabled: false, maxCodAmount: null, confirmNewCustomers: true, confirmAboveAmount: null, flaggedCities: ['Karachi'], blockedPhones: ['923001234567'], blockedAddresses: [], highRiskScore: 60, highRiskPrepayOnly: false, confirmationHours: 24 };

beforeEach(() => { [getSettings, saveSettings, confirmOrder, resend, toast.success, toast.error].forEach(f => f.mockReset()); });
afterEach(cleanup);

describe('CodProtectionPage', () => {
  it('loads the saved rules and saves what the seller changed (numbers, one-per-line lists)', async () => {
    getSettings.mockResolvedValue(settings);
    saveSettings.mockImplementation((_s: string, body: unknown) => Promise.resolve({ ...settings, ...(body as object) }));
    render(<CodProtectionPage />);
    expect(await screen.findByDisplayValue('Karachi')).toBeTruthy();
    expect(screen.getByDisplayValue('+923001234567')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Protect cash-on-delivery orders/));
    fireEvent.change(screen.getByLabelText(/Maximum COD order total/), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/Flagged delivery cities/), { target: { value: 'Karachi\nQuetta\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(saveSettings.mock.calls[0][1]).toMatchObject({ enabled: true, maxCodAmount: 50000, confirmAboveAmount: null, flaggedCities: ['Karachi', 'Quetta'], blockedPhones: ['+923001234567'], highRiskScore: 60, confirmationHours: 24 });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows the server error on a bad value and keeps the form', async () => {
    getSettings.mockResolvedValue(settings);
    saveSettings.mockRejectedValue(new Error('A blocked phone number is not valid'));
    render(<CodProtectionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('A blocked phone number is not valid'));
    expect(screen.getByDisplayValue('Karachi')).toBeTruthy();
  });

  it('a load failure shows an error with a retry', async () => {
    getSettings.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(settings);
    render(<CodProtectionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByDisplayValue('Karachi')).toBeTruthy();
  });
});

describe('CodRiskCard', () => {
  const cod = (status: string) => ({
    score: 70, level: 'high' as const, decision: 'confirm' as const, reasons: [{ code: 'rto', label: '1 earlier order(s) came back undelivered (RTO)', points: 30 }],
    confirmation: { status: status as 'awaiting', expiresAt: '2030-01-01T00:00:00Z', sentAt: null, channels: ['email'], resolvedAt: null, resolvedBy: null }, override: null,
  });

  it('shows score, reasons and the waiting state, and lets the seller confirm or resend', async () => {
    confirmOrder.mockResolvedValue({ success: true });
    resend.mockResolvedValue({ sent: ['email', 'whatsapp'] });
    const changed = vi.fn();
    render(<CodRiskCard storeId="s1" orderId="o1" cod={cod('awaiting')} onChanged={changed} />);
    expect(screen.getByText(/high · 70\/100/)).toBeTruthy();
    expect(screen.getByText(/came back undelivered/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/Waiting for the customer/);
    fireEvent.click(screen.getByRole('button', { name: 'Send the message again' }));
    await waitFor(() => expect(resend).toHaveBeenCalledWith('s1', 'o1'));
    fireEvent.click(screen.getByRole('button', { name: 'I reached the customer: confirm' }));
    await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith('s1', 'o1'));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('a resolved order shows the outcome without action buttons', () => {
    render(<CodRiskCard storeId="s1" orderId="o1" cod={cod('expired')} onChanged={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toMatch(/cancelled automatically/);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
