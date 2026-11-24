import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiBrevoStatus: vi.fn(), apiBrevoConnect: vi.fn(), apiBrevoDisconnect: vi.fn(), apiBrevoSync: vi.fn(), apiExportBrevoCsv: vi.fn(),
  apiAskMarketingConsent: vi.fn(), apiListLeads: vi.fn(), apiSalesOwners: vi.fn(), apiGetLead: vi.fn(), apiLeadChats: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
const perm = vi.hoisted(() => ({ manager: true }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string | string[]) => (p === 'sales.manage' ? perm.manager : true) }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({ AdminPageHeader: ({ title }: { title: string }) => <header><h1>{title}</h1></header> }));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ name: 'Bilal' }) } }));

import { BrevoTab } from './BrevoTab';
import { LeadFormModal } from './parts';
import { AdminSalesOps } from './AdminSalesOps';
import { SalesLeadDetail } from './SalesLeadDetail';

afterEach(() => { cleanup(); vi.clearAllMocks(); perm.manager = true; try { localStorage.clear(); } catch { /* jsdom */ } });

const counts = { granted: 42, synced: 38, pending: 3, failed: 1, asked: 17, withdrawn: 5 };
const off = { connected: false, accountEmail: null, keyHint: null, listId: null, listName: null, connectedAt: null, lastSyncAt: null, lastError: null, webhookUrl: 'https://api.solvexo.store/api/webhooks/brevo/abc', counts: { granted: 0, synced: 0, pending: 0, failed: 0, asked: 0, withdrawn: 0 } };
const on = { ...off, connected: true, accountEmail: 'marketing@solvexo.store', keyHint: 'xkeysib-…9f2a', listId: 7, listName: 'Solvexo leads', connectedAt: '2026-11-20T09:00:00.000Z', lastSyncAt: new Date().toISOString(), lastError: 'Invalid email: bad@@x', counts };

const lead = (over: Record<string, unknown> = {}) => ({
  _id: 'l1', name: 'Sara Malik', businessName: 'Sara Boutique', email: 'sara@example.com', phone: '03001112223', city: 'Lahore', country: null,
  businessType: 'Clothing', source: 'website_form', sourceDetail: null, stage: 'new', lostReason: null, lostNote: null, ownerAdminId: 'a1',
  ownerName: 'Atiq', dealValuePKR: null, tags: [], nextFollowUpAt: null, lastActivityAt: null, stageChangedAt: null, wonAt: null,
  sellerId: null, storeId: null, linkedAt: null, createdAt: '2026-11-01T09:00:00.000Z',
  marketingConsent: { status: 'none', at: null, source: null, note: null, askedAt: null }, brevo: { syncedAt: null, error: null, pending: false }, ...over,
});
const list = (items: ReturnType<typeof lead>[]) => ({
  data: {
    items, total: items.length, page: 1, limit: 200,
    summary: { stages: ['new', 'contacted', 'demo', 'trial', 'won', 'lost'].map(stage => ({ stage, count: 0, valuePKR: 0 })), openLeads: items.length, openValuePKR: 0, overdueFollowUps: 0, wonThisMonth: 0 },
  },
});

describe('BrevoTab', () => {
  it('connects with the API key the manager types', async () => {
    api.apiBrevoStatus.mockResolvedValue(off);
    api.apiBrevoConnect.mockResolvedValue(on);
    render(<BrevoTab isManager />);
    expect(await screen.findByText('Send leads who agreed to marketing emails to a Brevo list, and bring unsubscribes back.')).toBeInTheDocument();
    const key = screen.getByLabelText('Brevo API key');
    expect(key).toHaveAttribute('type', 'password');
    fireEvent.change(key, { target: { value: 'xkeysib-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(api.apiBrevoConnect).toHaveBeenCalledWith('xkeysib-secret'));
    expect(await screen.findByText('Solvexo leads')).toBeInTheDocument();
  });

  it('shows the Brevo API error when the key is refused', async () => {
    api.apiBrevoStatus.mockResolvedValue(off);
    api.apiBrevoConnect.mockRejectedValue(new Error('Brevo didn’t accept that API key.'));
    render(<BrevoTab isManager />);
    fireEvent.change(await screen.findByLabelText('Brevo API key'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Brevo didn’t accept that API key.');
  });

  it('shows the connection, counts and webhook URL, and copies the URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    api.apiBrevoStatus.mockResolvedValue(on);
    api.apiBrevoSync.mockResolvedValue({ queued: 0, synced: 3, failed: 0 });
    render(<BrevoTab isManager />);
    expect(await screen.findByText('marketing@solvexo.store')).toBeInTheDocument();
    expect(screen.getByText('xkeysib-…9f2a')).toBeInTheDocument();
    expect(screen.getByText(/Invalid email: bad@@x/)).toBeInTheDocument();
    const tiles = screen.getByRole('region', { name: 'Leads and Brevo' });
    for (const [label, n] of [['Agreed', '42'], ['In Brevo', '38'], ['Waiting', '3'], ['Failed', '1'], ['Asked', '17'], ['Unsubscribed', '5']]) {
      expect(within(tiles).getByText(label).nextSibling).toHaveTextContent(n);
    }
    expect(screen.getByText(/Settings → Webhooks → Marketing/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy webhook URL' }));
    expect(writeText).toHaveBeenCalledWith(on.webhookUrl);
    fireEvent.click(screen.getByRole('button', { name: /Sync now/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sent 3 to Brevo.'));
  });

  it('asks before disconnecting', async () => {
    api.apiBrevoStatus.mockResolvedValue(on);
    api.apiBrevoDisconnect.mockResolvedValue(off);
    render(<BrevoTab isManager />);
    fireEvent.click(await screen.findByRole('button', { name: /Disconnect/ }));
    expect(api.apiBrevoDisconnect).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disconnect' }));
    await waitFor(() => expect(api.apiBrevoDisconnect).toHaveBeenCalled());
    expect(await screen.findByText('Not connected')).toBeInTheDocument();
  });

  it('lets view-only staff see the status but no buttons', async () => {
    api.apiBrevoStatus.mockResolvedValue(on);
    const { unmount } = render(<BrevoTab isManager={false} />);
    expect(await screen.findByText('marketing@solvexo.store')).toBeInTheDocument();
    expect(screen.getByText(on.webhookUrl)).toBeInTheDocument();
    for (const name of [/Sync now/, /Export for Brevo/, /Disconnect/]) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    unmount();
    api.apiBrevoStatus.mockResolvedValue(off);
    render(<BrevoTab isManager={false} />);
    expect(await screen.findByText(/Ask a sales manager to connect Brevo/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Brevo API key')).not.toBeInTheDocument();
  });
});

describe('Lead form: marketing consent', () => {
  it('needs a note when someone switches consent on by hand', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MemoryRouter><LeadFormModal lead={lead() as never} owners={[]} canAssign={false} onClose={vi.fn()} onSave={onSave} /></MemoryRouter>);
    expect(screen.queryByLabelText('Where and when did they agree? *')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Agreed to marketing emails' }));
    const note = await screen.findByLabelText('Where and when did they agree? *');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Say where and when the lead agreed');
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(note, { target: { value: 'Asked on call 24 Nov' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ marketingConsent: true, marketingConsentNote: 'Asked on call 24 Nov' })));
  });

  it('sends nothing about consent when it did not change, and false when an agreed lead is switched off', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const agreed = lead({ marketingConsent: { status: 'granted', at: '2026-11-24T10:00:00.000Z', source: 'demo_form', note: null, askedAt: null } });
    render(<MemoryRouter><LeadFormModal lead={agreed as never} owners={[]} canAssign={false} onClose={vi.fn()} onSave={onSave} /></MemoryRouter>);
    expect(screen.getByText('Agreed on the Book a demo form, 24 Nov 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('marketingConsent');
    cleanup();
    render(<MemoryRouter><LeadFormModal lead={agreed as never} owners={[]} canAssign={false} onClose={vi.fn()} onSave={onSave} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('switch', { name: 'Agreed to marketing emails' }));
    expect(screen.queryByLabelText('Where and when did they agree? *')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1][0]).toMatchObject({ marketingConsent: false });
    expect(onSave.mock.calls[1][0]).not.toHaveProperty('marketingConsentNote');
  });
});

describe('Lead detail: consent and Brevo', () => {
  it('says in plain words when and where they agreed, and how the Brevo sync went', async () => {
    api.apiGetLead.mockResolvedValue({ data: { lead: lead({
      marketingConsent: { status: 'granted', at: '2026-11-24T10:00:00.000Z', source: 'demo_form', note: null, askedAt: null },
      brevo: { syncedAt: null, error: 'Contact already blocklisted', pending: false },
    }), activities: [], tasks: [], merchant: null } });
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiLeadChats.mockResolvedValue({ data: [] });
    render(<MemoryRouter initialEntries={['/admin/sales/leads/l1']}><Routes><Route path="/admin/sales/leads/:id" element={<SalesLeadDetail />} /></Routes></MemoryRouter>);
    const card = await screen.findByRole('region', { name: 'Marketing emails' });
    expect(within(card).getByText('Agreed on the Book a demo form, 24 Nov 2026')).toBeInTheDocument();
    expect(within(card).getByText('Sync failed: Contact already blocklisted')).toBeInTheDocument();
  });
});

describe('Pipeline: consent filter, Brevo export, permission emails', () => {
  const renderList = () => {
    localStorage.setItem('solvexo:sales:view', 'list');
    return render(<MemoryRouter initialEntries={['/admin/sales']}><Routes><Route path="/admin/sales" element={<AdminSalesOps />} /></Routes></MemoryRouter>);
  };

  it('filters by consent and exports the same filters for Brevo', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiListLeads.mockResolvedValue(list([lead({ marketingConsent: { status: 'granted', at: null, source: 'manual', note: 'x', askedAt: null } })]));
    api.apiExportBrevoCsv.mockResolvedValue(undefined);
    renderList();
    expect(await screen.findByText('Agreed', { selector: 'td *' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Marketing emails'), { target: { value: 'granted' } });
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'website_form' } });
    await waitFor(() => expect(api.apiListLeads).toHaveBeenLastCalledWith(expect.objectContaining({ consent: 'granted', source: 'website_form' })));
    fireEvent.click(screen.getByRole('button', { name: /Export for Brevo/ }));
    await waitFor(() => expect(api.apiExportBrevoCsv).toHaveBeenCalledWith(expect.objectContaining({ consent: 'granted', source: 'website_form' })));
  });

  it('asks the selected leads for permission and shows what was sent', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiListLeads.mockResolvedValue(list([lead(), lead({ _id: 'l2', name: 'Bilal Khan', email: null }), lead({ _id: 'l3', name: 'Hina Shah' })]));
    api.apiAskMarketingConsent.mockResolvedValue({ sent: 1, skipped: 1 });
    renderList();
    fireEvent.click(await screen.findByLabelText('Select Sara Malik'));
    fireEvent.click(screen.getByLabelText('Select Bilal Khan'));
    fireEvent.click(screen.getByRole('button', { name: /Ask for permission \(2\)/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Can we keep you posted\?/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2 selected leads, about 1 can be asked/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send permission email' }));
    await waitFor(() => expect(api.apiAskMarketingConsent).toHaveBeenCalledWith(['l1', 'l2']));
    expect(await within(dialog).findByText('Sent to 1 lead.')).toBeInTheDocument();
    expect(within(dialog).getByText(/Skipped 1/)).toBeInTheDocument();
  });

  it('asks every filtered lead when none are selected', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiListLeads.mockResolvedValue(list([lead(), lead({ _id: 'l3', name: 'Hina Shah' })]));
    api.apiAskMarketingConsent.mockResolvedValue({ sent: 2, skipped: 0 });
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Ask for permission' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send permission email' }));
    await waitFor(() => expect(api.apiAskMarketingConsent).toHaveBeenCalledWith(['l1', 'l3']));
    expect(await within(dialog).findByText('Sent to 2 leads.')).toBeInTheDocument();
  });

  it('hides the marketing actions from reps without sales.manage', async () => {
    perm.manager = false;
    api.apiListLeads.mockResolvedValue(list([lead()]));
    renderList();
    expect(await screen.findByText('Sara Malik')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ask for permission/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export for Brevo/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Select Sara Malik')).not.toBeInTheDocument();
  });
});
