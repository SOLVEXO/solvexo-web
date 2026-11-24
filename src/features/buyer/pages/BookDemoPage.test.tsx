import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SiteLangContext } from '@/i18n/site/siteLangContext';

const api = vi.hoisted(() => ({ apiDemoRequest: vi.fn(), apiSubmitContact: vi.fn() }));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), apiDemoRequest: api.apiDemoRequest }));
vi.mock('@/api/services/contact', async (orig) => ({ ...(await orig<typeof import('@/api/services/contact')>()), apiSubmitContact: api.apiSubmitContact }));
vi.mock('@/hooks/auth/useSellEntry', () => ({ useSellEntry: () => ({ go: vi.fn(), loading: false }) }));
vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));

// The marketing page's reveal animations watch scrolling; jsdom has no IntersectionObserver.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;
// Contact Us's magnetic button checks for a fine pointer; jsdom has no matchMedia.
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;

import { BookDemoPage } from './BookDemoPage';
import { ContactUsPage } from './ContactUsPage';

afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear(); });

const OPT_IN = 'Email me Solvexo tips and offers. I can unsubscribe any time.';
const inLang = (lang: 'en' | 'ar', ui: ReactNode) => render(
  <SiteLangContext.Provider value={{ lang, pageLang: lang, setLang: () => undefined }}><MemoryRouter>{ui}</MemoryRouter></SiteLangContext.Provider>,
);

describe('BookDemoPage marketing opt-in', () => {
  const fill = () => {
    fireEvent.change(screen.getByLabelText('Your name *'), { target: { value: 'Sara Malik' } });
    fireEvent.change(screen.getByLabelText('Phone / WhatsApp *'), { target: { value: '0300 1112223' } });
  };

  it('is unticked by default and sends nothing about marketing unless ticked', async () => {
    api.apiDemoRequest.mockResolvedValue({ success: true, message: 'Thanks' });
    inLang('en', <BookDemoPage />);
    expect(screen.getByLabelText(OPT_IN)).not.toBeChecked();
    fill();
    fireEvent.click(screen.getByRole('button', { name: /Book my demo/ }));
    await waitFor(() => expect(api.apiDemoRequest).toHaveBeenCalled());
    expect(api.apiDemoRequest.mock.calls[0][0]).not.toHaveProperty('marketingOptIn');
  });

  it('sends marketingOptIn when the visitor ticks it', async () => {
    api.apiDemoRequest.mockResolvedValue({ success: true, message: 'Thanks' });
    inLang('en', <BookDemoPage />);
    fill();
    fireEvent.click(screen.getByLabelText(OPT_IN));
    fireEvent.click(screen.getByRole('button', { name: /Book my demo/ }));
    await waitFor(() => expect(api.apiDemoRequest).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sara Malik', marketingOptIn: true })));
    expect(await screen.findByText('Request received')).toBeInTheDocument();
  });

  it('shows the opt-in in Arabic on the Arabic site', () => {
    inLang('ar', <BookDemoPage />);
    expect(screen.getByLabelText(/يمكنني إلغاء الاشتراك في أي وقت/)).not.toBeChecked();
  });
});

describe('ContactUsPage marketing opt-in', () => {
  it('sends marketingOptIn only when ticked', async () => {
    api.apiSubmitContact.mockResolvedValue({ success: true, message: 'ok' });
    inLang('en', <ContactUsPage />);
    expect(screen.getByLabelText(OPT_IN)).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sara' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'sara@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText(OPT_IN));
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }));
    await waitFor(() => expect(api.apiSubmitContact).toHaveBeenCalledWith(expect.objectContaining({ email: 'sara@example.com', marketingOptIn: true })));
  });
});
