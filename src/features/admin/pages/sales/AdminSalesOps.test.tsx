import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiListLeads: vi.fn(), apiCreateLead: vi.fn(), apiChangeStage: vi.fn(), apiSalesOwners: vi.fn(), apiListTasks: vi.fn(),
  apiUpdateTask: vi.fn(), apiListTemplates: vi.fn(), apiSaveTemplate: vi.fn(), apiDeleteTemplate: vi.fn(),
  apiGetLead: vi.fn(), apiUpdateLead: vi.fn(), apiDeleteLead: vi.fn(), apiLogActivity: vi.fn(), apiSendLeadEmail: vi.fn(),
  apiCreateTask: vi.fn(), apiDeleteTask: vi.fn(),
}));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
const perm = vi.hoisted(() => ({ manager: true }));
vi.mock('@/hooks/auth/useCan', () => ({ can: (p: string | string[]) => (p === 'sales.manage' ? perm.manager : true) }));
vi.mock('@/components/comman/ui/AdminPageHeader', () => ({
  AdminPageHeader: ({ title }: { title: string }) => <header><h1>{title}</h1></header>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ name: 'Bilal' }) } }));

import { AdminSalesOps } from './AdminSalesOps';
import { SalesLeadDetail } from './SalesLeadDetail';

const lead = (over: Record<string, unknown> = {}) => ({
  _id: 'l1', name: 'Sara Malik', businessName: 'Sara Boutique', email: 'sara@example.com', phone: '03001112223', city: 'Lahore', country: null,
  businessType: 'Clothing', source: 'manual', sourceDetail: null, stage: 'new', lostReason: null, lostNote: null, ownerAdminId: 'a1',
  ownerName: 'Atiq', dealValuePKR: 60000, tags: [], nextFollowUpAt: null, lastActivityAt: null, stageChangedAt: null, wonAt: null,
  sellerId: null, storeId: null, linkedAt: null, createdAt: '2026-11-01T09:00:00.000Z', ...over,
});
const list = (items = [lead()]) => ({
  data: {
    items, total: items.length, page: 1, limit: 200,
    summary: {
      stages: ['new', 'contacted', 'demo', 'trial', 'won', 'lost'].map(stage => ({ stage, count: items.filter(i => i.stage === stage).length, valuePKR: 0 })),
      openLeads: items.length, openValuePKR: 60000, overdueFollowUps: 0, wonThisMonth: 0,
    },
  },
});
const detail = (over: Record<string, unknown> = {}) => ({ data: { lead: lead(over), activities: [], tasks: [], merchant: null } });

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/admin/sales" element={<AdminSalesOps />} />
      <Route path="/admin/sales/leads/:id" element={<SalesLeadDetail />} />
    </Routes>
  </MemoryRouter>,
);

afterEach(() => { cleanup(); vi.clearAllMocks(); perm.manager = true; try { localStorage.clear(); } catch { /* jsdom */ } });

describe('Sales Ops pipeline', () => {
  it('shows leads on the board and asks for a reason before moving one to Lost', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [{ _id: 'a1', name: 'Atiq', email: 'a@x' }] });
    api.apiListLeads.mockResolvedValue(list());
    api.apiChangeStage.mockResolvedValue(detail({ stage: 'lost' }));
    renderAt('/admin/sales');
    const col = await screen.findByRole('region', { name: 'New column' });
    expect(await within(col).findByText('Sara Malik')).toBeInTheDocument();
    expect(within(col).getByText('PKR 60,000')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Move Sara Malik'), { target: { value: 'lost' } });
    expect(await screen.findByText('Why was Sara Malik lost?')).toBeInTheDocument();
    expect(api.apiChangeStage).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'price' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as lost' }));
    await waitFor(() => expect(api.apiChangeStage).toHaveBeenCalledWith('l1', 'lost', 'price', ''));
  });

  it('hides the owner filter and owner field from a rep', async () => {
    perm.manager = false;
    api.apiListLeads.mockResolvedValue(list());
    renderAt('/admin/sales');
    await screen.findByText('Sara Malik');
    expect(screen.queryByLabelText('Owner')).not.toBeInTheDocument();
    expect(api.apiSalesOwners).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Add lead/ }));
    expect(screen.queryByLabelText('Owner')).not.toBeInTheDocument();
  });

  it('points to the existing lead when a duplicate is added', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiListLeads.mockResolvedValue(list());
    api.apiCreateLead.mockRejectedValue(Object.assign(new Error('A lead with this email or phone already exists (Sara Malik).'), { details: { existingLeadId: 'l1' } }));
    renderAt('/admin/sales');
    await screen.findByText('Sara Malik');
    fireEvent.click(screen.getByRole('button', { name: /Add lead/ }));
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Sara' } });
    fireEvent.change(screen.getByLabelText('Phone / WhatsApp'), { target: { value: '0300 111 2223' } });
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add lead' }));
    expect(await within(dialog).findByText(/already exists/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Open that lead' })).toHaveAttribute('href', '/admin/sales/leads/l1');
  });
});

describe('Sales lead page', () => {
  it('logs a call in one tap and sends an email from a template', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiGetLead.mockResolvedValue(detail());
    api.apiLogActivity.mockResolvedValue(detail({ stage: 'contacted' }));
    api.apiListTemplates.mockResolvedValue({ data: [{ _id: 't1', name: 'First follow-up', subject: 'Your store, {{businessName}}', body: 'Hi {{name}}, {{senderName}} here.' }] });
    api.apiSendLeadEmail.mockResolvedValue(detail({ stage: 'contacted' }));
    renderAt('/admin/sales/leads/l1');

    fireEvent.click(await screen.findByRole('button', { name: 'No answer' }));
    await waitFor(() => expect(api.apiLogActivity).toHaveBeenCalledWith('l1', 'call', 'No answer', 'No answer'));
    expect(toast.success).toHaveBeenCalledWith('Call logged.');

    fireEvent.click(screen.getByRole('tab', { name: /Email/ }));
    fireEvent.change(await screen.findByLabelText('Template'), { target: { value: 't1' } });
    expect(screen.getByLabelText('Subject')).toHaveValue('Your store, Sara Boutique');
    expect(screen.getByLabelText('Message')).toHaveValue('Hi Sara Malik, Bilal here.');
    fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
    await waitFor(() => expect(api.apiSendLeadEmail).toHaveBeenCalledWith('l1', 'Your store, Sara Boutique', 'Hi Sara Malik, Bilal here.'));
  });

  it('adds a follow-up and moves stage from the stepper', async () => {
    api.apiSalesOwners.mockResolvedValue({ data: [] });
    api.apiGetLead.mockResolvedValue(detail());
    api.apiCreateTask.mockResolvedValue(detail());
    api.apiChangeStage.mockResolvedValue(detail({ stage: 'demo' }));
    renderAt('/admin/sales/leads/l1');
    fireEvent.change(await screen.findByLabelText('Follow-up'), { target: { value: 'Send pricing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await waitFor(() => expect(api.apiCreateTask).toHaveBeenCalledWith('l1', 'Send pricing', expect.stringMatching(/T/)));
    fireEvent.click(within(screen.getByRole('list', { name: 'Stage' })).getByRole('button', { name: 'Demo' }));
    await waitFor(() => expect(api.apiChangeStage).toHaveBeenCalledWith('l1', 'demo'));
  });
});
