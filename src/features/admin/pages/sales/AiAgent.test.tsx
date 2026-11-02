import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiChatConfig: vi.fn(), apiChatStart: vi.fn(), apiChatSend: vi.fn(),
  apiAgentConfig: vi.fn(), apiSaveAgentConfig: vi.fn(), apiPreviewAgent: vi.fn(), apiAgentChats: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { SalesChatWidget } from '@/components/comman/sales/SalesChatWidget';
import { AgentTab } from './AgentTab';

afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear(); });

describe('SalesChatWidget', () => {
  it('stays hidden while the chat is off', async () => {
    api.apiChatConfig.mockResolvedValue({ data: { enabled: false, agentName: 'Sana', greeting: '' } });
    const { container } = render(<MemoryRouter><SalesChatWidget /></MemoryRouter>);
    await waitFor(() => expect(api.apiChatConfig).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('starts a chat with the page, campaign and partner, and shows the replies', async () => {
    localStorage.setItem('solvexo:partnerRef', JSON.stringify({ code: 'KAMRAN1', expiresAt: Date.now() + 100000 }));
    api.apiChatConfig.mockResolvedValue({ data: { enabled: true, agentName: 'Sana', greeting: 'Hi! I’m Sana.' } });
    api.apiChatStart.mockResolvedValue({ data: { token: 't'.repeat(48), agentName: 'Sana', greeting: 'Hi! I’m Sana.' } });
    api.apiChatSend.mockResolvedValue({ data: { reply: 'Haan, Cash on Delivery available hai.', leadCreated: false, handedOver: false } });
    render(<MemoryRouter initialEntries={['/pricing?utm_campaign=eid-sale']}><SalesChatWidget /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Chat with Sana/ }));
    expect(await screen.findByText('Hi! I’m Sana.')).toBeInTheDocument();
    expect(api.apiChatStart).toHaveBeenCalledWith({ page: '/pricing', utmCampaign: 'eid-sale', partnerCode: 'KAMRAN1' });
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'COD hai?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Haan, Cash on Delivery available hai.')).toBeInTheDocument();
    expect(api.apiChatSend).toHaveBeenCalledWith('t'.repeat(48), 'COD hai?');
    expect(JSON.parse(sessionStorage.getItem('solvexo:salesChat')!).messages).toHaveLength(3);
  });
});

const cfg = {
  connected: true, aiEnabled: false, aiFirstReply: true, aiChat: true, aiAgentName: 'Sana', aiGreeting: null, aiKnowledge: null,
  defaultKnowledge: 'Solvexo lets businesses in Pakistan open their own online store.', aiRules: null, aiSignOff: null, aiReplyTo: null,
  aiChatDailyLimit: 300, chatsToday: 4,
};

describe('AgentTab', () => {
  it('cannot be switched on until the AI is connected', async () => {
    api.apiAgentConfig.mockResolvedValue({ data: { ...cfg, connected: false } });
    api.apiAgentChats.mockResolvedValue({ data: [] });
    render(<MemoryRouter><AgentTab /></MemoryRouter>);
    expect(await screen.findByText(/The AI is not connected yet/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'AI sales assistant on' })).toBeDisabled();
    expect(screen.getByLabelText('Test message')).toBeDisabled();
  });

  it('switches on, saves the facts and tests a reply', async () => {
    api.apiAgentConfig.mockResolvedValue({ data: cfg });
    api.apiAgentChats.mockResolvedValue({ data: [] });
    api.apiSaveAgentConfig.mockImplementation(async (b: Record<string, unknown>) => ({ data: { ...cfg, ...b } }));
    api.apiPreviewAgent.mockResolvedValue({ data: { reply: 'Starter is $9 a month.', language: 'en', details: { name: '' }, wantsDemo: false, wantsHuman: false, preferredTime: '', summary: '' } });
    render(<MemoryRouter><AgentTab /></MemoryRouter>);
    expect(await screen.findByLabelText('Facts about Solvexo')).toHaveValue(cfg.defaultKnowledge);
    fireEvent.click(screen.getByRole('switch', { name: 'AI sales assistant on' }));
    await waitFor(() => expect(api.apiSaveAgentConfig).toHaveBeenCalledWith(expect.objectContaining({ aiEnabled: true })));

    fireEvent.change(screen.getByLabelText('Facts about Solvexo'), { target: { value: 'We support COD and Safepay.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiSaveAgentConfig).toHaveBeenLastCalledWith(expect.objectContaining({ aiKnowledge: 'We support COD and Safepay.' })));

    fireEvent.change(screen.getByLabelText('Test message'), { target: { value: 'How much?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send test message' }));
    expect(await screen.findByText('Starter is $9 a month.')).toBeInTheDocument();
  });
});
