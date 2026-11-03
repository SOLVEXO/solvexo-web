import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiWaConnection: vi.fn(), apiWaConnect: vi.fn(), apiWaDisconnect: vi.fn(), apiWaConversations: vi.fn(), apiWaConversation: vi.fn(),
  apiWaSend: vi.fn(), apiWaSendTemplate: vi.fn(), apiWaRedraft: vi.fn(), apiWaDiscardDraft: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { WhatsAppTab } from './WhatsAppTab';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const conn = { connected: true, phoneNumberId: '123', wabaId: 'w', displayNumber: '+92 300 0000000', verifiedName: 'Solvexo', tokenHint: 'EAAG…3456', templateName: 'sales_follow_up', templateLang: 'en', templateUsesName: true, connectedAt: '', lastEventAt: new Date().toISOString(), webhookUrl: 'https://api.solvexo.store/webhooks/whatsapp', aiDrafts: true };
const row = { _id: 'c1', waId: '923001112223', name: 'Sara Malik', businessName: 'Sara Boutique', leadId: 'l1', stage: 'new', unread: 2, lastMessageAt: new Date().toISOString(), lastMessageText: 'COD hai?', windowOpen: true, hasDraft: true };
const convo = (over: Record<string, unknown> = {}) => ({
  _id: 'c1', waId: '923001112223', profileName: 'Sara', lead: { _id: 'l1', name: 'Sara Malik', businessName: 'Sara Boutique', stage: 'new', city: 'Lahore' },
  windowOpen: true, windowClosesAt: new Date(Date.now() + 20 * 3600_000).toISOString(), aiDraft: { text: 'Ji, COD available hai!', createdAt: '' },
  template: { name: 'sales_follow_up', lang: 'en' },
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
    fireEvent.click(await screen.findByRole('button', { name: /Send template “sales_follow_up”/ }));
    await waitFor(() => expect(api.apiWaSendTemplate).toHaveBeenCalledWith('c1'));
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
  });

  it('lets a manager connect the number', async () => {
    api.apiWaConnection.mockResolvedValue({ data: { ...conn, connected: false, phoneNumberId: null, displayNumber: null, tokenHint: null } });
    api.apiWaConversations.mockResolvedValue({ data: [] });
    api.apiWaConnect.mockResolvedValue({ data: conn });
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Connect WhatsApp' }));
    fireEvent.change(screen.getByLabelText('Phone number ID'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Permanent access token'), { target: { value: 'EAAG-token' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(api.apiWaConnect).toHaveBeenCalledWith(expect.objectContaining({ phoneNumberId: '1234567890', accessToken: 'EAAG-token', templateLang: 'en' })));
  });
});
