import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import type { StorefrontColors, BrandKit } from '@/api/services/storeTheme';

const api = vi.hoisted(() => ({
  apiGetBrandKit: vi.fn(),
  apiSaveBrandKit: vi.fn(),
  apiSetBrandKitLocked: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));

vi.mock('@/api/services/storeTheme', async importOriginal => ({ ...(await importOriginal<typeof import('@/api/services/storeTheme')>()), ...api }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { BrandKitCard } from './BrandKitCard';

const current = { primaryColor: '#D97757', accentColor: '#B95A3A', bgColor: '#FAF9F5', textColor: '#2C2A28' } as StorefrontColors;
const SAVED: BrandKit = { primaryColor: '#e20303', accentColor: '#e20303', bgColor: null, textColor: null, saleColor: null, locked: true };

async function mount(opts: { kit?: BrandKit | null; showAccent?: boolean } = {}) {
  api.apiGetBrandKit.mockResolvedValue({ data: opts.kit ?? null });
  api.apiSaveBrandKit.mockResolvedValue({ data: {} });
  api.apiSetBrandKitLocked.mockResolvedValue({ data: { locked: true } });
  const onApply = vi.fn();
  render(<BrandKitCard storeId="store-1" installedThemeId="inst-1" current={current} showAccent={opts.showAccent ?? false} onApply={onApply} />);
  await screen.findByText('Brand colours');
  return { onApply };
}
const applyBtn = () => screen.getByRole('button', { name: 'Apply to my store' }) as HTMLButtonElement;
const open = () => fireEvent.click(screen.getByRole('button', { name: /Brand colours/i }));

beforeEach(() => { cleanup(); vi.clearAllMocks(); });

describe('BrandKitCard', () => {
  it('is a closed dropdown by default and opens on click', async () => {
    await mount();
    expect(screen.queryByRole('button', { name: 'Apply to my store' })).toBeNull();
    expect(screen.getByRole('button', { name: /Brand colours/i }).getAttribute('aria-expanded')).toBe('false');
    open();
    expect(applyBtn()).toBeTruthy();
  });

  it('explains that nothing changes until Apply, and that it only affects this store', async () => {
    await mount();
    open();
    expect(screen.getByText(/Nothing changes in your store until you press/i)).toBeTruthy();
    expect(screen.getByText(/only this store, never other stores/i)).toBeTruthy();
  });

  it('shows the saved kit\'s colours as dots on the closed header', async () => {
    await mount({ kit: SAVED });
    const header = screen.getByRole('button', { name: /Brand colours/i });
    expect(header.querySelectorAll('span[style*="background"]').length).toBeGreaterThan(0);
  });

  it('hides "Second colour" for a theme without one, shows it for a theme that has one', async () => {
    await mount({ showAccent: false });
    open();
    expect(screen.queryByText(/Second colour/i)).toBeNull();
    cleanup();
    await mount({ showAccent: true });
    open();
    expect(screen.getByText(/Second colour/i)).toBeTruthy();
  });

  it('Apply saves the kit (accent follows main when the theme has no accent) and pushes the colours into the live preview draft', async () => {
    const { onApply } = await mount({ showAccent: false });
    open();
    const main = screen.getAllByPlaceholderText('#000000')[0];
    fireEvent.change(main, { target: { value: '#e20303' } });
    fireEvent.click(applyBtn());
    await waitFor(() => expect(api.apiSaveBrandKit).toHaveBeenCalledTimes(1));
    expect(api.apiSaveBrandKit).toHaveBeenCalledWith('store-1', { primaryColor: '#e20303', accentColor: '#e20303', bgColor: null, textColor: null, saleColor: null, locked: true }, 'inst-1');
    await waitFor(() => expect(onApply).toHaveBeenCalledWith({ primaryColor: '#e20303', accentColor: '#e20303' }));
    expect(toast.success).toHaveBeenCalled();
  });

  it('includes optional bg/text/sale only when the seller filled them in', async () => {
    const { onApply } = await mount();
    open();
    const fields = screen.getAllByPlaceholderText('#000000'); // main, bg, text, sale
    fireEvent.change(fields[0], { target: { value: '#112233' } });
    fireEvent.change(fields[1], { target: { value: '#ffffff' } });
    fireEvent.click(applyBtn());
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(onApply).toHaveBeenCalledWith({ primaryColor: '#112233', accentColor: '#112233', bgColor: '#ffffff' });
  });

  it('refuses to apply an invalid colour and never calls the API', async () => {
    await mount();
    open();
    fireEvent.change(screen.getAllByPlaceholderText('#000000')[0], { target: { value: 'red' } });
    const apply = applyBtn();
    expect(apply.disabled).toBe(true);
    fireEvent.click(apply);
    expect(api.apiSaveBrandKit).not.toHaveBeenCalled();
  });

  it('warns when the main colour is too close to the page background, and reassures when it stands out', async () => {
    await mount();
    open();
    fireEvent.change(screen.getAllByPlaceholderText('#000000')[0], { target: { value: '#faf9f4' } });
    expect(screen.getByText(/too close to the page background/i)).toBeTruthy();
    fireEvent.change(screen.getAllByPlaceholderText('#000000')[0], { target: { value: '#e20303' } });
    expect(screen.getByText(/Buttons stand out well/i)).toBeTruthy();
  });

  it('toggling the lock saves immediately once a kit exists, and does not touch the colours', async () => {
    await mount({ kit: SAVED });
    open();
    fireEvent.click(screen.getByRole('button', { name: /Keep my brand colours when I change theme/i }));
    await waitFor(() => expect(api.apiSetBrandKitLocked).toHaveBeenCalledWith('store-1', false));
    expect(api.apiSaveBrandKit).not.toHaveBeenCalled();
  });

  it('toggling the lock BEFORE the first Apply makes no API call (it is saved together with the colours)', async () => {
    await mount();
    open();
    fireEvent.click(screen.getByRole('button', { name: /Keep my brand colours when I change theme/i }));
    expect(api.apiSetBrandKitLocked).not.toHaveBeenCalled();
    fireEvent.click(applyBtn());
    await waitFor(() => expect(api.apiSaveBrandKit).toHaveBeenCalled());
    expect(api.apiSaveBrandKit.mock.calls[0][1].locked).toBe(false);
  });

  it('puts the lock back and shows an error if saving the lock fails', async () => {
    await mount({ kit: SAVED });
    api.apiSetBrandKitLocked.mockRejectedValueOnce(new Error('Network down'));
    open();
    fireEvent.click(screen.getByRole('button', { name: /Keep my brand colours when I change theme/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Network down'));
    expect(screen.getByRole('button', { name: /Keep my brand colours when I change theme/i }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows an error toast and does not push colours to the preview when Apply fails', async () => {
    const { onApply } = await mount();
    api.apiSaveBrandKit.mockRejectedValueOnce(new Error('Forbidden'));
    open();
    fireEvent.click(applyBtn());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Forbidden'));
    expect(onApply).not.toHaveBeenCalled();
  });
});
