import type { BadgeColor } from '@/types';
import type {
  BusinessProfileAnswers, NtnCheckResult, RiskLevel, RiskSeverity, VerificationStatus,
} from '@/api/services/admin/adminSellerTrust';

/** FBR has no public API: an admin checks the NTN on FBR's own page, then records the result. */
export const FBR_NTN_CHECK_URL = 'https://e.fbr.gov.pk/esbn/Verification.aspx';

export const GCC = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'];

export const COUNTRY_NAMES: Record<string, string> = {
  PK: 'Pakistan', AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman',
  GB: 'United Kingdom', US: 'United States', CA: 'Canada', AU: 'Australia',
};
export const countryName = (code: string | null | undefined) => (code ? COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase() : '—');
export const COUNTRY_OPTIONS = ['PK', ...GCC].map(c => ({ value: c, label: COUNTRY_NAMES[c] }));

/** Label for the main tax number: NTN in Pakistan, VAT TRN in the GCC, Tax ID elsewhere. */
export const taxIdLabel = (country: string | null | undefined) => {
  const c = (country ?? 'PK').toUpperCase();
  return c === 'PK' ? 'NTN' : GCC.includes(c) ? 'VAT TRN' : 'Tax ID';
};

export const VERIFICATION: Record<VerificationStatus, { label: string; color: BadgeColor }> = {
  not_started: { label: 'Not started', color: 'gray' },
  pending: { label: 'Waiting for review', color: 'blue' },
  under_review: { label: 'Under review', color: 'blue' },
  needs_info: { label: 'Needs more info', color: 'yellow' },
  verified: { label: 'Verified', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
};
export const VERIFICATION_OPTIONS = (Object.keys(VERIFICATION) as VerificationStatus[]).map(v => ({ value: v, label: VERIFICATION[v].label }));

export const RISK: Record<RiskLevel, { label: string; color: BadgeColor; rank: number }> = {
  high: { label: 'High', color: 'red', rank: 3 },
  medium: { label: 'Medium', color: 'yellow', rank: 2 },
  low: { label: 'Low', color: 'green', rank: 1 },
};
export const RISK_OPTIONS = (['high', 'medium', 'low'] as RiskLevel[]).map(r => ({ value: r, label: RISK[r].label }));

export const SEVERITY: Record<RiskSeverity, { label: string; color: BadgeColor }> = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'yellow' },
  info: { label: 'Info', color: 'gray' },
};

export const NTN_CHECK: Record<NtnCheckResult, { label: string; color: BadgeColor }> = {
  active: { label: 'Active on FBR', color: 'green' },
  not_found: { label: 'Not found on FBR', color: 'red' },
  inactive: { label: 'Inactive on FBR', color: 'yellow' },
};

export const DOC_LABEL: Record<string, string> = {
  owner_id: 'Owner ID (CNIC / passport)',
  tax_registration: 'Tax registration (NTN / VAT certificate)',
  address_proof: 'Address proof',
  business_registration: 'Business registration / trade licence',
  authorization_proof: 'Authorization letter',
  brand_authorization: 'Brand authorization / distributor invoice',
  product_licence: 'Product licence (DRAP / PFA / PTA)',
};
export const docLabel = (t: string) => DOC_LABEL[t] ?? t.replace(/_/g, ' ');

export const FIELD_LABEL: Record<string, string> = {
  legalBusinessName: 'Legal name', businessAddress: 'Business address', idDocumentType: 'ID type',
  'authorizedContact.name': 'Contact name', 'authorizedContact.email': 'Contact email', 'authorizedContact.phone': 'Contact phone',
  registrationNumber: 'Registration / trade licence no.', taxId: 'Tax number', cnicNumber: 'CNIC', strn: 'STRN',
  businessProfile: 'Products and services answers',
};
export const fieldLabel = (f: string) => FIELD_LABEL[f] ?? (f.startsWith('businessProfile.') ? 'Products and services answers' : f);

export const HISTORY_LABEL: Record<string, string> = {
  submitted: 'Submitted for review', resubmitted: 'Resubmitted', under_review: 'Marked under review',
  approved: 'Approved', rejected: 'Rejected', info_requested: 'Asked for more info',
  ntn_checked: 'NTN checked', payout_hold: 'Payouts held', payout_release: 'Payout hold released', reminder_sent: 'Reminder sent',
};
export const historyLabel = (a: string) => HISTORY_LABEL[a] ?? a.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

export const BUSINESS_TYPE: Record<string, string> = { individual: 'Individual', company: 'Company', partnership: 'Partnership' };

export const REGULATED: Record<string, string> = {
  cosmetics: 'Cosmetics or skin care', medicines: 'Medicines or supplements', food: 'Food items', mobile_phones: 'Mobile phones',
};
export const regulatedList = (cats: string[] | undefined | null) => (cats ?? []).map(c => REGULATED[c] ?? c).join(', ');

const ANSWER: Record<string, Record<string, string>> = {
  sourcing: { manufacturer: 'Makes them', reseller: 'Buys and resells', importer: 'Imports', dropshipper: 'Dropshipping' },
  premises: { shop: 'Shop', warehouse: 'Warehouse', home: 'Home' },
  yearsSelling: { lt_6m: 'Under 6 months', '6m_1y': '6 months to 1 year', '1_3y': '1 to 3 years', gt_3y: 'Over 3 years' },
  dispatchTime: { same_day: 'Same day', '1_2_days': '1 to 2 days', '3_plus_days': '3+ days' },
  returnPolicy: { '7_day_returns': '7-day returns', exchange_only: 'Exchange only', no_returns: 'No returns' },
  monthlyOrders: { lt_50: 'Under 50', '50_300': '50 to 300', gt_300: 'Over 300' },
};

const yesNo = (b: boolean | null | undefined, yes = 'Yes', no = 'No') => (b == null ? null : b ? yes : no);

/** Questionnaire answers as label/value rows, in the order the seller answers them. Unanswered → "Not answered". */
export function questionnaireRows(p: BusinessProfileAnswers | null | undefined): { label: string; value: string }[] {
  const a = p ?? {};
  const pick = (k: keyof typeof ANSWER) => { const v = a[k as keyof BusinessProfileAnswers] as string | null | undefined; return v ? ANSWER[k][v] ?? v : null; };
  const rows: [string, string | null][] = [
    ['How they get products', pick('sourcing')],
    ['Branded products', yesNo(a.sellsBrandedGoods)],
    ['Regulated products', a.regulatedCategories ? (a.regulatedCategories.length ? regulatedList(a.regulatedCategories) : 'None') : null],
    ['Works from', pick('premises')],
    ['Selling for', pick('yearsSelling')],
    ['Other channels', a.otherChannels?.length ? a.otherChannels.join(', ') : null],
    ['Couriers', a.couriers?.length ? a.couriers.join(', ') : null],
    ['Dispatch', pick('dispatchTime')],
    ['Returns', pick('returnPolicy')],
    ['Orders per month', pick('monthlyOrders')],
    ['Bank account', yesNo(a.bankAccountInOwnName, "Owner's or business's own", "Someone else's")],
  ];
  return rows.map(([label, value]) => ({ label, value: value ?? 'Not answered' }));
}

const DAY = 86_400_000;

/** Whole days until `dueAt` (negative once passed); null without a deadline. */
export function daysLeft(dueAt: string | null | undefined, now = Date.now()): number | null {
  if (!dueAt) return null;
  return Math.ceil((new Date(dueAt).getTime() - now) / DAY);
}

export function deadlineText(dueAt: string | null | undefined, now = Date.now()): string | null {
  const d = daysLeft(dueAt, now);
  if (d == null) return null;
  if (d > 1) return `${d} days left`;
  if (d === 1) return '1 day left';
  if (d === 0) return 'Due today';
  return `${-d} day${d === -1 ? '' : 's'} overdue`;
}

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function relativeDays(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const d = Math.floor((now - new Date(iso).getTime()) / DAY);
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
}

/** Prefilled WhatsApp text for a reminder. We only open click-to-chat; nothing is sent automatically. */
export function whatsappReminderText(storeName: string, dueAt: string | null | undefined): string {
  const by = dueAt ? ` by ${fmtDate(dueAt)}` : '';
  return `Hello, this is Solvexo. Please verify your business for "${storeName}"${by}: open your store dashboard and go to Verify your business. `
    + 'Until it is verified your store is hidden from the Solvexo marketplace and card payouts are held. Cash on delivery keeps working. Reply here if you need help.';
}
