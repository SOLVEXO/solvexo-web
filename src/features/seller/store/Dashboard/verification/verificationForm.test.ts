import { describe, expect, it } from 'vitest';
import type { SellerVerification } from '@/api/services/store';
import {
  normalizeCnic, normalizeNtn, formatProblem, countryGroup, fallbackRequirements, computeMissing,
  documentChecklist, detailsPayload, draftFromVerification, profileFromVerification, EMPTY_PROFILE,
  latestInfoRequest, bannerState, daysLeft, isEditable, type DetailsDraft,
} from './verificationForm';

const draft = (over: Partial<DetailsDraft> = {}): DetailsDraft => ({
  businessType: 'individual', legalBusinessName: 'Noor Fabrics', idDocumentType: 'cnic', idNumber: '35202-1234567-1',
  taxId: '4521873-2', registrationNumber: '', strn: '', businessAddress: 'Lahore', contactName: 'Ayesha',
  contactDesignation: 'Owner', contactEmail: 'a@x.pk', contactPhone: '0300 1234567', ...over,
});

const base = (over: Partial<SellerVerification> = {}): SellerVerification => ({
  country: 'PK', businessType: null, verificationLevel: null, verificationStatus: 'not_started',
  legalBusinessName: null, registrationNumber: null, taxId: null, businessAddress: null, idDocumentType: null,
  authorizedContact: null, documents: [], missingFields: [], missingDocuments: [], canSubmit: false,
  history: [], storeStatus: 'active', rejectionReason: null, ...over,
});

describe('format validators (mirror the API)', () => {
  it('normalises a CNIC with or without dashes, rejects anything else', () => {
    expect(normalizeCnic('3520212345671')).toBe('35202-1234567-1');
    expect(normalizeCnic('35202-1234567-1')).toBe('35202-1234567-1');
    expect(normalizeCnic('35202-123456-1')).toBeNull();
    expect(normalizeCnic('35202A1234567-1')).toBeNull();
  });

  it('normalises an NTN to 7 digits + check digit', () => {
    expect(normalizeNtn('12345678')).toBe('1234567-8');
    expect(normalizeNtn('1234567-8')).toBe('1234567-8');
    expect(normalizeNtn('1234567')).toBeNull();
    expect(normalizeNtn('123456789')).toBeNull();
    expect(normalizeNtn('3520212345671')).toBe('35202-1234567-1');
  });

  it('only flags PK formats, and never an empty field', () => {
    expect(formatProblem('taxId', '123', 'PK')).toMatch(/1234567-8/);
    expect(formatProblem('cnicNumber', '123', 'PK')).toMatch(/12345-1234567-1/);
    expect(formatProblem('taxId', '', 'PK')).toBeNull();
    expect(formatProblem('taxId', '100234567890003', 'AE')).toBeNull();
  });
});

describe('country groups and requirements', () => {
  it('groups PK, GCC and others', () => {
    expect(countryGroup('pk')).toBe('PK');
    expect(countryGroup('AE')).toBe('GCC');
    expect(countryGroup('OM')).toBe('GCC');
    expect(countryGroup('GB')).toBe('OTHER');
  });

  it('PK requires NTN + CNIC for individuals too; companies also need registration', () => {
    const ind = fallbackRequirements('PK', 'individual');
    expect(ind.requiredFields).toEqual(expect.arrayContaining(['taxId', 'cnicNumber']));
    expect(ind.requiredFields).not.toContain('registrationNumber');
    expect(ind.requiredDocuments).toEqual(['owner_id', 'tax_registration', 'address_proof']);
    const co = fallbackRequirements('PK', 'company');
    expect(co.requiredFields).toContain('registrationNumber');
    expect(co.requiredDocuments).toContain('business_registration');
  });

  it('GCC requires trade licence + VAT TRN, VAT certificate optional', () => {
    const r = fallbackRequirements('AE', 'individual');
    expect(r.requiredFields).toEqual(expect.arrayContaining(['registrationNumber', 'taxId']));
    expect(r.requiredFields).not.toContain('cnicNumber');
    expect(r.requiredDocuments).toEqual(['owner_id', 'business_registration', 'address_proof']);
    expect(r.optionalDocuments).toContain('tax_registration');
  });
});

describe('requirements → missing list', () => {
  const req = fallbackRequirements('PK', 'individual');

  it('lists empty required fields, missing docs and unanswered questions', () => {
    const m = computeMissing(req, draft({ taxId: '', businessType: '' }), EMPTY_PROFILE, new Set(['owner_id']));
    expect(m.fields).toEqual(['businessType', 'taxId']);
    expect(m.documents).toEqual(['tax_registration', 'address_proof']);
    expect(m.questions).toContain('sourcing');
    expect(m.questions).not.toContain('otherChannels');
    expect(m.questions).not.toContain('couriers');
  });

  it('branded goods need a brand authorization; regulated categories need a product licence', () => {
    const profile = { ...EMPTY_PROFILE, sellsBrandedGoods: true, regulatedCategories: ['cosmetics' as const] };
    const list = documentChecklist(req, profile);
    expect(list.find(d => d.type === 'brand_authorization')?.required).toBe(true);
    expect(list.find(d => d.type === 'product_licence')?.required).toBe(true);
    const m = computeMissing(req, draft(), profile, new Set(['owner_id', 'tax_registration', 'address_proof']));
    expect(m.documents).toEqual(['brand_authorization', 'product_licence']);
  });

  it('nothing missing when everything is filled', () => {
    const profile = {
      ...EMPTY_PROFILE, sourcing: 'reseller' as const, sellsBrandedGoods: false, premises: 'shop' as const, yearsSelling: '1_3y' as const,
      dispatchTime: 'same_day' as const, returnPolicy: '7_day_returns' as const, monthlyOrders: 'lt_50' as const, bankAccountInOwnName: true,
    };
    const m = computeMissing(req, draft(), profile, new Set(['owner_id', 'tax_registration', 'address_proof']));
    expect(m).toEqual({ fields: [], documents: [], questions: [] });
  });
});

describe('draft ↔ API', () => {
  it('PK payload sends cnicNumber + normalised NTN, ID type CNIC', () => {
    const p = detailsPayload(draft({ idNumber: '3520212345671', taxId: '45218732' }), 'PK');
    expect(p).toMatchObject({ idDocumentType: 'cnic', cnicNumber: '35202-1234567-1', taxId: '4521873-2' });
    expect(p).not.toHaveProperty('idNumber');
  });

  it('keeps a badly formatted value as typed, so the API can explain the problem', () => {
    expect(detailsPayload(draft({ taxId: '12-3' }), 'PK').taxId).toBe('12-3');
  });

  it('GCC payload keeps the ID number as typed in cnicNumber (the API field for every country)', () => {
    const p = detailsPayload(draft({ idDocumentType: 'passport', idNumber: 'N123', taxId: '100234567890003' }), 'AE');
    expect(p).toMatchObject({ idDocumentType: 'passport', cnicNumber: 'N123', taxId: '100234567890003' });
    expect(p).not.toHaveProperty('idNumber');
  });

  it('reads the saved verification into a draft and profile', () => {
    const v = base({ cnicNumber: '35202-1234567-1', taxId: '4521873-2', businessProfile: { sourcing: 'importer', couriers: ['TCS'] } });
    expect(draftFromVerification(v)).toMatchObject({ idDocumentType: 'cnic', idNumber: '35202-1234567-1', taxId: '4521873-2' });
    expect(profileFromVerification(v)).toMatchObject({ sourcing: 'importer', couriers: ['TCS'], regulatedCategories: [] });
  });
});

describe('status and banner', () => {
  const now = new Date('2026-11-12T10:00:00Z');

  it('editable only before submit, when Solvexo asks for info, or after a rejection', () => {
    expect(isEditable('not_started')).toBe(true);
    expect(isEditable('needs_info')).toBe(true);
    expect(isEditable('rejected')).toBe(true);
    expect(isEditable('pending')).toBe(false);
    expect(isEditable('verified')).toBe(false);
  });

  it('picks the latest info request', () => {
    const h = latestInfoRequest([
      { action: 'info_requested', note: 'old', actorRole: 'admin', at: '2026-11-01T00:00:00Z' },
      { action: 'info_requested', note: 'new', actorRole: 'admin', at: '2026-11-05T00:00:00Z' },
      { action: 'submitted', note: null, actorRole: 'seller', at: '2026-11-06T00:00:00Z' },
    ]);
    expect(h?.note).toBe('new');
  });

  it('counts days left', () => {
    expect(daysLeft('2026-11-30T10:00:00Z', now)).toBe(18);
    expect(daysLeft(null, now)).toBeNull();
  });

  it('soft prompt before enforcement; deadline once it starts; limits after it passes; nothing when verified', () => {
    expect(bannerState(base(), now)?.tone).toBe('soft');
    const warn = bannerState(base({ deadline: { enforcementStarted: true, limited: false, dueAt: '2026-11-30T10:00:00Z' } }), now);
    expect(warn?.title).toMatch(/30 Nov 2026 \(18 days left\)/);
    const limited = bannerState(base({ deadline: { enforcementStarted: true, limited: true, dueAt: '2026-11-01T00:00:00Z' } }), now);
    expect(limited?.tone).toBe('error');
    expect(limited?.body).toMatch(/hidden from the Solvexo marketplace/);
    expect(bannerState(base({ verificationStatus: 'verified', deadline: { enforcementStarted: true, limited: false, dueAt: null } }), now)).toBeNull();
  });

  it('needs info shows the admin message; pending is quiet unless limited', () => {
    const s = bannerState(base({
      verificationStatus: 'needs_info',
      history: [{ action: 'info_requested', note: 'Upload the PTA letter', actorRole: 'admin', at: '2026-11-10T00:00:00Z' }],
    }), now);
    expect(s?.body).toContain('Upload the PTA letter');
    expect(bannerState(base({ verificationStatus: 'pending' }), now)).toBeNull();
    expect(bannerState(base({ verificationStatus: 'pending', deadline: { enforcementStarted: true, limited: true, dueAt: null } }), now)?.tone).toBe('info');
  });
});
