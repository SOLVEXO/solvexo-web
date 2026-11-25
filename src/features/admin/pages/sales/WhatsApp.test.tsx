import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { dropdown, chooseValue } from '@/components/comman/ui/dropdownTesting';

const api = vi.hoisted(() => ({
  apiWaConnection: vi.fn(), apiWaMyTemplates: vi.fn(async (): Promise<unknown> => ({ data: [] })), apiWaConnect: vi.fn(), apiWaDisconnect: vi.fn(), apiWaConversations: vi.fn(), apiWaConversation: vi.fn(),
  apiWaSend: vi.fn(), apiWaSendTemplate: vi.fn(), apiWaSaveTemplates: vi.fn(), apiWaRedraft: vi.fn(), apiWaDiscardDraft: vi.fn(),
  apiWaSetStatus: vi.fn(), apiWaAssign: vi.fn(), apiWaStart: vi.fn(), apiWaQuickReplies: vi.fn(), apiWaSaveQuickReplies: vi.fn(),
  apiSalesOwners: vi.fn(), apiMyMessaging: vi.fn(), apiGetLead: vi.fn(), apiChangeStage: vi.fn(), apiUpdateLead: vi.fn(),
  apiCreateTask: vi.fn(), apiLogActivity: vi.fn(), apiListLeads: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { WhatsAppTab } from './WhatsAppTab';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const tplEn = { key: 'sales_follow_up:en', label: 'Follow-up (English)', name: 'sales_follow_up', lang: 'en', usesName: true, body: 'Hi {{1}}, following up from Solvexo.' };
const tplUr = { key: 'sales_follow_up:ur', label: 'Follow-up (Urdu)', name: 'sales_follow_up', lang: 'ur', usesName: true, body: 'السلام علیکم {{1}}' };
const conn = { connected: true, phoneNumberId: '123', wabaId: 'w', displayNumber: '+92 300 0000000', verifiedName: 'Solvexo', tokenHint: 'EAAG…3456', templateName: 'sales_follow_up', templateLang: 'en', templateUsesName: true, templates: [tplEn], connectedAt: '', lastEventAt: new Date().toISOString(), webhookUrl: 'https://api.solvexo.store/webhooks/whatsapp', aiDrafts: true };
const row = { _id: 'c1', waId: '923001112223', name: 'Sara Malik', businessName: 'Sara Boutique', leadId: 'l1', stage: 'new', unread: 2, lastMessageAt: new Date().toISOString(), lastMessageText: 'COD hai?', windowOpen: true, hasDraft: true };
const convo = (over: Record<string, unknown> = {}) => ({
  _id: 'c1', waId: '923001112223', profileName: 'Sara', lead: { _id: 'l1', name: 'Sara Malik', businessName: 'Sara Boutique', stage: 'new', city: 'Lahore' },
  windowOpen: true, windowClosesAt: new Date(Date.now() + 20 * 3600_000).toISOString(), aiDraft: { text: 'Ji, COD available hai!', createdAt: '' },
  template: { name: 'sales_follow_up', lang: 'en' }, templates: [tplEn],
  messages: [{ _id: 'm1', direction: 'in', type: 'text', text: 'COD hai?', status: 'received', error: null, at: new Date().toISOString(), fromAiDraft: false }], ...over,
});
const counts = { all: 1, needsReply: 1, unread: 1, unreadMessages: 2, closing: 0, expired: 0, done: 0 };
const owners = [{ _id: 'a1', name: 'Ali', email: 'ali@x.pk' }, { _id: 'a2', name: 'Hina', email: 'hina@x.pk' }];
const leadDetail = (over: Record<string, unknown> = {}) => ({
  lead: { _id: 'l1', name: 'Sara Malik', businessName: 'Sara Boutique', email: 'sara@x.pk', phone: '03001112223', city: 'Lahore', stage: 'new', ownerAdminId: 'a1', ownerName: 'Ali', dealValuePKR: 60000, lastActivityAt: null, ...over },
  activities: [{ _id: 'act1', leadId: 'l1', type: 'note', subject: null, body: 'Asked about COD', outcome: null, adminId: 'a1', adminName: 'Ali', createdAt: new Date().toISOString() }],
  tasks: [], merchant: null,
});
beforeAll(() => {
  // jsdom has no matchMedia; the shared menu asks it whether to open as a phone sheet.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
  });
});
beforeEach(() => {
  api.apiWaQuickReplies.mockResolvedValue({ data: [] });
  api.apiSalesOwners.mockResolvedValue({ data: owners });
  api.apiMyMessaging.mockResolvedValue({ data: { whatsapp: 'full', email: 'full', waTemplateKeys: null, emailTemplateIds: null } });
  api.apiGetLead.mockResolvedValue({ data: leadDetail() });
});
const renderAt = (url = '/admin/sales?tab=whatsapp') => render(<MemoryRouter initialEntries={[url]}><WhatsAppTab isManager /></MemoryRouter>);

describe('WhatsAppTab', () => {
  it('opens a chat, uses the AI draft and sends it', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row] });
    api.apiWaConversation.mockResolvedValue({ data: convo() });
    api.apiWaSend.mockResolvedValue({ data: convo({ aiDraft: null }) });
    renderAt();
    fireEvent.click(await screen.findByText('Sara Malik'));
    expect(await screen.findByText('COD hai?', { selector: 'p' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Use draft' }));
    expect(screen.getByLabelText('Reply')).toHaveValue('Ji, COD available hai!');
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    await waitFor(() => expect(api.apiWaSend).toHaveBeenCalledWith('c1', 'Ji, COD available hai!', true));
  });

  it('offers only the approved template after 24 hours', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [{ ...row, windowOpen: false }] });
    api.apiWaConversation.mockResolvedValue({ data: convo({ windowOpen: false }) });
    api.apiWaSendTemplate.mockResolvedValue({ data: convo({ windowOpen: false }) });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    fireEvent.click(await screen.findByRole('button', { name: /Send template “Follow-up \(English\)”/ }));
    await waitFor(() => expect(api.apiWaSendTemplate).toHaveBeenCalledWith('c1', 'sales_follow_up:en'));
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
  });

  it('with several templates, the rep picks one and sees the text the person will get', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [{ ...row, windowOpen: false }] });
    api.apiWaConversation.mockResolvedValue({ data: convo({ windowOpen: false, templates: [tplEn, tplUr] }) });
    api.apiWaSendTemplate.mockResolvedValue({ data: convo({ windowOpen: false, templates: [tplEn, tplUr] }) });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    fireEvent.click(await screen.findByRole('button', { name: 'Choose a template' }));
    // The chosen template's text, with {{1}} as the lead's first name.
    expect(screen.getByText('Hi Sara, following up from Solvexo.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Follow-up \(Urdu\)/ }));
    expect(screen.getByText('السلام علیکم Sara')).toHaveAttribute('dir', 'auto');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.apiWaSendTemplate).toHaveBeenCalledWith('c1', 'sales_follow_up:ur'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument());
  });

  it('a rep allowed templates only gets no reply box, and picks a reason before a template', async () => {
    const tplPay = { key: 'pay:en', label: 'Payment due', name: 'pay', lang: 'en', usesName: false, body: 'Your invoice is due.', reason: 'payment_reminder' };
    const c = convo({ windowOpen: true, canWriteText: false, templates: [{ ...tplEn, reason: 'follow_up' }, tplPay] });
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row] });
    api.apiWaConversation.mockResolvedValue({ data: c });
    api.apiWaSendTemplate.mockResolvedValue({ data: c });
    render(<MemoryRouter initialEntries={['/admin/sales?tab=whatsapp&c=c1']}><WhatsAppTab isManager={false} /></MemoryRouter>);
    expect(await screen.findByText('You can send approved templates only.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
    expect(screen.queryByText('Use draft')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose a template' }));
    expect(screen.getByRole('radio', { name: /Follow-up \(English\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Payment due/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Payment reminder' }));
    expect(screen.getByText('Your invoice is due.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.apiWaSendTemplate).toHaveBeenCalledWith('c1', 'pay:en'));
  });

  it('a manager lists the templates; Meta’s answer is shown when one is refused', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [] });
    api.apiWaSaveTemplates.mockRejectedValueOnce(new Error('Template demo_reminder (en) is pending; only approved templates can be sent.'))
      .mockResolvedValueOnce({ data: { ...conn, templates: [tplEn, tplUr] } });
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: /Templates/ }));
    expect(screen.getByLabelText('Template 1 name')).toHaveValue('sales_follow_up');
    fireEvent.click(screen.getByRole('button', { name: /Add a template/ }));
    fireEvent.change(screen.getByLabelText('Template 2 label'), { target: { value: 'Demo reminder' } });
    fireEvent.change(screen.getByLabelText('Template 2 name'), { target: { value: 'demo_reminder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('is pending');
    fireEvent.change(screen.getByLabelText('Template 2 label'), { target: { value: 'Follow-up (Urdu)' } });
    fireEvent.change(screen.getByLabelText('Template 2 name'), { target: { value: 'sales_follow_up' } });
    fireEvent.change(screen.getByLabelText('Template 2 language'), { target: { value: 'ur' } });
    chooseValue(dropdown('Template 2 reason'), 'payment_reminder');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiWaSaveTemplates).toHaveBeenLastCalledWith([
      { label: 'Follow-up (English)', name: 'sales_follow_up', lang: 'en', reason: 'follow_up' },
      { label: 'Follow-up (Urdu)', name: 'sales_follow_up', lang: 'ur', reason: 'payment_reminder' },
    ]));
    await waitFor(() => expect(screen.queryByText('WhatsApp templates')).not.toBeInTheDocument());
  });

  it('lets a manager connect the number', async () => {
    api.apiWaConnection.mockResolvedValue({ data: { ...conn, connected: false, phoneNumberId: null, displayNumber: null, tokenHint: null } });
    api.apiWaConversations.mockResolvedValue({ data: [] });
    api.apiWaConnect.mockResolvedValue({ data: conn });
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Connect WhatsApp' }));
    fireEvent.change(screen.getByLabelText('Phone number ID'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Permanent access token'), { target: { value: 'EAAG-token' } });
    // Optional: when left empty the server finds it from the token; only digits are kept.
    fireEvent.change(screen.getByLabelText('WhatsApp Business Account ID (optional)'), { target: { value: ' 1475065457931364 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(api.apiWaConnect).toHaveBeenCalledWith(expect.objectContaining({ phoneNumberId: '1234567890', accessToken: 'EAAG-token', wabaId: '1475065457931364' })));
  });

  it('counters and view tabs ask the server for that view; the search box sends q', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row], counts });
    const onUnread = vi.fn();
    render(<MemoryRouter initialEntries={['/admin/sales?tab=whatsapp']}><WhatsAppTab isManager onUnread={onUnread} /></MemoryRouter>);
    await screen.findByText('Sara Malik');
    expect(api.apiWaConversations).toHaveBeenCalledWith(expect.objectContaining({ view: 'all' }));
    await waitFor(() => expect(onUnread).toHaveBeenCalledWith(2));
    fireEvent.click(within(screen.getByRole('group', { name: 'Today' })).getByRole('button', { name: /Needs reply/ }));
    await waitFor(() => expect(api.apiWaConversations).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'needs_reply' })));
    fireEvent.click(within(screen.getByRole('group', { name: 'Chat views' })).getByRole('button', { name: /Template only/ }));
    await waitFor(() => expect(api.apiWaConversations).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'expired' })));
    fireEvent.change(screen.getByLabelText('Search chats'), { target: { value: 'boutique' } });
    await waitFor(() => expect(api.apiWaConversations).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'expired', q: 'boutique' })));
  });

  it('a row shows "You:" with the delivery tick, and how long the reply window has left', async () => {
    const closes = new Date(Date.now() + (18 * 60 + 10) * 60_000).toISOString();
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({
      data: [
        { ...row, unread: 0, lastDirection: 'out', lastStatus: 'read', lastMessageText: 'See you at 3', windowClosesAt: closes },
        { ...row, _id: 'c2', name: 'Bilal Khan', unread: 0, hasDraft: false, windowOpen: false, windowClosesAt: null, lastDirection: 'in', snoozedUntil: new Date(Date.now() + 3600_000).toISOString() },
      ], counts,
    });
    renderAt();
    const list = await screen.findByRole('list', { name: 'WhatsApp chats' });
    const [first, second] = within(list).getAllByRole('listitem');
    expect(within(first).getByText(/You: See you at 3/)).toBeInTheDocument();
    expect(within(first).getByLabelText('Read')).toBeInTheDocument();
    expect(within(first).getByText('18h left')).toBeInTheDocument();
    expect(within(first).getByLabelText('AI draft ready')).toBeInTheDocument();
    expect(within(second).getByText('Template only')).toBeInTheDocument();
    expect(within(second).getByText('Snoozed')).toBeInTheDocument();
    expect(within(second).queryByText(/You:/)).not.toBeInTheDocument();
  });

  it('marks a chat done, reopens it, and snoozes it through the status endpoint', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row], counts });
    api.apiWaConversation.mockResolvedValue({ data: convo() });
    api.apiWaSetStatus.mockResolvedValue({ data: convo() });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    fireEvent.click(await screen.findByRole('button', { name: /Mark done/ }));
    await waitFor(() => expect(api.apiWaSetStatus).toHaveBeenCalledWith('c1', { done: true }));
    fireEvent.click(await screen.findByRole('button', { name: /Reopen/ }));
    await waitFor(() => expect(api.apiWaSetStatus).toHaveBeenLastCalledWith('c1', { done: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Snooze' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'For 1 hour' }));
    await waitFor(() => expect(api.apiWaSetStatus).toHaveBeenLastCalledWith('c1', { snoozeUntil: expect.any(String) }));
    const until = new Date(api.apiWaSetStatus.mock.lastCall![1].snoozeUntil).getTime();
    expect(Math.abs(until - (Date.now() + 3600_000))).toBeLessThan(60_000);
  });

  it('a manager hands the chat to another rep', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [{ ...row, ownerId: 'a1', ownerName: 'Ali' }], counts });
    api.apiWaConversation.mockResolvedValue({ data: convo() });
    api.apiWaAssign.mockResolvedValue({ data: convo() });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    await screen.findByRole('button', { name: /Mark done/ });
    await waitFor(() => expect(api.apiSalesOwners).toHaveBeenCalled());
    chooseValue(dropdown('Assign to'), 'a2');
    await waitFor(() => expect(api.apiWaAssign).toHaveBeenCalledWith('c1', 'a2'));
    expect(toast.success).toHaveBeenCalledWith('Chat given to Hina.');
  });

  it('starts a chat with a typed number and a template, then opens it', async () => {
    api.apiWaConnection.mockResolvedValue({ data: { ...conn, templates: [tplEn, tplUr] } });
    api.apiWaConversations.mockResolvedValue({ data: [row], counts });
    api.apiWaStart.mockResolvedValue({ data: { conversationId: 'c9' } });
    api.apiWaConversation.mockResolvedValue({ data: convo({ _id: 'c9', lead: null, profileName: 'Usman' }) });
    renderAt();
    await screen.findByText('Sara Malik');
    await waitFor(() => expect(api.apiWaConnection).toHaveBeenCalled());
    fireEvent.click(await screen.findByRole('button', { name: /New chat/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'A new number' }));
    fireEvent.change(screen.getByLabelText('WhatsApp number'), { target: { value: '0300 7654321' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Usman Ali' } });
    expect(screen.getByText('Hi Usman, following up from Solvexo.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Follow-up \(Urdu\)/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.apiWaStart).toHaveBeenCalledWith({ phone: '0300 7654321', name: 'Usman Ali', templateKey: 'sales_follow_up:ur' }));
    await waitFor(() => expect(api.apiWaConversation).toHaveBeenCalledWith('c9'));
  });

  it('a rep starts a chat with the templates they may send, before opening any chat', async () => {
    api.apiWaConversations.mockResolvedValue({ data: [], counts: { ...counts, all: 0 } });
    api.apiWaMyTemplates.mockResolvedValueOnce({ data: [tplUr] });
    render(<MemoryRouter initialEntries={['/admin/sales?tab=whatsapp']}><WhatsAppTab isManager={false} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /New chat/ }));
    expect(await screen.findByRole('radio', { name: /Follow-up \(Urdu\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Follow-up \(English\)/ })).not.toBeInTheDocument();
    expect(api.apiWaConnection).not.toHaveBeenCalled();
  });

  it('a quick reply is added to the end of the reply box', async () => {
    api.apiWaQuickReplies.mockResolvedValue({ data: [{ id: 'q1', title: 'Prices', text: 'Plans start at PKR 2,000 a month.' }] });
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row], counts });
    api.apiWaConversation.mockResolvedValue({ data: convo() });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    const box = await screen.findByLabelText('Reply');
    fireEvent.change(box, { target: { value: 'Assalam o Alaikum!' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Quick replies' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Prices' }));
    expect(box).toHaveValue('Assalam o Alaikum!\nPlans start at PKR 2,000 a month.');
  });

  it('the lead panel changes the stage, and Lost asks why', async () => {
    api.apiWaConnection.mockResolvedValue({ data: conn });
    api.apiWaConversations.mockResolvedValue({ data: [row], counts });
    api.apiWaConversation.mockResolvedValue({ data: convo() });
    api.apiChangeStage.mockResolvedValue({ data: leadDetail({ stage: 'demo' }) });
    renderAt('/admin/sales?tab=whatsapp&c=c1');
    const panel = await screen.findByRole('complementary', { name: 'Lead details' });
    expect(await within(panel).findByText('Asked about COD')).toBeInTheDocument();
    chooseValue(dropdown('Stage', panel), 'demo');
    await waitFor(() => expect(api.apiChangeStage).toHaveBeenCalledWith('l1', 'demo'));
    chooseValue(dropdown('Stage', panel), 'lost');
    expect(await screen.findByText('Why was Sara Malik lost?')).toBeInTheDocument();
  });
});
