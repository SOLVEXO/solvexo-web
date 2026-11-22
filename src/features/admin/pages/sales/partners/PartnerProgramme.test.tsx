import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PartnerOnboarding } from '@/api/services/partnerProgramme';

globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;

const api = vi.hoisted(() => ({
  apiPartnerBoard: vi.fn(), apiPartnerOnboarding: vi.fn(), apiApprovePartner: vi.fn(), apiTickChecklist: vi.fn(), apiReviewDocument: vi.fn(),
  apiMyOnboarding: vi.fn(), apiUploadMyDocument: vi.fn(), apiApplyPartner: vi.fn(), apiInvitePartner: vi.fn(),
  apiDeals: vi.fn(), apiDecideDeal: vi.fn(), apiMyDeals: vi.fn(), apiRegisterDeal: vi.fn(),
  apiLeaderboard: vi.fn(), apiScorecard: vi.fn(), apiAddPartnerLog: vi.fn(), apiConduct: vi.fn(),
}));
vi.mock('@/api/services/partnerProgramme', async (orig) => ({ ...(await orig<typeof import('@/api/services/partnerProgramme')>()), ...api }));
vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));

import { OnboardingBoard } from './OnboardingBoard';
import { MyOnboarding } from './MyOnboarding';
import { PartnersPage } from '@/features/buyer/pages/PartnersPage';
import { DealsBoard } from './DealsBoard';
import { MyDeals } from './MyDeals';
import { ScorecardBoard } from './ScorecardBoard';
import { ScorecardView } from './ScorecardView';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const LABELS = { company_registration: 'Company registration', ntn: 'NTN', cnic: 'CNIC', bank_account: 'Bank account', partnership_proof: 'Partnership proof', business_plan: 'Business plan', reference_letter: 'Reference', agreement: 'Agreement', other: 'Other' };
const partner = (o: Partial<PartnerOnboarding> = {}): PartnerOnboarding => ({
  _id: 'p1', name: 'Lahore Traders', code: 'LAHOR123', email: 'ali@lt.pk', phone: '03001234567', city: 'Lahore', status: 'paused', stage: 'review',
  entityType: 'business', model: 'reseller', resellerMode: null, tier: 'registered', tierRule: { key: 'registered', minPayingSellers: 0, retentionTargetPercent: null, certifiedStaff: 0, commissionPercent: null, demoStores: 1, commissionApproved: false },
  territory: 'Lahore District', exclusive: false, exclusiveFrom: null, exclusiveUntil: null, houseAccounts: [], application: { contactName: 'Ali', references: [] },
  appliedAt: '2026-11-20T00:00:00Z', invitedAt: '2026-11-21T00:00:00Z', approvedAt: null, rejectedAt: null, rejectReason: null, hasLogin: true, loginActivatedAt: null,
  docs: { required: ['company_registration', 'cnic', 'bank_account', 'business_plan'], missing: [], verified: ['company_registration', 'cnic', 'bank_account'], allUploaded: true, allVerified: false, labels: LABELS },
  documents: [{ _id: 'd1', type: 'business_plan', label: 'Business plan', fileName: 'plan.pdf', uploadedAt: '2026-11-21T00:00:00Z', uploadedByRole: 'partner', status: 'pending', reviewNote: null, reviewedAt: null }],
  agreement: null, staff: [], demoStores: [],
  checklist: [
    { key: 'application', label: 'Application received', week: 0, auto: true, done: true, doneAt: null, dueAt: null, overdue: false },
    { key: 'references_checked', label: 'References and claimed partnerships checked', week: 0, auto: false, done: false, doneAt: null, dueAt: null, overdue: false },
  ],
  facts: { prospects: 0, liveSellers: 0 }, attention: ['1 document to check'], ...o,
});

describe('Super Admin partner onboarding', () => {
  it('lists applications needing attention and opens one; approval waits for documents and references', async () => {
    api.apiPartnerBoard.mockResolvedValue({ success: true, data: [{ _id: 'p1', name: 'Lahore Traders', city: 'Lahore', entityType: 'business', model: 'reseller', tier: 'registered', territory: 'Lahore District', stage: 'review', appliedAt: '2026-11-20T00:00:00Z', docs: { required: 4, verified: 3, waiting: 1 }, checklist: { done: 1, total: 2, overdue: 0 }, pilotEndsAt: null, noticeBy: null, attention: ['1 document to check'] }] });
    api.apiPartnerOnboarding.mockResolvedValue({ success: true, data: partner() });
    api.apiTickChecklist.mockResolvedValue({ success: true, data: partner() });
    render(<MemoryRouter><OnboardingBoard /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Lahore Traders'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(dialog).getByText(/1 of 4 still to verify/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'References and claimed partnerships checked' }));
    await waitFor(() => expect(api.apiTickChecklist).toHaveBeenCalledWith('p1', 'references_checked', true));
  });
});

describe('the partner’s own onboarding', () => {
  it('shows what is still needed and uploads a document', async () => {
    const d = partner({ stage: 'documents', docs: { ...partner().docs, missing: ['bank_account'], verified: ['cnic'], allUploaded: false } , documents: [] });
    api.apiUploadMyDocument.mockResolvedValue({ success: true, data: null });
    api.apiMyOnboarding.mockResolvedValue({ success: true, data: d });
    const onChange = vi.fn();
    render(<MemoryRouter><MyOnboarding d={d} onChange={onChange} /></MemoryRouter>);
    expect(screen.getByText(/Upload the documents below/)).toBeInTheDocument();
    const file = new File(['%PDF-1.4'], 'bank.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Upload Bank account'), { target: { files: [file] } });
    await waitFor(() => expect(api.apiUploadMyDocument).toHaveBeenCalledWith('bank_account', file));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });
});

describe('Become a partner page', () => {
  it('sends a business application with references and requires consent', async () => {
    api.apiApplyPartner.mockResolvedValue({ success: true, message: 'Thank you. We have your application.', data: null });
    render(<MemoryRouter><PartnersPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ali Raza' } });
    fireEvent.change(screen.getByLabelText('Registered business name'), { target: { value: 'Lahore Traders' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ali@lt.pk' } });
    fireEvent.change(screen.getByLabelText('Mobile / WhatsApp'), { target: { value: '0300 1234567' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Lahore' } });
    fireEvent.change(screen.getByLabelText('Reference 1 name and company'), { target: { value: 'Usman, Usman & Co' } });
    fireEvent.change(screen.getByLabelText('Reference 1 phone'), { target: { value: '03211234567' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send application' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('agree to be contacted');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Send application' }));
    await waitFor(() => expect(api.apiApplyPartner).toHaveBeenCalledWith(expect.objectContaining({
      entityType: 'business', model: 'reseller', contactName: 'Ali Raza', legalName: 'Lahore Traders', consent: true,
      references: [{ name: 'Usman, Usman & Co', phone: '03211234567' }],
    })));
    expect(await screen.findByText('Application received')).toBeInTheDocument();
  });
});

const deal = (o: Record<string, unknown> = {}) => ({
  _id: 'd1', partnerId: 'p1', partnerName: 'Lahore Traders', businessName: 'Hamza Mart', contactName: 'Hamza', phone: '03001234567', email: null, city: 'Lahore',
  link: null, notes: null, status: 'pending', submittedAt: '2026-11-24T00:00:00Z', decisionDueAt: '2026-11-26T23:59:59Z', overdue: true, decidedAt: null, decidedHow: null,
  rejectReason: null, protectedUntil: null, extensions: [], extensionRequest: null, wonAt: null, conflicts: [{ kind: 'pending_elsewhere', detail: 'Also submitted by Karachi Co' }], ...o,
});

describe('deal registration', () => {
  it('lets a manager accept a registration past its deadline and shows the conflicts', async () => {
    api.apiDeals.mockResolvedValue({ success: true, data: { counts: { pending: 1, overdue: 1 }, deals: [deal()] } });
    api.apiDecideDeal.mockResolvedValue({ success: true, message: 'Accepted', data: null });
    render(<MemoryRouter><DealsBoard /></MemoryRouter>);
    expect(await screen.findByText('Hamza Mart')).toBeInTheDocument();
    expect(screen.getByText('Also submitted by Karachi Co')).toBeInTheDocument();
    expect(screen.getByText(/Reply by/)).toHaveClass('text-error');
    fireEvent.click(screen.getByRole('button', { name: /Accept/ }));
    await waitFor(() => expect(api.apiDecideDeal).toHaveBeenCalledWith('d1', 'accept'));
  });

  it('lets a partner register a prospect only with the seller’s permission', async () => {
    api.apiMyDeals.mockResolvedValue({ success: true, data: { canRegister: true, protectionDays: 90, responseDays: 2, deals: [deal({ status: 'accepted', protectedUntil: '2027-02-22T00:00:00Z' })] } });
    api.apiRegisterDeal.mockResolvedValue({ success: true, message: 'Registered.', data: deal() });
    render(<MemoryRouter><MyDeals /></MemoryRouter>);
    expect(await screen.findByText(/protected until/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Register a prospect' }));
    fireEvent.change(screen.getByLabelText('Business name'), { target: { value: 'Ali Shoes' } });
    fireEvent.change(screen.getByLabelText('Phone / WhatsApp'), { target: { value: '03007654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('agreed');
    fireEvent.click(screen.getByRole('checkbox', { name: /seller agreed/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    await waitFor(() => expect(api.apiRegisterDeal).toHaveBeenCalledWith(expect.objectContaining({ businessName: 'Ali Shoes', phone: '03007654321', consent: true })));
  });
});

const card = { prospects: 6, registrationsAccepted: 4, demos: 2, signups: 30, liveStores: 20, payingNow: 26, everPaid: 28, retention3mPercent: 80, retentionBase: 10, daysToFirstSale: 12, complaints: 1, complaintRatePercent: 3.8, earnedPKR: 54000, eligibleTier: 'silver' as const, tierStatus: 'eligible_for_higher' as const };

describe('partner scorecards', () => {
  it('ranks partners, flags a tier upgrade, opens the scorecard and records a monthly review', async () => {
    api.apiLeaderboard.mockResolvedValue({ success: true, data: [
      { _id: 'p1', name: 'Lahore Traders', tier: 'registered', territory: 'Lahore District', stage: 'live', status: 'active', milestones: null, ...card },
      { _id: 'p2', name: 'Karachi Co', tier: 'registered', territory: null, stage: 'live', status: 'active', milestones: null, ...card, payingNow: 3, tierStatus: 'meets', eligibleTier: 'registered' },
    ] });
    const detail = {
      partner: { _id: 'p1', name: 'Lahore Traders', tier: 'registered', territory: 'Lahore District', stage: 'live', agreement: null },
      scorecard: card, milestones: [{ key: 'paying', label: 'Paying sellers (X)', target: null, actual: 26, met: null }], milestonesApproved: false,
      trend: [{ month: '2026-11', registrations: 2, signups: 3, firstPayments: 1 }],
      reviews: { lastMonthlyAt: null, monthlyDue: true, lastQbrAt: null, qbrDue: true }, log: [],
    };
    api.apiScorecard.mockResolvedValue({ success: true, data: detail });
    api.apiAddPartnerLog.mockResolvedValue({ success: true, data: { ...detail, log: [{ _id: 'l1', type: 'monthly_review', at: '2026-11-22T00:00:00Z', summary: 'Good month', details: null, plan: null, about: null, resolvedAt: null, dueAt: null, snapshot: { payingNow: 26 }, visibleToPartner: true }] } });
    render(<MemoryRouter><ScorecardBoard /></MemoryRouter>);
    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]).getByText('Lahore Traders')).toBeInTheDocument(); // most paying sellers first
    expect(within(rows[1]).getByText('→ Silver')).toBeInTheDocument();
    fireEvent.click(within(rows[1]).getByText('Lahore Traders'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Qualifies for a higher tier')).toBeInTheDocument();
    expect(within(dialog).getByText(/awaiting management approval/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Summary'), { target: { value: 'Good month' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiAddPartnerLog).toHaveBeenCalledWith('p1', expect.objectContaining({ type: 'monthly_review', summary: 'Good month' })));
    expect(await within(dialog).findByText('Good month')).toBeInTheDocument();
  });
});

describe('conduct (B9, B14)', () => {
  it('suspends with a written reason and then only offers reinstatement', async () => {
    const detail = {
      partner: { _id: 'p1', name: 'Lahore Traders', tier: 'registered', territory: null, stage: 'live', agreement: null, status: 'active', suspendedAt: null, suspendReason: null },
      scorecard: card, milestones: [], milestonesApproved: true, trend: [], reviews: { lastMonthlyAt: null, monthlyDue: false, lastQbrAt: null, qbrDue: false }, log: [],
    };
    const suspended = { ...detail, partner: { ...detail.partner, status: 'paused', suspendedAt: '2026-11-22T00:00:00Z', suspendReason: 'Misrepresented Solvexo' } };
    api.apiConduct.mockResolvedValue({ success: true, data: suspended });
    const onChange = vi.fn();
    const { rerender } = render(<MemoryRouter><ScorecardView d={detail as never} manage onChange={onChange} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    expect(screen.getByText(/Only for serious cases/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Suspend' }).at(-1)!);
    expect(api.apiConduct).not.toHaveBeenCalled(); // no reason yet
    fireEvent.change(screen.getByLabelText('Reason (sent to the partner)'), { target: { value: 'Misrepresented Solvexo' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Suspend' }).at(-1)!);
    await waitFor(() => expect(api.apiConduct).toHaveBeenCalledWith('p1', expect.objectContaining({ action: 'suspend', reason: 'Misrepresented Solvexo' })));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(suspended));
    rerender(<MemoryRouter><ScorecardView d={suspended as never} manage onChange={onChange} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Reinstate' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Written warning' })).toBeNull();
  });
});
