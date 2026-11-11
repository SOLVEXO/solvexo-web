import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
let allow = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => allow }));
vi.mock('@/components/comman/ui/NotificationBell', () => ({ NotificationBell: () => null }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { AdminAppPlatform } from './AdminAppPlatform';

const row = (extra: object = {}) => ({ _id: 'x1', name: 'Reports', slug: 'reports', description: '', developerName: '', developerEmail: '', clientId: 'app_1', clientSecretHint: '...abcd', redirectUrls: ['https://app.example.com/cb'], requestedScopes: ['read_orders'], webhookUrl: null, webhookEvents: [], uninstallWebhookUrl: null, embedUrl: null, embedTitle: '', status: 'draft', ...extra });
let list: unknown[] = [];
beforeEach(() => { get.mockReset(); post.mockReset(); allow = true; list = [row()]; get.mockImplementation(() => Promise.resolve(list)); });
afterEach(cleanup);

describe('AdminAppPlatform', () => {
  it('lists apps and approves a draft', async () => {
    post.mockResolvedValue({});
    render(<AdminAppPlatform />);
    expect(await screen.findByText('Reports')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/admin/app-platform/x1/approve'));
  });

  it('registering posts clean values and shows the secrets once', async () => {
    post.mockResolvedValue({ id: 'x2', clientId: 'app_2', clientSecret: 'appsec_111', sessionSecret: 'appses_222' });
    render(<AdminAppPlatform />);
    await screen.findByText('Reports');
    fireEvent.click(screen.getByRole('button', { name: /register app/i }));
    fireEvent.change(await screen.findByLabelText('App name'), { target: { value: 'New app' } });
    fireEvent.change(screen.getByLabelText(/Redirect addresses/), { target: { value: 'https://new.example.com/cb\n\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'New app', redirectUrls: ['https://new.example.com/cb'], requestedScopes: ['read_orders'], webhookUrl: null, embedUrl: null });
    expect(await screen.findByText(/appsec_111/)).toBeTruthy();
    expect(screen.getByText(/appses_222/)).toBeTruthy();
  });

  it('suspending asks first and says every store loses the app', async () => {
    list = [row({ status: 'approved' })]; post.mockResolvedValue({ success: true, uninstalled: 3 });
    render(<AdminAppPlatform />);
    fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/removed from every store/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Suspend app' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/admin/app-platform/x1/suspend'));
  });

  it('without permission there is no Register / Approve / Edit; failure shows a retry', async () => {
    allow = false;
    const { unmount } = render(<AdminAppPlatform />);
    await screen.findByText('Reports');
    for (const n of [/register app/i, 'Approve', 'Edit', 'New secrets']) expect(screen.queryByRole('button', { name: n })).toBeNull();
    unmount();
    get.mockRejectedValue(new Error('down'));
    render(<AdminAppPlatform />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
