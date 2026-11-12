// Test / screenshot fixtures for the Seller trust admin screens (shapes match adminSellerTrust.ts).
import type {
  ClientBusinessProfile, SellerTrustDetail, SellerTrustListData, SellerTrustRow, SellerTrustSummary,
} from '@/api/services/admin/adminSellerTrust';

export const summaryFixture = (over: Partial<SellerTrustSummary> = {}): SellerTrustSummary => ({
  totalStores: 148, withNtn: 31, withoutNtn: 117,
  byStatus: { not_started: 125, pending: 4, under_review: 2, needs_info: 2, verified: 12, rejected: 3 },
  highRisk: 9, mediumRisk: 40, waitingReview: 6, deadlinePassed: 0,
  enforcement: { startedAt: null, graceDays: 30, firstDueAt: null },
  ...over,
});

export const rowFixture = (over: Partial<SellerTrustRow> = {}): SellerTrustRow => ({
  storeId: 'st1', storeName: 'GlowSkin Store', slug: 'glowskin', status: 'active',
  sellerId: 'se1', sellerName: 'Bilal Ahmed', sellerEmail: 'bilal.glow@example.com', sellerPhone: '0321 7654321',
  country: 'PK', businessType: 'individual', hasNtn: false, ntn: null, verificationStatus: 'not_started',
  submittedAt: null, riskLevel: 'high',
  riskReasons: [{ code: 'regulated_no_licence', label: 'Sells cosmetics without DRAP licence', severity: 'high' }],
  dueAt: null, limited: false, payoutHold: null, categories: ['cosmetics'], createdAt: '2026-11-02T10:00:00Z',
  ...over,
});

export const listFixture = (items: SellerTrustRow[]): SellerTrustListData => ({ items, total: items.length, page: 1, limit: 20 });

export const detailFixture = (over: Partial<SellerTrustDetail> = {}): SellerTrustDetail => ({
  storeId: 'st3', storeName: 'Tech Corner', slug: 'techcorner', status: 'active', country: 'PK', businessType: 'individual',
  createdAt: '2026-10-28T09:00:00Z', categoryName: 'Electronics', invoiceTaxId: '7310942-5',
  seller: { id: 'se3', name: 'Usman Raza', email: 'usman@techcorner.example', phone: '0333 9988776' },
  verificationStatus: 'pending', submittedAt: '2026-11-09T09:00:00Z', rejectionReason: null,
  verification: {
    legalBusinessName: 'Usman Raza', registrationNumber: null, taxId: '7310942-5', strn: null, cnicNumber: '35202-1234567-1',
    businessAddress: '12 Hall Road, Lahore', idDocumentType: 'cnic',
    authorizedContact: { name: 'Usman Raza', designation: 'Owner', email: 'usman@techcorner.example', phone: '0333 9988776' },
    businessProfile: {
      sourcing: 'reseller', sellsBrandedGoods: true, regulatedCategories: ['mobile_phones'], premises: 'shop', yearsSelling: '1_3y',
      otherChannels: ['https://instagram.com/techcorner'], couriers: ['TCS', 'Leopards'], dispatchTime: '1_2_days',
      returnPolicy: '7_day_returns', monthlyOrders: '50_300', bankAccountInOwnName: true,
    },
    ntnCheck: null,
    history: [{ action: 'submitted', note: null, actorRole: 'seller', at: '2026-11-09T09:00:00Z' }],
  },
  documents: [
    { type: 'owner_id', required: true, state: 'uploaded', fileName: 'CNIC front and back.pdf', uploadedAt: '2026-11-09T08:50:00Z', viewUrl: 'https://files.test/signed/cnic.pdf' },
    { type: 'tax_registration', required: true, state: 'uploaded', fileName: 'NTN certificate.pdf', uploadedAt: '2026-11-09T08:52:00Z', viewUrl: 'https://files.test/signed/ntn.pdf' },
    { type: 'address_proof', required: true, state: 'uploaded', fileName: 'Electricity bill.jpg', uploadedAt: '2026-11-09T08:53:00Z', viewUrl: 'https://files.test/signed/bill.jpg' },
    { type: 'brand_authorization', required: true, state: 'uploaded', fileName: 'Distributor invoice.pdf', uploadedAt: '2026-11-09T08:54:00Z', viewUrl: 'https://files.test/signed/inv.pdf' },
    { type: 'product_licence', required: true, state: 'missing', fileName: null, uploadedAt: null, viewUrl: null },
  ],
  requirements: { requiredFields: [], requiredDocuments: ['owner_id', 'tax_registration', 'address_proof', 'brand_authorization', 'product_licence'], optionalDocuments: [] },
  missingFields: [], missingDocuments: ['product_licence'],
  riskLevel: 'medium',
  riskReasons: [
    { code: 'regulated_no_licence', label: 'Sells mobile phones without a PTA approval', severity: 'high' },
    { code: 'not_verified', label: 'Not verified yet', severity: 'medium' },
  ],
  deadline: { dueAt: '2026-11-30T00:00:00Z', limited: false, enforcementStarted: true },
  payoutHold: null, stripeConnect: false, lastTrustReminderAt: null,
  ...over,
});

export const businessProfileFixture = (over: Partial<ClientBusinessProfile> = {}): ClientBusinessProfile => ({
  seller: {
    name: 'Bilal Ahmed', email: 'bilal.glow@example.com', emailVerified: true, phone: '0321 7654321', address: 'Lahore',
    authProvider: 'google', createdAt: '2026-11-02T10:00:00Z', languagePreference: 'en', status: 'active',
    acquisition: { source: 'facebook', medium: 'paid', campaign: 'Nov launch', landingPage: '/start', partnerCode: null, capturedAt: '2026-11-02T09:58:00Z' },
    onboardingAnswers: { sellerType: 'individual', productTypes: ['cosmetics', 'skin_care'], country: 'PK', currency: 'PKR' },
  },
  stores: [{
    storeId: 'st1', name: 'GlowSkin Store', slug: 'glowskin', status: 'active', country: 'PK', businessType: 'individual',
    categoryName: 'Beauty', contactEmail: 'hello@glowskin.example', contactPhone: '0321 7654321', invoiceTaxId: null, taxRegistered: false,
    verificationStatus: 'not_started', hasNtn: false, ntn: null, legalBusinessName: null, cnicNumber: null, riskLevel: 'high',
    riskReasons: [
      { code: 'regulated_no_licence', label: 'Sells cosmetics without DRAP licence', severity: 'high' },
      { code: 'pk_no_ntn', label: 'No NTN or CNIC on file', severity: 'medium' },
      { code: 'new_store', label: 'Store is 9 days old', severity: 'info' },
    ],
    dueAt: '2026-11-30T00:00:00Z', limited: false, payoutHold: null, createdAt: '2026-11-02T10:00:00Z',
  }],
  ...over,
});
