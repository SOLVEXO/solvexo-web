import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiBrowsePlatformPlans: vi.fn(), apiGetPublicTrialSettings: vi.fn(), apiChatConfig: vi.fn(), apiDemoRequest: vi.fn(),
}));
vi.mock('@/api/services/platformPlans', async (orig) => ({ ...(await orig<typeof import('@/api/services/platformPlans')>()), apiBrowsePlatformPlans: api.apiBrowsePlatformPlans, apiGetPublicTrialSettings: api.apiGetPublicTrialSettings }));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), apiChatConfig: api.apiChatConfig, apiDemoRequest: api.apiDemoRequest }));
vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));

import { StartPage } from './StartPage';
import { whatsappHref } from '@/utils/whatsapp';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const plan = (name: string, m: number, was: number) => ({
  _id: name, name, monthlyPriceUSD: m, yearlyPriceUSD: m * 10, compareAtMonthlyPriceUSD: was, isFree: false, isCustomPricing: false,
  introOfferEnabled: true, introPriceUSD: 1, introDurationCycles: 3, limits: {},
});
const renderAt = (url: string) => render(<MemoryRouter initialEntries={[url]}><StartPage /></MemoryRouter>);

describe('ad landing page', () => {
  it('turns a Pakistani or international number into a wa.me link', () => {
    expect(whatsappHref('0300 1234567', 'Hi')).toBe('https://wa.me/923001234567?text=Hi');
    expect(whatsappHref('+92 300 1234567', 'Hi there')).toBe('https://wa.me/923001234567?text=Hi%20there');
    expect(whatsappHref('', 'Hi')).toBeNull();
  });

  it('shows the cheapest plan, the WhatsApp button when connected, and sends a call-back request with the ad tags', async () => {
    api.apiBrowsePlatformPlans.mockResolvedValue({ data: [plan('Grow', 29, 49), plan('Basic', 6, 10)] });
    api.apiGetPublicTrialSettings.mockResolvedValue({ data: { enabled: true, durationDays: 7 } });
    api.apiChatConfig.mockResolvedValue({ data: { enabled: false, agentName: 'Sana', greeting: '', whatsappNumber: '+92 300 1234567' } });
    api.apiDemoRequest.mockResolvedValue({ success: true, message: 'ok' });
    renderAt('/start?utm_source=fb&utm_medium=paid&utm_campaign=launch');

    expect(await screen.findByText('US$6')).toBeInTheDocument();
    expect(screen.getByText('40% off')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /WhatsApp/ })[0]).toHaveAttribute('href', expect.stringContaining('https://wa.me/923001234567?text='));

    fireEvent.click(screen.getByRole('button', { name: /Call me back/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your name.');
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Bilal Ahmed' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '0321 7654321' } });
    fireEvent.click(screen.getByRole('button', { name: /Call me back/ }));
    await waitFor(() => expect(api.apiDemoRequest).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Bilal Ahmed', phone: '0321 7654321', page: '/start', utmSource: 'fb', utmMedium: 'paid', utmCampaign: 'launch',
    })));
    expect(await screen.findByText('Thank you, Bilal.')).toBeInTheDocument();
  });

  it('hides the WhatsApp button until Solvexo WhatsApp is connected', async () => {
    api.apiBrowsePlatformPlans.mockResolvedValue({ data: [] });
    api.apiGetPublicTrialSettings.mockResolvedValue({ data: { enabled: true, durationDays: 7 } });
    api.apiChatConfig.mockResolvedValue({ data: { enabled: false, agentName: 'Sana', greeting: '', whatsappNumber: null } });
    renderAt('/start');
    expect((await screen.findAllByRole('button', { name: /Start free/ })).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull();
  });
});
