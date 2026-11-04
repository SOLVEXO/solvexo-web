import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

const api = vi.hoisted(() => ({ apiSitePublicConfig: vi.fn() }));
vi.mock('@/api/services/siteAnalytics', async (orig) => ({ ...(await orig<typeof import('@/api/services/siteAnalytics')>()), ...api }));

import { SiteAnalyticsTracker } from './SiteAnalyticsTracker';
import { __resetSiteAnalytics, CONSENT_KEY, isTrackedPath, trackSiteEvent } from '@/utils/siteAnalytics';

const gaScripts = () => Array.from(document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'));
const events = () => (window.dataLayer ?? []).map(a => Array.from(a as ArrayLike<unknown>)).filter(a => a[0] === 'event');

function Nav({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(to)}>go {to}</button>;
}
const renderAt = (path: string, next = '/pricing') => render(
  <MemoryRouter initialEntries={[path]}>
    <SiteAnalyticsTracker />
    <Routes><Route path="*" element={<Nav to={next} />} /></Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  __resetSiteAnalytics();
  delete window.gtag;
  delete window.dataLayer;
  gaScripts().forEach(s => s.remove());
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

describe('Solvexo site analytics', () => {
  it('tracks only the public site and sign-up, never dashboards, admin or checkout', () => {
    expect(['/', '/pricing', '/products/pos', '/register', '/signup', '/onboard', '/onboard/abc', '/book-demo/'].every(isTrackedPath)).toBe(true);
    expect(['/admin', '/admin/analytics', '/store/1/dashboard', '/seller', '/pay-invoice/x', '/staff-login/1'].some(isTrackedPath)).toBe(false);
  });

  it('loads GA with the configured id and sends a page view per tracked page', async () => {
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: 'G-TEST123', consentRequired: false } });
    renderAt('/');
    await waitFor(() => expect(gaScripts()).toHaveLength(1));
    expect(gaScripts()[0].getAttribute('src')).toContain('id=G-TEST123');
    await waitFor(() => expect(events().map(e => (e[2] as { page_path: string }).page_path)).toEqual(['/']));
    fireEvent.click(screen.getByRole('button', { name: 'go /pricing' }));
    await waitFor(() => expect(events().map(e => (e[2] as { page_path: string }).page_path)).toEqual(['/', '/pricing']));
    expect(screen.queryByRole('dialog', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('does nothing on a dashboard page and when no id is configured', async () => {
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: 'G-TEST123', consentRequired: false } });
    renderAt('/store/1/dashboard', '/store/1/orders');
    await act(async () => {});
    expect(api.apiSitePublicConfig).not.toHaveBeenCalled();
    cleanup();
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: null, consentRequired: false } });
    renderAt('/pricing');
    await waitFor(() => expect(api.apiSitePublicConfig).toHaveBeenCalled());
    expect(gaScripts()).toHaveLength(0);
  });

  it('asks EU/UK visitors first: nothing loads until they accept, and a decline is remembered', async () => {
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: 'G-TEST123', consentRequired: true } });
    renderAt('/');
    const banner = await screen.findByRole('dialog', { name: 'Cookie consent' });
    expect(gaScripts()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(banner).not.toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
    expect(gaScripts()).toHaveLength(0);
    cleanup();
    localStorage.clear();
    renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(gaScripts()).toHaveLength(1));
    expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
  });

  it('sends funnel events that fired before GA finished loading', async () => {
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: 'G-TEST123', consentRequired: false } });
    trackSiteEvent('sign_up', { method: 'email' });
    renderAt('/onboard');
    await waitFor(() => expect(events().some(e => e[1] === 'sign_up')).toBe(true));
    trackSiteEvent('store_created');
    expect(events().some(e => e[1] === 'store_created')).toBe(true);
  });

  it('falls back to a VITE_GA_MEASUREMENT_ID build variable when the API has none, unless an admin switched tracking off', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-VERCEL99');
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: null, consentRequired: false, enabled: false } });
    renderAt('/');
    await waitFor(() => expect(api.apiSitePublicConfig).toHaveBeenCalled());
    expect(gaScripts()).toHaveLength(0);
    cleanup();
    __resetSiteAnalytics();
    api.apiSitePublicConfig.mockResolvedValue({ data: { measurementId: null, consentRequired: false, enabled: true } });
    renderAt('/');
    await waitFor(() => expect(gaScripts()).toHaveLength(1));
    expect(gaScripts()[0].getAttribute('src')).toContain('id=G-VERCEL99');
  });
});
