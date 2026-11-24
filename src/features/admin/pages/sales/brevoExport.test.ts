import { afterEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }));
vi.mock('@/api/client', () => ({ default: client }));
const download = vi.hoisted(() => vi.fn());
vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: download }));

import { apiAskMarketingConsent, apiBrevoStatus, apiBrevoSync, apiExportBrevoCsv } from '@/api/services/salesOps';

afterEach(() => vi.clearAllMocks());

describe('Brevo API calls', () => {
  it('downloads the Brevo CSV with the leads-list filters, as a blob through the signed-in client', async () => {
    const blob = new Blob(['EMAIL\n'], { type: 'text/csv' });
    client.get.mockResolvedValue(blob);
    await apiExportBrevoCsv({ consent: 'granted', source: 'website_form', q: 'sara', owner: undefined, page: 2, limit: 200 });
    expect(client.get).toHaveBeenCalledWith('/api/admin/sales/leads/export/brevo', { params: { consent: 'granted', source: 'website_form', q: 'sara' }, responseType: 'blob' });
    expect(download).toHaveBeenCalledWith(blob, expect.stringMatching(/^solvexo-leads-brevo-\d{4}-\d{2}-\d{2}\.csv$/));
  });

  it('reads wrapped and bare responses alike', async () => {
    client.get.mockResolvedValue({ success: true, data: { connected: true } });
    expect(await apiBrevoStatus()).toEqual({ connected: true });
    client.post.mockResolvedValueOnce({ queued: 1, synced: 2, failed: 0 });
    expect(await apiBrevoSync()).toEqual({ queued: 1, synced: 2, failed: 0 });
    client.post.mockResolvedValueOnce({ success: true, data: { sent: 3, skipped: 1 } });
    expect(await apiAskMarketingConsent(['a', 'b'])).toEqual({ sent: 3, skipped: 1 });
    expect(client.post).toHaveBeenLastCalledWith('/api/admin/sales/leads/consent-requests', { leadIds: ['a', 'b'] });
    client.post.mockResolvedValueOnce({ success: true, data: { sent: 1, skipped: 0, more: 0 } });
    await apiAskMarketingConsent(undefined, { stage: 'won', q: '', page: 2, limit: 200 });
    expect(client.post).toHaveBeenLastCalledWith('/api/admin/sales/leads/consent-requests', { stage: 'won' });
  });
});
