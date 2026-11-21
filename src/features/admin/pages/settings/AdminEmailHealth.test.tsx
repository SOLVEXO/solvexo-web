import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ apiGetEmailHealth: vi.fn(), apiSendTestEmail: vi.fn() }));
vi.mock('@/api/services/adminEmailHealth', () => api);

import { AdminEmailHealth } from './AdminEmailHealth';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const base = {
  configured: true, host: 'smtp.gmail.com', port: 587, from: 'hello@solvexo.store', appName: 'Solvexo', consecutiveFailures: 0,
  lastError: null, lastErrorAt: null, totals: { sent: 40, failed: 0 }, days: [{ date: '2026-11-21', sent: 40, failed: 0 }],
};

describe('AdminEmailHealth marketing sender', () => {
  it('says marketing mail uses the platform account until a marketing sender is set up', async () => {
    api.apiGetEmailHealth.mockResolvedValue({ data: { ...base, marketing: { configured: false, host: null, port: null, from: null, consecutiveFailures: 0, lastError: null, lastErrorAt: null, totals: { sent: 0, failed: 0 } } } });
    render(<AdminEmailHealth />);
    expect(await screen.findByText(/Not set up: marketing email goes through the platform SMTP account/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Send test email/ })[1]).toBeDisabled();
  });

  it('shows the marketing sender, its totals and failures, and tests it on its own', async () => {
    api.apiGetEmailHealth.mockResolvedValue({ data: { ...base, marketing: { configured: true, host: 'smtp-relay.brevo.com', port: 587, from: 'news@mail.solvexo.store', consecutiveFailures: 4, lastError: 'Daily quota exceeded', lastErrorAt: '2026-11-21T10:00:00Z', totals: { sent: 1200, failed: 4 } } } });
    api.apiSendTestEmail.mockResolvedValue({ success: true, message: 'Test email sent to admin@solvexo.store.' });
    render(<AdminEmailHealth />);
    expect(await screen.findByText('smtp-relay.brevo.com:587')).toBeInTheDocument();
    expect(screen.getByText('1200 sent · 4 failed')).toBeInTheDocument();
    expect(screen.getByText(/The last 4 marketing emails failed to send: Daily quota exceeded/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Send test email/ })[1]);
    await waitFor(() => expect(api.apiSendTestEmail).toHaveBeenCalledWith('marketing'));
    expect(await screen.findByText('Test email sent to admin@solvexo.store.')).toBeInTheDocument();
  });
});
