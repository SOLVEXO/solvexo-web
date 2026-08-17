import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type BusinessType = 'individual' | 'company' | 'partnership';
export type IdDocumentType = 'cnic' | 'passport' | 'national_id';
export type VerificationDocumentType =
  | 'business_registration'
  | 'tax_registration'
  | 'address_proof'
  | 'owner_id'
  | 'authorization_proof';

/** Mirrors the backend's Store.verificationStatus — independent of the
 *  store's marketplace `storeStatus` (see StoreVerification.tsx). */
export type VerificationStatus = 'not_started' | 'pending' | 'under_review' | 'verified' | 'rejected';
export type VerificationLevel = 'basic' | 'business' | 'enhanced';

export interface AuthorizedContact {
  name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
}

export type DocumentState = 'missing' | 'uploaded' | 'not_required';

export interface VerificationDocumentView {
  type: VerificationDocumentType;
  required: boolean;
  state: DocumentState;
  fileName: string | null;
  uploadedAt: string | null;
  /** Short-lived signed Cloudinary URL, generated fresh on every fetch — never store/cache this. */
  viewUrl: string | null;
}

export interface VerificationHistoryEntry {
  action: 'submitted' | 'resubmitted' | 'under_review' | 'approved' | 'rejected';
  note: string | null;
  actorId: string | null;
  actorRole: 'seller' | 'admin';
  at: string;
}

export interface SellerVerificationData {
  country: string;
  businessType: BusinessType | null;
  verificationLevel: VerificationLevel;
  verificationStatus: VerificationStatus;
  legalBusinessName: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  businessAddress: string | null;
  idDocumentType: IdDocumentType | null;
  authorizedContact: AuthorizedContact | null;
  /** The FULL checklist (required + optional) — backend-computed, always
   *  render this directly rather than re-deriving which docs apply. */
  documents: VerificationDocumentView[];
  missingFields: string[];
  missingDocuments: VerificationDocumentType[];
  canSubmit: boolean;
  history: VerificationHistoryEntry[];
  storeStatus: string;
  rejectionReason: string | null;
}

export interface VerificationRequirements {
  country: string;
  businessType: BusinessType | null;
  verificationLevel: VerificationLevel;
  requiredFields: string[];
  requiredDocuments: VerificationDocumentType[];
  optionalDocuments: VerificationDocumentType[];
}

export interface UpdateVerificationPayload {
  country?: string;
  businessType?: BusinessType;
  legalBusinessName?: string;
  registrationNumber?: string;
  taxId?: string;
  businessAddress?: string;
  idDocumentType?: IdDocumentType;
  authorizedContact?: Partial<AuthorizedContact>;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export function apiGetVerification(storeId: string) {
  return client.get<never, ApiResponse<SellerVerificationData>>(ENDPOINTS.STORE.VERIFICATION(storeId));
}

/** Live "what would apply" preview — call as the seller picks/changes
 *  country or business type, before saving, so the document checklist can
 *  update immediately. Omit either param to preview against what's already
 *  saved on the store. */
export function apiGetVerificationRequirements(storeId: string, params?: { country?: string; businessType?: BusinessType }) {
  return client.get<never, ApiResponse<VerificationRequirements>>(ENDPOINTS.STORE.VERIFICATION_REQUIREMENTS(storeId), { params });
}

/** Same preview, but usable before a store exists — onboarding doesn't
 *  create the store until the final submit step. */
export function apiPreviewVerificationRequirementsStandalone(params?: { country?: string; businessType?: BusinessType }) {
  return client.get<never, ApiResponse<VerificationRequirements>>(ENDPOINTS.STORE.VERIFICATION_REQUIREMENTS_PREVIEW, { params });
}

export function apiUpdateVerification(storeId: string, payload: UpdateVerificationPayload) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.STORE.VERIFICATION(storeId), payload);
}

/** Attaches an already-uploaded (private Cloudinary) document to this store's
 *  verification record — call after `useUpload('private').upload(file, 'kyc_document')`. */
export function apiAttachVerificationDocument(
  storeId: string,
  type: VerificationDocumentType,
  doc: { publicId: string; resourceType: string; fileName: string },
) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.STORE.VERIFICATION_DOCUMENTS(storeId), { type, ...doc });
}

/** Locks the submission in for admin review — first time or after a
 *  rejection ('resubmit'). Backend independently recomputes and rejects
 *  with a clear message if anything required is still missing. */
export function apiSubmitVerification(storeId: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.STORE.VERIFICATION_SUBMIT(storeId));
}
