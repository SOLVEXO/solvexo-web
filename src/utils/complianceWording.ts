// ALL wording about tax-compliance status lives here, so one rule holds everywhere: the word "compliant" is shown ONLY for a
// registration that a Super Admin approved for live filing, and always with the date. Everything else says what it is not yet.

export type ComplianceState = 'unsupported' | 'researched' | 'rules_verified' | 'sandbox_tested' | 'live_approved';

export const COMPLIANCE_STEPS: { state: ComplianceState; label: string; what: string }[] = [
  { state: 'unsupported', label: 'Not started', what: 'Nobody has researched the rules for this registration yet.' },
  { state: 'researched', label: 'Researched', what: 'The rules were read and their source written down. Not yet checked by an accountant.' },
  { state: 'rules_verified', label: 'Rules verified', what: 'An accountant confirmed the tax rules. Not yet tested with FBR.' },
  { state: 'sandbox_tested', label: 'Sandbox tested', what: "FBR's test system accepted a sample invoice. Not yet approved for live use." },
  { state: 'live_approved', label: 'Approved for live filing', what: 'A Super Admin approved live filing for this registration.' },
];

export const UNVERIFIED_TEMPLATE_LABEL = 'Unverified template';
export const UNVERIFIED_STARTING_POINT = 'unverified starting point, not a confirmed rate';

export function complianceLabel(state: ComplianceState): string {
  return COMPLIANCE_STEPS.find(s => s.state === state)?.label ?? 'Not started';
}

/**
 * The badge text. Only a live-approved registration with an approval date may say "compliant"; any other state (or a missing
 * date) says "Unverified" / what is still missing.
 */
export function complianceBadge(state: ComplianceState, approvedAt: string | null | undefined): string {
  if (state === 'live_approved' && approvedAt) {
    const d = new Date(approvedAt);
    if (!Number.isNaN(d.getTime())) return `Compliant, approved ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  if (state === 'live_approved') return 'Approval date missing: treat as unverified';
  if (state === 'unsupported' || state === 'researched') return `Unverified (${complianceLabel(state).toLowerCase()})`;
  return complianceLabel(state);
}

export const LIVE_CONFIRMATION = 'APPROVE LIVE';
export const PRODUCTION_LOCK_NOTE = 'Live (production) filing stays locked by the system whatever this status says. Only the FBR sandbox is used.';
