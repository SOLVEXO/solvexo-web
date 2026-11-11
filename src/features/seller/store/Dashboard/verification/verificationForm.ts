import type {
  BusinessProfile, BusinessType, IdDocumentType, SellerVerification, SellerVerificationStatus,
  VerificationDocType, VerificationHistoryItem, VerificationRequirements,
} from '@/api/services/store';

// Pure helpers behind "Verify your business". Format checks here are hints
// that mirror the API's validators (PK CNIC / NTN); the API stays the
// authority and its error messages are what the page shows on save.

export const GCC_COUNTRIES = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'] as const;

export type CountryGroup = 'PK' | 'GCC' | 'OTHER';

export function countryGroup(country: string | null | undefined): CountryGroup {
  const cc = String(country ?? '').trim().toUpperCase();
  if (cc === 'PK' || cc === '') return 'PK';
  return (GCC_COUNTRIES as readonly string[]).includes(cc) ? 'GCC' : 'OTHER';
}

const digits = (v: string) => v.replace(/\D/g, '');

/** CNIC: 13 digits, with or without dashes → `12345-1234567-1`; null when it isn't 13 digits. */
export function normalizeCnic(value: string): string | null {
  const d = digits(value);
  if (d.length !== 13 || /[^\d\s-]/.test(value)) return null;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/** NTN: 7 digits + a check digit (`1234567-8`, `12345678` accepted) → `1234567-8`, or a 13-digit CNIC used as NTN
 *  (FBR issues individuals' NTNs on their CNIC) → `12345-1234567-1`; null otherwise. Mirrors the API. */
export function normalizeNtn(value: string): string | null {
  const asCnic = normalizeCnic(value);
  if (asCnic) return asCnic;
  const d = digits(value);
  if (d.length !== 8 || /[^\d\s-]/.test(value)) return null;
  return `${d.slice(0, 7)}-${d.slice(7)}`;
}

export const CNIC_HINT = '13 digits, as on your card, like 12345-1234567-1';
export const NTN_HINT = 'NTN has 7 digits and a check digit, like 1234567-8. If FBR issued your NTN on your CNIC, enter your 13-digit CNIC.';

/** Inline format message for a field, or null when it looks right (or is empty). */
export function formatProblem(field: 'cnicNumber' | 'taxId', value: string, country: string | null | undefined): string | null {
  if (!value.trim() || countryGroup(country) !== 'PK') return null;
  if (field === 'cnicNumber') return normalizeCnic(value) ? null : `CNIC should be ${CNIC_HINT}.`;
  return normalizeNtn(value) ? null : NTN_HINT;
}

// ── The editable draft ────────────────────────────────────────────────────────

export interface DetailsDraft {
  businessType: BusinessType | '';
  legalBusinessName: string;
  idDocumentType: IdDocumentType | '';
  /** CNIC for PK; the ID number (Emirates ID / national ID / passport) elsewhere. */
  idNumber: string;
  taxId: string;
  registrationNumber: string;
  strn: string;
  businessAddress: string;
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
}

export const EMPTY_PROFILE: BusinessProfile = {
  sourcing: null, sellsBrandedGoods: null, regulatedCategories: [], premises: null, yearsSelling: null,
  otherChannels: [], couriers: [], dispatchTime: null, returnPolicy: null, monthlyOrders: null, bankAccountInOwnName: null,
};

export function draftFromVerification(v: SellerVerification): DetailsDraft {
  const pk = countryGroup(v.country) === 'PK';
  return {
    businessType: v.businessType ?? '',
    legalBusinessName: v.legalBusinessName ?? '',
    idDocumentType: v.idDocumentType ?? (pk ? 'cnic' : ''),
    idNumber: v.cnicNumber ?? '',
    taxId: v.taxId ?? '',
    registrationNumber: v.registrationNumber ?? '',
    strn: v.strn ?? '',
    businessAddress: v.businessAddress ?? '',
    contactName: v.authorizedContact?.name ?? '',
    contactDesignation: v.authorizedContact?.designation ?? '',
    contactEmail: v.authorizedContact?.email ?? '',
    contactPhone: v.authorizedContact?.phone ?? '',
  };
}

export function profileFromVerification(v: SellerVerification): BusinessProfile {
  const p = v.businessProfile ?? {};
  return {
    ...EMPTY_PROFILE,
    ...Object.fromEntries(Object.entries(p).filter(([, val]) => val !== undefined)),
    regulatedCategories: p.regulatedCategories ?? [],
    otherChannels: p.otherChannels ?? [],
    couriers: p.couriers ?? [],
  } as BusinessProfile;
}

/** PATCH body for step 1. PK: the ID number goes as `cnicNumber` (normalised when valid), and the ID type is always CNIC. */
export function detailsPayload(d: DetailsDraft, country: string | null | undefined) {
  const pk = countryGroup(country) === 'PK';
  const t = (s: string) => s.trim();
  const payload: Record<string, unknown> = {
    legalBusinessName: t(d.legalBusinessName),
    registrationNumber: t(d.registrationNumber),
    businessAddress: t(d.businessAddress),
    authorizedContact: {
      name: t(d.contactName), designation: t(d.contactDesignation),
      email: t(d.contactEmail), phone: t(d.contactPhone),
    },
  };
  if (d.businessType) payload.businessType = d.businessType;
  if (pk) {
    payload.idDocumentType = 'cnic';
    payload.cnicNumber = normalizeCnic(d.idNumber) ?? t(d.idNumber);
    payload.taxId = normalizeNtn(d.taxId) ?? t(d.taxId);
    payload.strn = t(d.strn);
  } else {
    if (d.idDocumentType) payload.idDocumentType = d.idDocumentType;
    // The API keeps the owner's ID number in `cnicNumber` for every country (free text outside Pakistan).
    payload.cnicNumber = t(d.idNumber);
    payload.taxId = t(d.taxId);
  }
  return payload;
}

// ── Requirements → what's still missing ───────────────────────────────────────

/** Questionnaire answers the API requires before submit (all but otherChannels/couriers). */
export const REQUIRED_PROFILE_FIELDS: (keyof BusinessProfile)[] = [
  'sourcing', 'sellsBrandedGoods', 'premises', 'yearsSelling', 'dispatchTime', 'returnPolicy', 'monthlyOrders', 'bankAccountInOwnName',
];

/** Local fallback when the API returns no requirement set — mirrors the spec so the page still renders sensibly. */
export function fallbackRequirements(country: string | null | undefined, businessType: BusinessType | null): VerificationRequirements {
  const group = countryGroup(country);
  const business = businessType === 'company' || businessType === 'partnership';
  const basic = ['legalBusinessName', 'businessAddress', 'idDocumentType', 'authorizedContact.name', 'authorizedContact.email', 'authorizedContact.phone'];
  if (group === 'PK') {
    return {
      country: 'PK', businessType, verificationLevel: business ? 'business' : 'basic',
      requiredFields: [...basic, 'taxId', 'cnicNumber', ...(business ? ['registrationNumber'] : [])],
      requiredDocuments: ['owner_id', 'tax_registration', 'address_proof', ...(business ? ['business_registration' as const] : [])],
      optionalDocuments: ['authorization_proof'],
    };
  }
  if (group === 'GCC') {
    return {
      country: String(country).toUpperCase(), businessType, verificationLevel: business ? 'business' : 'basic',
      requiredFields: [...basic, 'registrationNumber', 'taxId'],
      requiredDocuments: ['owner_id', 'business_registration', 'address_proof'],
      optionalDocuments: ['tax_registration', 'authorization_proof'],
    };
  }
  return {
    country: String(country).toUpperCase(), businessType, verificationLevel: business ? 'business' : 'basic',
    requiredFields: [...basic, ...(business ? ['registrationNumber', 'taxId'] : [])],
    requiredDocuments: ['owner_id', 'address_proof', ...(business ? ['business_registration' as const, 'tax_registration' as const] : [])],
    optionalDocuments: ['authorization_proof'],
  };
}

/** Documents the questionnaire answers add (the API applies the same rule). */
export function profileDocuments(p: BusinessProfile): VerificationDocType[] {
  const out: VerificationDocType[] = [];
  if (p.sellsBrandedGoods === true) out.push('brand_authorization');
  if (p.regulatedCategories.length > 0) out.push('product_licence');
  return out;
}

/** Every document type to list, in display order, with whether it's required. */
export function documentChecklist(req: VerificationRequirements, profile: BusinessProfile): { type: VerificationDocType; required: boolean }[] {
  const required = new Set<VerificationDocType>([...req.requiredDocuments, ...profileDocuments(profile)]);
  const order: VerificationDocType[] = ['owner_id', 'tax_registration', 'address_proof', 'business_registration', 'brand_authorization', 'product_licence', 'authorization_proof'];
  const listed = new Set<VerificationDocType>([...required, ...req.optionalDocuments]);
  return order.filter(t => listed.has(t)).map(type => ({ type, required: required.has(type) }));
}

const DRAFT_PATH: Record<string, (d: DetailsDraft) => string> = {
  legalBusinessName: d => d.legalBusinessName,
  businessAddress: d => d.businessAddress,
  idDocumentType: d => d.idDocumentType,
  cnicNumber: d => d.idNumber,
  idNumber: d => d.idNumber,
  taxId: d => d.taxId,
  registrationNumber: d => d.registrationNumber,
  strn: d => d.strn,
  'authorizedContact.name': d => d.contactName,
  'authorizedContact.designation': d => d.contactDesignation,
  'authorizedContact.email': d => d.contactEmail,
  'authorizedContact.phone': d => d.contactPhone,
};

export interface MissingItems {
  fields: string[];
  documents: VerificationDocType[];
  questions: (keyof BusinessProfile)[];
}

/** What's still missing for this draft — shown as a checklist; the API re-checks on submit. */
export function computeMissing(
  req: VerificationRequirements,
  draft: DetailsDraft,
  profile: BusinessProfile,
  uploaded: Set<VerificationDocType>,
): MissingItems {
  const fields = req.requiredFields.filter(path => {
    if (path.startsWith('businessProfile.')) return false;
    const read = DRAFT_PATH[path];
    return read ? !read(draft).trim() : false;
  });
  if (!draft.businessType) fields.unshift('businessType');
  const documents = documentChecklist(req, profile).filter(d => d.required && !uploaded.has(d.type)).map(d => d.type);
  const questions = REQUIRED_PROFILE_FIELDS.filter(k => profile[k] === null || profile[k] === undefined);
  // regulatedCategories: an empty list is a valid answer ("None of these").
  return { fields, documents, questions };
}

// ── Labels ────────────────────────────────────────────────────────────────────

export function fieldLabel(path: string, country: string | null | undefined): string {
  const group = countryGroup(country);
  switch (path) {
    case 'businessType': return 'Seller type';
    case 'legalBusinessName': return 'Legal or business name';
    case 'businessAddress': return 'Business address';
    case 'idDocumentType': return 'ID type';
    case 'cnicNumber': return 'CNIC number';
    case 'idNumber': return 'ID number';
    case 'taxId': return group === 'PK' ? 'NTN' : group === 'GCC' ? 'VAT TRN' : 'Tax ID';
    case 'registrationNumber': return group === 'PK' ? 'SECP or firm registration number' : group === 'GCC' ? 'Trade licence number' : 'Registration number';
    case 'strn': return 'STRN';
    case 'authorizedContact.name': return 'Contact name';
    case 'authorizedContact.designation': return 'Contact designation';
    case 'authorizedContact.email': return 'Contact email';
    case 'authorizedContact.phone': return 'Contact phone';
    default: return path.replace(/^businessProfile\./, '').replace(/([A-Z])/g, ' $1').toLowerCase();
  }
}

export function documentLabel(type: VerificationDocType, country: string | null | undefined): string {
  const group = countryGroup(country);
  switch (type) {
    case 'owner_id': return group === 'PK' ? 'CNIC front and back' : group === 'GCC' ? 'Emirates ID, national ID or passport' : 'Government ID or passport';
    case 'tax_registration': return group === 'PK' ? 'NTN certificate from FBR' : group === 'GCC' ? 'VAT registration certificate' : 'Tax registration certificate';
    case 'address_proof': return 'Address proof: utility bill or shop rent agreement';
    case 'business_registration': return group === 'PK' ? 'SECP or firm registration' : group === 'GCC' ? 'Trade licence' : 'Business registration';
    case 'authorization_proof': return 'Authorization letter (if you are not the owner)';
    case 'brand_authorization': return 'Distributor invoice or brand authorization';
    case 'product_licence': return 'Product licence (DRAP, PFA, PTA or similar)';
  }
}

export const QUESTION_LABELS: Record<keyof BusinessProfile, string> = {
  sourcing: 'How you get your products',
  sellsBrandedGoods: 'Branded products',
  regulatedCategories: 'Regulated products',
  premises: 'Where you work from',
  yearsSelling: 'How long you have been selling',
  otherChannels: 'Other places you sell',
  couriers: 'Couriers',
  dispatchTime: 'Dispatch time',
  returnPolicy: 'Return policy',
  monthlyOrders: 'Expected orders per month',
  bankAccountInOwnName: 'Bank account name',
};

/** Which licence a regulated category needs, shown next to the upload. */
export const LICENCE_HINTS: Record<string, string> = {
  cosmetics: 'Cosmetics need a DRAP registration or enlistment.',
  medicines: 'Medicines and supplements need a DRAP licence.',
  food: 'Food items need a PFA (Punjab Food Authority) or provincial food licence.',
  mobile_phones: 'Mobile phones need PTA approval.',
};

// ── Status, deadline, admin messages ──────────────────────────────────────────

export const EDITABLE_STATUSES: SellerVerificationStatus[] = ['not_started', 'needs_info', 'rejected'];

export function isEditable(status: SellerVerificationStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/** The latest "please send more info" message from Solvexo, if any. */
export function latestInfoRequest(history: VerificationHistoryItem[] | undefined): VerificationHistoryItem | null {
  const list = (history ?? []).filter(h => h.action === 'info_requested');
  if (list.length === 0) return null;
  return list.reduce((a, b) => (new Date(b.at).getTime() >= new Date(a.at).getTime() ? b : a));
}

/** Whole days until `dueAt` (0 on the day, negative once passed); null without a date. */
export function daysLeft(dueAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - now.getTime()) / 86_400_000);
}

export function formatDueDate(dueAt: string | null | undefined): string {
  if (!dueAt) return '';
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Banner copy (dashboard + top of the verification page) ────────────────────

export interface BannerState {
  tone: 'soft' | 'warning' | 'error' | 'info';
  title: string;
  body: string;
  cta: string | null;
  /** Only the soft "get the badge" prompt can be dismissed. */
  dismissible: boolean;
}

export const LIMITS_SENTENCE = 'your store is hidden from the Solvexo marketplace and card payouts are held. Cash on delivery and your own store link keep working.';

/** What to tell the seller about verification right now; null = say nothing. */
export function bannerState(v: Pick<SellerVerification, 'verificationStatus' | 'deadline' | 'history' | 'rejectionReason'>, now: Date = new Date()): BannerState | null {
  const status = v.verificationStatus;
  const deadline = v.deadline;
  const started = !!deadline?.enforcementStarted;
  const limited = started && !!deadline?.limited;
  if (status === 'verified') return null;

  if (status === 'pending' || status === 'under_review') {
    if (!limited) return null;
    return {
      tone: 'info', title: 'Your business verification is being reviewed',
      body: `Until Solvexo approves it, ${LIMITS_SENTENCE}`, cta: 'View status', dismissible: false,
    };
  }
  if (status === 'needs_info') {
    const msg = latestInfoRequest(v.history)?.note;
    return {
      tone: 'warning', title: 'Solvexo needs more information to verify your business',
      body: [msg ? `"${msg}"` : 'Open the verification page to see what is needed.', limited ? `Until you reply, ${LIMITS_SENTENCE}` : ''].filter(Boolean).join(' '),
      cta: 'Reply now', dismissible: false,
    };
  }
  if (status === 'rejected') {
    return {
      tone: 'error', title: 'Your business verification was not approved',
      body: [v.rejectionReason ? `Reason: ${v.rejectionReason}.` : '', 'Fix the details and resubmit.', limited ? `Until then, ${LIMITS_SENTENCE}` : ''].filter(Boolean).join(' '),
      cta: 'Fix and resubmit', dismissible: false,
    };
  }

  // not_started
  if (limited) {
    return {
      tone: 'error', title: 'Your store is limited until you verify your business',
      body: `The verification deadline has passed, so ${LIMITS_SENTENCE}`, cta: 'Verify now', dismissible: false,
    };
  }
  if (started && deadline?.dueAt) {
    const n = daysLeft(deadline.dueAt, now) ?? 0;
    const left = n <= 0 ? 'due today' : n === 1 ? '1 day left' : `${n} days left`;
    return {
      tone: 'warning', title: `Verify your business by ${formatDueDate(deadline.dueAt)} (${left})`,
      body: `After that date, until you verify, ${LIMITS_SENTENCE}`, cta: 'Verify now', dismissible: false,
    };
  }
  return {
    tone: 'soft', title: 'Get the Verified business badge',
    body: 'Verified stores show a badge buyers trust and are listed on the Solvexo marketplace. It takes about 10 minutes.',
    cta: 'Verify now', dismissible: true,
  };
}
