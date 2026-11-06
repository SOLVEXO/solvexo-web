import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const me = vi.fn();
const optIn = vi.fn();
const optOut = vi.fn();
vi.mock('@/api/services/marketingMessaging', () => ({
  apiGetMyMessagingPrefs: (...a: unknown[]) => me(...a),
  apiMessagingOptIn: (...a: unknown[]) => optIn(...a),
  apiMessagingOptOut: (...a: unknown[]) => optOut(...a),
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getToken: () => 'tok' } }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', name: 'Shop' } }) }));

import { DefaultMessagingPrefsPage } from './DefaultMessagingPrefsPage';

const prefs = (over: Record<string, unknown> = {}) => ({ available: { whatsapp: true, sms: false }, consents: [], ...over });
const renderPage = () => render(<MemoryRouter><DefaultMessagingPrefsPage /></MemoryRouter>);

beforeEach(() => { me.mockReset(); optIn.mockReset(); optOut.mockReset(); });
afterEach(cleanup);

describe('DefaultMessagingPrefsPage', () => {
  it('lists only the channels the store has switched on', async () => {
    me.mockResolvedValue(prefs());
    renderPage();
    expect(await screen.findByText('WhatsApp')).toBeTruthy();
    expect(screen.queryByText('SMS')).toBeNull();
  });

  it('cannot opt in until the box is ticked and a number is typed; then sends agreed:true', async () => {
    me.mockResolvedValue(prefs());
    optIn.mockResolvedValue(prefs({ consents: [{ channel: 'whatsapp', status: 'opted_in', phoneEnding: '4567' }] }));
    renderPage();
    const btn = (await screen.findByRole('button', { name: 'Turn on' })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '+92 300 1234567' } });
    expect(btn.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(await screen.findByText(/4567/)).toBeTruthy();
    expect(optIn).toHaveBeenCalledWith('s1', { channel: 'whatsapp', phone: '+92 300 1234567', agreed: true });
  });

  it('an opted-in customer can stop messages', async () => {
    me.mockResolvedValue(prefs({ consents: [{ channel: 'whatsapp', status: 'opted_in', phoneEnding: '4567' }] }));
    optOut.mockResolvedValue(prefs({ consents: [{ channel: 'whatsapp', status: 'opted_out', phoneEnding: '4567' }] }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Stop messages' }));
    expect(await screen.findByText(/You stopped these messages/)).toBeTruthy();
    expect(optOut).toHaveBeenCalledWith('s1', 'whatsapp');
  });

  it('shows a retry when loading fails', async () => {
    me.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
