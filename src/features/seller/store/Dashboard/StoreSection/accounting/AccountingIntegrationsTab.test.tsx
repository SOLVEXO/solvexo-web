import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
let perms: Record<string, boolean> = {};
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), put: (...a: unknown[]) => put(...a), patch: vi.fn() } }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string) => perms[p] ?? false }));
const toastError = vi.fn();
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: toastError }) }));

import { IntegrationsTab } from './AccountingIntegrationsTab';

const props = { storeId: 's1', exponent: 2, currency: 'PKR', tick: 0, refresh: vi.fn() };
const notConnected = [{ app: 'odoo', connected: false, connection: null, log: { sent: 0, failed: 0 } }, { app: 'erpnext', connected: false, connection: null, log: { sent: 0, failed: 0 } }];
const odooConn = { app: 'odoo', baseUrl: 'https://acme.odoo.com', database: 'acme', login: 'a@acme.com', company: null, journalCode: 'MISC', secretHint: '••••KEY', mode: 'detail', enabled: true, cursorSeq: 10, cursorDay: null, lastSyncAt: null, lastCheck: { at: '2026-11-23', ok: false, message: 'Give these accounts their Odoo account code: 6100 Rent.' } };

function route(map: Record<string, unknown>) {
  get.mockImplementation((url: string) => {
    const hit = Object.keys(map).find(k => url.includes(k));
    return hit ? Promise.resolve(map[hit]) : Promise.reject(new Error(`unexpected ${url}`));
  });
}
beforeEach(() => { get.mockReset(); post.mockReset(); put.mockReset(); toastError.mockReset(); perms = { 'accounting.view': true, 'accounting.manage': true }; });
afterEach(cleanup);

describe('Integrations tab', () => {
  it('downloads the Tally file for the period with one voucher per day by default', async () => {
    route({ '/integrations?': notConnected, '/integrations/tally': new Blob(['<ENVELOPE/>']) });
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    render(<IntegrationsTab {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Download for Tally/ }));
    await vi.waitFor(() => expect(get.mock.calls.some(c => String(c[0]).includes('/api/accounting/s1/integrations/tally?') && String(c[0]).includes('mode=summary'))).toBe(true));
  });

  it('connects Odoo: sends the settings and the key, starting from now by default', async () => {
    route({ '/integrations?': notConnected });
    put.mockResolvedValue({ lastCheck: { ok: true, message: 'Signed in to Odoo' } });
    render(<IntegrationsTab {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Connect Odoo' }));
    const dialog = screen.getByRole('dialog');
    const save = within(dialog).getByRole('button', { name: 'Save and test' }) as HTMLButtonElement;
    fireEvent.change(within(dialog).getByLabelText('Odoo address'), { target: { value: 'https://acme.odoo.com' } });
    fireEvent.change(within(dialog).getByLabelText('Database'), { target: { value: 'acme' } });
    fireEvent.change(within(dialog).getByLabelText('Login (e-mail)'), { target: { value: 'a@acme.com' } });
    expect(save.disabled).toBe(true); // the key is still missing
    fireEvent.change(within(dialog).getByLabelText('API key'), { target: { value: 'SECRET' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await vi.waitFor(() => expect(put).toHaveBeenCalledWith('/api/accounting/s1/integrations/odoo', { baseUrl: 'https://acme.odoo.com', database: 'acme', login: 'a@acme.com', journalCode: 'MISC', mode: 'detail', secret: 'SECRET', from: 'now' }));
  });

  it('a failed test after saving is shown in the dialog', async () => {
    route({ '/integrations?': notConnected });
    put.mockResolvedValue({ lastCheck: { ok: false, message: 'Odoo refused the login or API key.' } });
    render(<IntegrationsTab {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Connect ERPNext' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('ERPNext address'), { target: { value: 'https://erp.acme.com' } });
    fireEvent.change(within(dialog).getByLabelText('Company'), { target: { value: 'ACME Ltd' } });
    fireEvent.change(within(dialog).getByLabelText('API key'), { target: { value: 'k' } });
    fireEvent.change(within(dialog).getByLabelText('API secret'), { target: { value: 's' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save and test' }));
    expect(await within(dialog).findByText(/Saved, but the test failed: Odoo refused/)).toBeTruthy();
    expect(put).toHaveBeenCalledWith('/api/accounting/s1/integrations/erpnext', expect.objectContaining({ company: 'ACME Ltd', apiKey: 'k', apiSecret: 's' }));
  });

  it('a connected app shows its state, the problem to fix and the sync log with retry', async () => {
    route({
      '/integrations?': [{ app: 'odoo', connected: true, connection: odooConn, log: { sent: 40, failed: 2 } }, notConnected[1]],
      '/integrations/odoo/log': { items: [{ _id: 'l1', itemKey: 'entry:41', status: 'failed', attempts: 3, externalId: null, error: 'Give these accounts their Odoo account code: 6100 Rent.', label: 'Expense: rent', amountMinor: 3000000, lastTriedAt: '2026-11-23' }], total: 1 },
    });
    post.mockResolvedValue({});
    render(<IntegrationsTab {...props} />);
    expect(await screen.findByText('Needs attention')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('6100 Rent');
    fireEvent.click(screen.getByRole('button', { name: 'Sync log' }));
    const dialog = await screen.findByRole('dialog');
    expect((await within(dialog).findAllByText('Entry #41')).length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Retry' })[0]);
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith('/api/accounting/s1/integrations/odoo/log/entry%3A41/retry', {}));
  });

  it('view-only staff see the state but cannot connect or sync', async () => {
    perms = { 'accounting.view': true };
    route({ '/integrations?': [{ app: 'odoo', connected: true, connection: { ...odooConn, lastCheck: { at: 'x', ok: true, message: 'ok' } }, log: { sent: 1, failed: 0 } }, notConnected[1]] });
    render(<IntegrationsTab {...props} />);
    expect(await screen.findByText('Connected')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Sync now/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Connect ERPNext' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sync log' })).toBeTruthy();
  });
});
