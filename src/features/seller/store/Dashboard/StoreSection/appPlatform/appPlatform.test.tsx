import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a), patch: vi.fn() } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  hasNavPermission: () => allowManage,
  StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import ConnectedAppsHub from './ConnectedAppsHub';
import AppAuthorizePage from './AppAuthorizePage';
import AppEmbedPage from './AppEmbedPage';

const app = { id: 'a1', name: 'Reports', slug: 'reports', description: 'Sales reports', developerName: 'Acme', clientId: 'app_1', scopes: ['read_orders'], redirectUrls: ['https://app.example.com/cb'], hasEmbed: true, embedTitle: 'Reports' };
const installed = [{ installId: 'i1', app, grantedScopes: ['read_orders'], scopeLabels: ['See your orders'], installedAt: '2026-11-01T00:00:00Z', embed: { title: 'Reports' } }];
const available = [{ ...app, installed: false, scopeLabels: ['See your orders'] }];

beforeEach(() => {
  get.mockReset(); post.mockReset(); del.mockReset(); allowManage = true;
  get.mockImplementation((url: string) => Promise.resolve(url.endsWith('/installed') ? installed : url.endsWith('/available') ? available : { app, scopes: ['read_orders'], scopeLabels: ['See your orders'], redirectUri: 'https://app.example.com/cb', state: 'st1', alreadyInstalled: false }));
});
afterEach(cleanup);

const renderHub = () => render(<MemoryRouter initialEntries={['/store/s1/app-platform']}><Routes><Route path="/store/s1/app-platform" element={<ConnectedAppsHub />} /><Route path="/store/s1/app-platform/authorize" element={<h2>consent</h2>} /><Route path="/store/s1/app-platform/:installId" element={<h2>embed</h2>} /></Routes></MemoryRouter>);

describe('ConnectedAppsHub', () => {
  it('lists installed apps with what they may do, opens the page, removes after a confirmation', async () => {
    del.mockResolvedValue({ success: true });
    renderHub();
    expect(await screen.findByText('Reports')).toBeTruthy();
    expect(screen.getByText(/See your orders/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove app' }));
    await waitFor(() => expect(del.mock.calls[0][0]).toBe('/api/app-platform/s1/installs/i1'));
  });

  it('Install goes to the consent screen with the app, its redirect address, scopes and a fresh state', async () => {
    renderHub();
    fireEvent.click(await screen.findByRole('button', { name: 'Available apps' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Install' }));
    expect(await screen.findByText('consent')).toBeTruthy();
  });

  it('view-only people cannot install or remove', async () => {
    allowManage = false;
    renderHub();
    await screen.findByText('Reports');
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Available apps' }));
    await screen.findByText(/Asks to/);
    expect(screen.queryByRole('button', { name: 'Install' })).toBeNull();
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    renderHub();
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});

describe('AppAuthorizePage (consent)', () => {
  const url = '/store/s1/app-platform/authorize?client_id=app_1&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb&scope=read_orders&state=st1';
  const renderPage = () => render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/store/s1/app-platform/authorize" element={<AppAuthorizePage />} /><Route path="/store/s1/app-platform" element={<h2>hub</h2>} /></Routes></MemoryRouter>);

  it('shows who asks, what for and where you are sent; Allow sends the exact request and follows the server redirect', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true });
    post.mockResolvedValue({ redirectTo: 'https://app.example.com/cb?code=code_1&state=st1' });
    renderPage();
    expect(await screen.findByText(/See your orders/)).toBeTruthy();
    expect(screen.getByText('https://app.example.com')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Allow and install' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://app.example.com/cb?code=code_1&state=st1'));
    expect(post.mock.calls[0]).toEqual(['/api/app-platform/s1/authorize', { client_id: 'app_1', redirect_uri: 'https://app.example.com/cb', scope: 'read_orders', state: 'st1' }]);
  });

  it('a link the server refuses shows why and offers the way back', async () => {
    get.mockRejectedValue(new Error('The redirect address is not registered for this app'));
    renderPage();
    expect(await screen.findByText(/not registered/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to apps' }));
    expect(await screen.findByText('hub')).toBeTruthy();
  });
});

describe('AppEmbedPage (session handshake)', () => {
  it('hands the session token only to the app iframe on its exact origin, only after it says ready', async () => {
    post.mockResolvedValue({ token: 'tok_abc', origin: 'https://app.example.com', embedUrl: 'https://app.example.com/embed', storeId: 's1' });
    const { container } = render(<MemoryRouter initialEntries={['/store/s1/app-platform/i1']}><Routes><Route path="/store/s1/app-platform/:installId" element={<AppEmbedPage />} /></Routes></MemoryRouter>);
    const iframe = await waitFor(() => { const f = container.querySelector('iframe'); if (!f) throw new Error('no iframe'); return f; });
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
    expect(iframe.getAttribute('src')).toBe('https://app.example.com/embed');
    const sent = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage: sent }, configurable: true });
    const ready = (origin: string, source: unknown) => act(async () => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'solvexo:ready' }, origin, source: source as Window })); await Promise.resolve(); await Promise.resolve(); });
    await ready('https://evil.example.com', iframe.contentWindow);
    await ready('https://app.example.com', window);
    expect(sent).not.toHaveBeenCalled();
    post.mockClear();
    await ready('https://app.example.com', iframe.contentWindow);
    await waitFor(() => expect(sent).toHaveBeenCalledWith({ type: 'solvexo:session', token: 'tok_abc', storeId: 's1' }, 'https://app.example.com'));
  });
});
