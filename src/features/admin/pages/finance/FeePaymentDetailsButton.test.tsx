import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FeePaymentDetailsButton } from './FeePaymentDetailsButton';

const getConfig = vi.fn();
const update = vi.fn();
vi.mock('@/api/services/config/adminConfig', async (orig) => ({
  ...(await orig<object>()),
  apiGetPlatformConfig: () => getConfig(),
  apiUpdateManualPaymentConfig: (p: unknown) => update(p),
}));

afterEach(cleanup);
beforeEach(() => {
  getConfig.mockReset(); update.mockReset();
  getConfig.mockResolvedValue({ data: { manualPaymentConfig: { enabled: true, bankName: 'Meezan', accountTitle: null, accountNumber: '123', iban: null, jazzcashNumber: null, easypaisaNumber: null, instructions: null, usdToPkrRate: 278 } } });
  update.mockResolvedValue({ data: {} });
});

describe('FeePaymentDetailsButton', () => {
  it('loads the saved details into the form', async () => {
    render(<FeePaymentDetailsButton />);
    fireEvent.click(screen.getByRole('button', { name: /payment details/i }));
    await waitFor(() => expect((screen.getByLabelText('Bank') as HTMLInputElement).value).toBe('Meezan'));
    expect((screen.getByLabelText('Account number') as HTMLInputElement).value).toBe('123');
  });

  it('saves only the account details, never the on/off switch or the exchange rate', async () => {
    render(<FeePaymentDetailsButton />);
    fireEvent.click(screen.getByRole('button', { name: /payment details/i }));
    await waitFor(() => expect((screen.getByLabelText('Bank') as HTMLInputElement).value).toBe('Meezan'));
    fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: ' PK00TEST ' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const sent = update.mock.calls[0][0] as Record<string, unknown>;
    expect(sent.iban).toBe('PK00TEST');
    expect(sent.bankName).toBe('Meezan');
    expect('enabled' in sent).toBe(false);
    expect('usdToPkrRate' in sent).toBe(false);
  });

  it('shows an error and stays open when saving fails', async () => {
    update.mockRejectedValueOnce(new Error('Not allowed'));
    render(<FeePaymentDetailsButton />);
    fireEvent.click(screen.getByRole('button', { name: /payment details/i }));
    await waitFor(() => expect((screen.getByLabelText('Bank') as HTMLInputElement).value).toBe('Meezan'));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByLabelText('Bank')).toBeTruthy();
  });
});
