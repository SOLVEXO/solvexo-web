import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { AdminTaxCompliance } from './AdminTaxCompliance';
import { complianceBadge, COMPLIANCE_STEPS, UNVERIFIED_STARTING_POINT } from '@/utils/complianceWording';
import { TAX_SUGGESTIONS, taxSuggestionFor } from '@/utils/taxSuggestions';
import type { ComplianceView } from '@/api/services/taxCompliance';

const team = vi.hoisted(() => ({ value: false }));
vi.mock('@/hooks/auth/useCan', () => ({ isTeamAdminSession: () => team.value, isStaffSession: () => false, isReadOnlyAdmin: () => false, can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));
const api = vi.hoisted(() => ({ get: vi.fn(), approve: vi.fn(), verify: vi.fn() }));
vi.mock('@/api/services/taxCompliance', () => ({
  apiGetCompliance: api.get, apiApproveLive: api.approve, apiVerifyRules: api.verify,
  apiMarkResearched: vi.fn(), apiSaveVerifiedRule: vi.fn(), apiRevokeLive: vi.fn(),
}));

const view = (over: Partial<ComplianceView> = {}): ComplianceView => ({
  subjectId: 'solvexo-platform:PK:PK_FBR', country: 'PK', authority: 'PK_FBR', state: 'unsupported',
  snapshot: { registrationNumber: null, rulePackHash: null, adapterVersion: null, tokenFingerprint: null },
  history: [], liveApprovedAt: null, liveApprovedBy: null, complianceAllowsProduction: false, productionLocked: true, verifiedRules: [], ...over,
});
const load = (v: ComplianceView) => api.get.mockResolvedValue({ success: true, data: v });

beforeEach(() => { team.value = false; api.get.mockReset(); api.approve.mockReset(); api.verify.mockReset(); });
afterEach(cleanup);

describe('AC4.6 the word "compliant" is only for a live-approved registration, with its date', () => {
  it('wording helper', () => {
    for (const s of COMPLIANCE_STEPS.map(x => x.state).filter(x => x !== 'live_approved')) expect(/compliant/i.test(complianceBadge(s, '2026-11-11T10:00:00Z'))).toBe(false);
    expect(complianceBadge('unsupported', null)).toContain('Unverified');
    expect(complianceBadge('researched', null)).toContain('Unverified');
    expect(complianceBadge('live_approved', '2026-11-11T10:00:00Z')).toMatch(/^Compliant, approved 11 Nov 2026$/);
    expect(/^Compliant/.test(complianceBadge('live_approved', null))).toBe(false); // no date, no claim
    expect(/^Compliant/.test(complianceBadge('live_approved', 'not a date'))).toBe(false);
  });
  it('the page shows "Unverified" before approval and never the word compliant', async () => {
    for (const state of ['unsupported', 'researched', 'rules_verified', 'sandbox_tested'] as const) {
      load(view({ state })); const { unmount } = render(<AdminTaxCompliance />);
      await waitFor(() => expect(screen.getByTestId('compliance-badge')).toBeTruthy());
      expect(/compliant/i.test(screen.getByTestId('compliance-badge').textContent ?? '')).toBe(false);
      unmount();
    }
  });
  it('after approval it says Compliant with the date', async () => {
    load(view({ state: 'live_approved', liveApprovedAt: '2026-11-11T10:00:00Z' })); render(<AdminTaxCompliance />);
    await waitFor(() => expect(screen.getByTestId('compliance-badge').textContent).toBe('Compliant, approved 11 Nov 2026'));
  });
  it('always tells that live filing stays locked by the system', async () => {
    load(view({ state: 'live_approved', liveApprovedAt: '2026-11-11T10:00:00Z' })); render(<AdminTaxCompliance />);
    await waitFor(() => expect(screen.getByText(/stays locked by the system/)).toBeTruthy());
  });
});

describe('the page', () => {
  it('shows an error with a retry, not an empty state', async () => {
    api.get.mockRejectedValueOnce(new Error('boom')); render(<AdminTaxCompliance />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('boom'));
    load(view()); fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByTestId('compliance-badge')).toBeTruthy());
  });
  it('AC4.3 a team admin can read but sees no buttons to verify or approve', async () => {
    team.value = true; load(view({ state: 'sandbox_tested' })); render(<AdminTaxCompliance />);
    await waitFor(() => expect(screen.getByTestId('compliance-badge')).toBeTruthy());
    expect(screen.getByText(/Only the Super Admin can verify rules/)).toBeTruthy();
    expect(screen.queryByText('Approve live filing')).toBeNull();
    expect(screen.queryByText('Save rule')).toBeNull();
  });
  it('approval needs the exact typed phrase', async () => {
    load(view({ state: 'sandbox_tested' })); api.approve.mockResolvedValue({ data: view({ state: 'live_approved', liveApprovedAt: '2026-11-11T10:00:00Z' }) });
    render(<AdminTaxCompliance />);
    const btn = (await screen.findByText('Approve live filing')).closest('button')!;
    expect(btn.disabled).toBe(true);
    const input = screen.getByLabelText(/to approve live filing/);
    fireEvent.change(input, { target: { value: 'approve live' } }); expect(btn.disabled).toBe(true);
    fireEvent.change(input, { target: { value: 'APPROVE LIVE' } }); expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    await waitFor(() => expect(api.approve).toHaveBeenCalledWith('APPROVE LIVE'));
    await waitFor(() => expect(screen.getByTestId('compliance-badge').textContent).toContain('Compliant, approved'));
  });
  it('verify rules needs a source, an accountant and at least one verified rule', async () => {
    load(view({ state: 'researched', verifiedRules: [] })); render(<AdminTaxCompliance />);
    const btn = (await screen.findByText('Verify rules')).closest('button')!;
    fireEvent.change(screen.getByLabelText('Source of the verification'), { target: { value: 'memo' } });
    fireEvent.change(screen.getByLabelText('Accountant who confirmed'), { target: { value: 'A. Khan' } });
    expect(btn.disabled).toBe(true); // no verified rule yet
    cleanup();
    load(view({ state: 'researched', verifiedRules: [{ country: 'PK', supplyType: 'saas_subscription', treatment: 'taxable', ratePercent: 18, source: 'x', accountantName: 'y', verifiedAt: null }] })); render(<AdminTaxCompliance />);
    const btn2 = (await screen.findByText('Verify rules')).closest('button')!;
    expect(btn2.disabled).toBe(true); // still needs the two fields
    fireEvent.change(screen.getByLabelText('Source of the verification'), { target: { value: 'memo' } });
    fireEvent.change(screen.getByLabelText('Accountant who confirmed'), { target: { value: 'A. Khan' } });
    expect(btn2.disabled).toBe(false);
  });
  it('history shows who, when and the evidence', async () => {
    load(view({ state: 'researched', history: [{ from: 'unsupported', to: 'researched', at: '2026-11-11T10:00:00Z', by: 'u1', byName: 'owner@solvexo.store', source: 'FBR notice', accountantName: null, note: null, auto: false }] }));
    render(<AdminTaxCompliance />);
    await waitFor(() => expect(screen.getByText(/owner@solvexo.store/)).toBeTruthy());
    expect(screen.getByText(/Source: FBR notice/)).toBeTruthy();
  });
});

describe('rate suggestions are templates, never verified', () => {
  it('every suggestion is marked unverified and the seller note says so', () => {
    expect(Object.values(TAX_SUGGESTIONS).every(s => s.verified === false)).toBe(true);
    expect(taxSuggestionFor('pk')).toMatchObject({ rate: 18, verified: false });
    expect(UNVERIFIED_STARTING_POINT).toContain('unverified');
  });
});
