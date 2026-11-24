import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();
let role = 'seller';
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a), delete: (...a: unknown[]) => del(...a) } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import BuildAppsPage from './BuildAppsPage';
import { devAppState } from '@/api/services/developerPortal';

const app = (extra: object = {}) => ({
  id: 'a1', name: 'Reports', slug: 'reports', description: '', developerName: '', developerEmail: '', clientId: 'app_1', clientSecretHint: '...abcd',
  redirectUrls: ['https://app.example.com/cb'], requestedScopes: ['read_orders'], webhookUrl: null, webhookEvents: [], uninstallWebhookUrl: null, embedUrl: null, embedTitle: '',
  status: 'draft', listed: false, reviewStatus: 'none', reviewNote: '', submittedAt: null, installs: 1, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', ...extra,
});
let apps: unknown[] = [];
let stores: unknown[] = [];

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); del.mockReset(); role = 'seller';
  apps = [app()]; stores = [{ id: 'd1', name: 'Test shop', slug: 'test-shop-dev', currency: 'PKR', createdAt: '2026-11-20T00:00:00Z' }];
  get.mockImplementation((url: string) => Promise.resolve(url === '/api/developer/apps' ? { items: apps, max: 10 } : { items: stores, max: 3 }));
});
afterEach(cleanup);

const renderPage = () => render(<MemoryRouter initialEntries={['/store/s1/build-apps']}><Routes><Route path="/store/s1/build-apps" element={<BuildAppsPage />} /><Route path="/store/:id/dashboard" element={<h2>dashboard</h2>} /></Routes></MemoryRouter>);

describe('Build apps', () => {
  it('names each app state the way a developer reads it', () => {
    expect(devAppState({ status: 'draft', reviewStatus: 'none' }).label).toBe('Private');
    expect(devAppState({ status: 'draft', reviewStatus: 'submitted' }).label).toBe('Waiting for review');
    expect(devAppState({ status: 'draft', reviewStatus: 'rejected' }).label).toBe('Changes asked');
    expect(devAppState({ status: 'approved', reviewStatus: 'none' }).label).toBe('Listed');
    expect(devAppState({ status: 'suspended', reviewStatus: 'none' }).label).toBe('Suspended');
  });

  it('creating an app sends clean values and shows the keys once', async () => {
    post.mockResolvedValue({ id: 'a2', clientId: 'app_2', clientSecret: 'appsec_111', sessionSecret: 'appses_222' });
    renderPage();
    await screen.findAllByText('Reports');
    fireEvent.click(screen.getByRole('button', { name: 'Create app' }));
    fireEvent.change(await screen.findByLabelText('App name'), { target: { value: ' Stock sync ' } });
    fireEvent.change(screen.getByLabelText(/Redirect addresses/), { target: { value: 'https://new.example.com/cb\n\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/api/developer/apps');
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'Stock sync', redirectUrls: ['https://new.example.com/cb'], requestedScopes: ['read_orders'], webhookUrl: null, webhookEvents: [] });
    expect(await screen.findByText('app_2')).toBeTruthy();
    expect(screen.getByText('appsec_111')).toBeTruthy();
    expect(screen.getByText('appses_222')).toBeTruthy();
  });

  it('a private app can ask for a listing; a rejected one shows the review note', async () => {
    apps = [app(), app({ id: 'a3', name: 'Old app', clientId: 'app_3', reviewStatus: 'rejected', reviewNote: 'Add a privacy policy link' })];
    post.mockResolvedValue({});
    renderPage();
    expect((await screen.findAllByText('Review: Add a privacy policy link')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Changes asked').length).toBeGreaterThan(0);
    const row = screen.getAllByText('Reports')[0].closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Ask for a listing' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/api/developer/apps/a1/submit'));
  });

  it('a listed app can\'t be deleted or sent for review again', async () => {
    apps = [app({ status: 'approved', listed: true })];
    renderPage();
    expect((await screen.findAllByText('Listed')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Ask for a listing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('development stores: create shows the password once and opens the store; at the limit the button is off', async () => {
    post.mockResolvedValue({ id: 'd2', name: 'Second shop', slug: 'second-shop-dev', currency: 'PKR', password: 'amber-cedar-123' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Development stores' }));
    expect((await screen.findAllByText('Test shop')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Create development store' }));
    fireEvent.change(await screen.findByLabelText('Store name'), { target: { value: 'Second shop' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/api/developer/stores', { name: 'Second shop' }));
    expect(await screen.findByText('amber-cedar-123')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open the store' }));
    expect(await screen.findByText('dashboard')).toBeTruthy();
  });

  it('turns off "create" at the limit', async () => {
    stores = [1, 2, 3].map((n) => ({ id: `d${n}`, name: `Shop ${n}`, slug: `s${n}`, currency: 'PKR', createdAt: '2026-11-20T00:00:00Z' }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Development stores' }));
    expect(await screen.findByText(/most development stores an account can have \(3\)/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Create development store' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('staff see a note instead: apps belong to a person\'s own account', async () => {
    role = 'staff';
    renderPage();
    expect(screen.getByText('Store owners only')).toBeTruthy();
    expect(get).not.toHaveBeenCalled();
  });
});
