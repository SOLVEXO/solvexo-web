import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  apiGetDigestSettings: vi.fn(), apiUpdateDigestSettings: vi.fn(), apiPreviewDigest: vi.fn(), apiSendTestDigest: vi.fn(),
}));
vi.mock('@/api/services/adminTeam', () => api);
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
const perm = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => perm.allowed }));

import { AdminDigestSettings } from './AdminDigestSettings';

afterEach(() => { cleanup(); vi.clearAllMocks(); perm.allowed = true; });

describe('AdminDigestSettings', () => {
  it('switches the digest off and back on, and rolls back if saving fails', async () => {
    api.apiGetDigestSettings.mockResolvedValue({ data: { weeklyDigest: true } });
    api.apiUpdateDigestSettings.mockResolvedValueOnce({ data: { weeklyDigest: false } }).mockRejectedValueOnce(new Error('offline'));
    render(<AdminDigestSettings />);
    const sw = await screen.findByRole('switch', { name: 'Weekly business digest email' });
    await screen.findByText('On: you get it every Monday');
    fireEvent.click(sw);
    await waitFor(() => expect(api.apiUpdateDigestSettings).toHaveBeenCalledWith(false));
    expect(await screen.findByText('Off')).toBeInTheDocument();
    fireEvent.click(sw);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('offline'));
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('previews the email in a sandboxed frame and sends a test', async () => {
    api.apiGetDigestSettings.mockResolvedValue({ data: { weeklyDigest: true } });
    api.apiPreviewDigest.mockResolvedValue({ data: { subject: 'Solvexo weekly · MRR $49', html: '<p>hello</p>' } });
    api.apiSendTestDigest.mockResolvedValue({ data: { sent: 1 }, message: 'Sent. Check your inbox (and the bell).' });
    render(<AdminDigestSettings />);
    fireEvent.click(await screen.findByRole('button', { name: /Preview this week/ }));
    const frame = await screen.findByTitle('Weekly digest preview');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('srcdoc', '<p>hello</p>');
    expect(screen.getByText('Solvexo weekly · MRR $49')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Send me a test/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sent. Check your inbox (and the bell).'));
  });

  it('is hidden from admins who cannot see analytics', () => {
    perm.allowed = false;
    const { container } = render(<AdminDigestSettings />);
    expect(container).toBeEmptyDOMElement();
    expect(api.apiGetDigestSettings).not.toHaveBeenCalled();
  });
});
