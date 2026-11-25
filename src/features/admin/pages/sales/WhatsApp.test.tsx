import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiWaConnection: vi.fn(), apiWaConnect: vi.fn(), apiWaDisconnect: vi.fn(), apiWaConversations: vi.fn(), apiWaConversation: vi.fn(),
  apiWaSend: vi.fn(), apiWaSendTemplate: vi.fn(), apiWaSaveTemplates: vi.fn(), apiWaRedraft: vi.fn(), apiWaDiscardDraft: vi.fn(),
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
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiWaSaveTemplates).toHaveBeenLastCalledWith([
      { label: 'Follow-up (English)', name: 'sales_follow_up', lang: 'en' },
      { label: 'Follow-up (Urdu)', name: 'sales_follow_up', lang: 'ur' },
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
});
