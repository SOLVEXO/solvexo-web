import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiSiteSettings: vi.fn(), apiSaveSiteSettings: vi.fn(), apiSiteOverview: vi.fn(), apiSiteAcquisition: vi.fn(),
  apiSiteContent: vi.fn(), apiSiteRealtime: vi.fn(), apiSiteFunnel: vi.fn(),
}));
vi.mock('@/api/services/siteAnalytics', async (orig) => ({ ...(await orig<typeof import('@/api/services/siteAnalytics')>()), ...api }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({ AdminPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { AdminVisitors } from './AdminVisitors';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const ga4 = (connected: boolean, over: Record<string, unknown> = {}) => ({ connected, source: connected ? 'google_sign_in' : null, status: connected ? 'connected' : null, propertyId: connected ? 'properties/42' : null, lastError: null, ok: connected ? true : null, serviceAccountEmail: null, ...over });
const noEnv = { measurementIdVariable: null, propertyIdVariable: null, serviceAccountVariable: null, problems: [] as string[] };
const settings = (over: Record<string, unknown>) => ({ data: { measurementId: null, measurementIdSource: null, enabled: true, ga4: ga4(false), env: noEnv, detectedMeasurementId: null, ...over } });
const metric = (value: number, previous: number, change: number | null) => ({ value, previous, change });
const reports = () => {
  api.apiSiteOverview.mockResolvedValue({ data: {
    range: '28d',
    series: [{ date: '2026-11-02', users: 40, newUsers: 30, sessions: 50, pageViews: 120 }, { date: '2026-11-03', users: 60, newUsers: 40, sessions: 70, pageViews: 160 }],
    totals: { users: metric(1234, 1000, 23.4), newUsers: metric(900, 800, 12.5), sessions: metric(1500, 1600, -6.3), pageViews: metric(4200, 4000, 5), avgSessionSeconds: metric(95, 80, 18.8), engagementRate: metric(0.62, 0.55, 12.7) },
  } });
  api.apiSiteAcquisition.mockResolvedValue({ data: { range: '28d', channels: [{ channel: 'Organic Search', sessions: 800, users: 700, engagementRate: 0.7 }], sources: [{ source: 'google', medium: 'organic', sessions: 800, users: 700 }], campaigns: [] } });
  api.apiSiteContent.mockResolvedValue({ data: { range: '28d', pages: [{ path: '/pricing', views: 900, users: 500 }], landingPages: [], countries: [{ country: 'Pakistan', users: 1000, sessions: 1200 }], cities: [{ city: 'Lahore', country: 'Pakistan', users: 400 }], devices: [{ device: 'mobile', users: 800, sessions: 900 }, { device: 'desktop', users: 200, sessions: 300 }] } });
  api.apiSiteRealtime.mockResolvedValue({ data: { activeUsers: 7, pages: [{ title: 'Pricing', users: 3 }], countries: [{ country: 'Pakistan', users: 6 }] } });
  api.apiSiteFunnel.mockResolvedValue({ data: { range: '28d', steps: [
    { key: 'visited', label: 'Visited the site', users: 1234, fromPrevious: null, fromStart: null },
    { key: 'pricing', label: 'Viewed pricing', users: 400, fromPrevious: 32.4, fromStart: 32.4 },
    { key: 'sign_up_start', label: 'Started sign-up', users: 80, fromPrevious: 20, fromStart: 6.5 },
    { key: 'sign_up', label: 'Created an account', users: 50, fromPrevious: 62.5, fromStart: 4.1 },
    { key: 'store_created', label: 'Created a store', users: 30, fromPrevious: 60, fromStart: 2.4 },
  ] } });
};
const renderPage = () => render(<MemoryRouter><AdminVisitors /></MemoryRouter>);

describe('AdminVisitors', () => {
  it('walks a new admin through setup: saves the measurement id (or uses the detected one) and explains connecting reports', async () => {
    api.apiSiteSettings.mockResolvedValue(settings({}));
    api.apiSaveSiteSettings.mockResolvedValue(settings({ measurementId: 'G-ABC12345', measurementIdSource: 'settings' }));
    renderPage();
    expect(await screen.findByText('Connect Google Analytics to see reports')).toBeInTheDocument();
    expect(screen.getByText('Tracking not set up')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Measurement ID'), { target: { value: 'g-abc12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiSaveSiteSettings).toHaveBeenCalledWith({ measurementId: 'G-ABC12345', enabled: true }));
    expect(await screen.findByText('Tracking on (G-ABC12345)')).toBeInTheDocument();
    expect(api.apiSiteOverview).not.toHaveBeenCalled();
  });

  it('shows visitors, live count, funnel, sources and locations, and reloads for another range', async () => {
    api.apiSiteSettings.mockResolvedValue(settings({ measurementId: 'G-ABC12345', measurementIdSource: 'settings', ga4: ga4(true) }));
    reports();
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Visitors right now')).toHaveTextContent('7'));
    expect(await screen.findByText('+23.4%')).toBeInTheDocument();
    expect(screen.getByText('-6.3%')).toBeInTheDocument();
    expect(await screen.findByText('5. Created a store')).toBeInTheDocument();
    expect(screen.getByText('Organic Search')).toBeInTheDocument();
    expect(await screen.findByText('Lahore, Pakistan')).toBeInTheDocument();
    expect(screen.getByText('/pricing')).toBeInTheDocument();
    expect(api.apiSiteOverview).toHaveBeenCalledWith('28d');
    fireEvent.click(screen.getByRole('radio', { name: '7 days' }));
    await waitFor(() => expect(api.apiSiteOverview).toHaveBeenCalledWith('7d'));
    expect(api.apiSiteFunnel).toHaveBeenCalledWith('7d');
  });

  it('shows a report error with a retry, without breaking the other sections', async () => {
    api.apiSiteSettings.mockResolvedValue(settings({ measurementId: 'G-ABC12345', measurementIdSource: 'settings', ga4: ga4(true) }));
    reports();
    api.apiSiteAcquisition.mockRejectedValueOnce(new Error('Google Analytics refused access. Reconnect it in Super Admin → SEO → Integrations.'));
    renderPage();
    expect(await screen.findByText(/Google Analytics refused access/)).toBeInTheDocument();
    expect(await screen.findByText('Lahore, Pakistan')).toBeInTheDocument();
  });

  it('uses server variables: shows where the id and the reports come from, and what Google said is wrong', async () => {
    api.apiSiteSettings.mockResolvedValue(settings({
      measurementId: 'G-ENV12345', measurementIdSource: 'env:GA_MEASUREMENT_ID',
      ga4: ga4(false, { source: 'service_account', status: 'error', ok: false, propertyId: 'properties/412', serviceAccountEmail: 'ga@solvexo.iam.gserviceaccount.com',
        lastError: 'Google Analytics refused access to properties/412 for ga@solvexo.iam.gserviceaccount.com. In Google Analytics → Admin → Property access management, add that email with the Viewer role.' }),
      env: { ...noEnv, measurementIdVariable: 'GA_MEASUREMENT_ID', serviceAccountVariable: 'GA4_SERVICE_ACCOUNT_JSON', problems: ['GA4_PROPERTY_ID should be a GA4 property ID, a number like 123456789'] },
    }));
    renderPage();
    expect(await screen.findByText("Google Analytics isn't working yet")).toBeInTheDocument();
    expect(api.apiSiteSettings).toHaveBeenCalledWith(true);
    expect(screen.getByText(/add that email with the Viewer role/)).toBeInTheDocument();
    expect(screen.getByText(/GA4_PROPERTY_ID should be a GA4 property ID/)).toBeInTheDocument();
    expect(screen.getByText('Tracking on (G-ENV12345, from GA_MEASUREMENT_ID)')).toBeInTheDocument();
    expect(screen.getByText('Reports failing (see below)')).toBeInTheDocument();
    expect(screen.queryByText('Connect Google Analytics to see reports')).not.toBeInTheDocument();
    expect(api.apiSiteOverview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    await waitFor(() => expect(api.apiSiteSettings).toHaveBeenCalledTimes(2));
  });
});
