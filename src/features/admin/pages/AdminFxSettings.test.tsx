import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const cfg = vi.hoisted(() => ({
  apiGetPlatformConfig: vi.fn(), apiUpdateFxConfig: vi.fn(), apiGetAdminCurrencies: vi.fn(), apiAddCurrency: vi.fn(),
  apiEnableAllCurrencies: vi.fn(), apiRetryStripeCardPaymentSupport: vi.fn(),
}));
const fx = vi.hoisted(() => ({ apiGetCurrentRates: vi.fn(), apiGetFxHistory: vi.fn(), apiGetFxStaleness: vi.fn(), apiOverrideFxRate: vi.fn() }));
vi.mock('@/api/services/config/adminConfig', async (orig) => ({ ...(await orig<typeof import('@/api/services/config/adminConfig')>()), ...cfg }));
vi.mock('@/components/comman/bulk-import/BulkImportButton', () => ({ BulkImportButton: () => null }));
vi.mock('@/components/comman/ui/NotificationBell', () => ({ NotificationBell: () => null, default: () => null }));
vi.mock('@/api/services/exchangeRate', async (orig) => ({ ...(await orig<typeof import('@/api/services/exchangeRate')>()), ...fx }));

import { AdminFxSettings } from './AdminFxSettings';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const currencies = [
  { code: 'USD', sanityBandMin: null, sanityBandMax: null, stripeCardPaymentSupported: true },
  { code: 'PKR', sanityBandMin: 100, sanityBandMax: 500, stripeCardPaymentSupported: true },
  { code: 'AED', sanityBandMin: 1, sanityBandMax: 10, stripeCardPaymentSupported: false },
];

function mockLoad(currenciesResponse: unknown) {
  fx.apiGetCurrentRates.mockResolvedValue({ success: true, data: { PKR: { ratePerUSD: 280, effectiveFrom: new Date().toISOString(), source: 'provider' } } });
  fx.apiGetFxStaleness.mockResolvedValue({ success: true, data: { PKR: { hoursOld: 2, isStale: false } } });
  fx.apiGetFxHistory.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 15 } });
  cfg.apiGetPlatformConfig.mockResolvedValue({ success: true, data: { fxConfig: { autoRefreshEnabled: true } } });
  cfg.apiGetAdminCurrencies.mockResolvedValue(currenciesResponse);
}
const renderPage = () => render(<MemoryRouter><AdminFxSettings /></MemoryRouter>);

describe('AdminFxSettings', () => {
  it('shows the enabled currencies when the API sends them as a bare list (the crash in Settings → FX)', async () => {
    mockLoad(currencies);
    renderPage();
    expect(await screen.findByText('3 of 152 real ISO-4217 currencies enabled for checkout/settlement.')).toBeInTheDocument();
    expect(screen.getByText(/AED — no card payment/)).toBeInTheDocument();
  });

  it('shows them from the { success, data } envelope too, and reports "Enable all" either way', async () => {
    mockLoad({ success: true, data: currencies });
    cfg.apiEnableAllCurrencies.mockResolvedValue({ success: true, message: '2 currencies enabled', added: ['EUR', 'GBP'], alreadyEnabledCount: 3 });
    renderPage();
    expect(await screen.findByText('3 of 152 real ISO-4217 currencies enabled for checkout/settlement.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enable All Currencies' }));
    await waitFor(() => expect(screen.getByText(/Enabled 2 new currencies/)).toBeInTheDocument());
  });
});
