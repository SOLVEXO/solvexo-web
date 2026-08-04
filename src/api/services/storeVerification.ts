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

export interface AuthorizedContact {
  name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
}

export interface VerificationDocumentView {
  type: VerificationDocumentType;
  fileName: string;
  uploadedAt: string;
  /** Short-lived signed Cloudinary URL, generated fresh on every fetch — never store/cache this. */
  viewUrl: string;
}

export interface VerificationHistoryEntry {
  action: 'submitted' | 'resubmitted' | 'under_review' | 'approved' | 'rejected';
  note: string | null;
  actorId: string | null;
  actorRole: 'seller' | 'admin';
  at: string;
}

export interface SellerVerificationData {
  businessType: BusinessType | null;
  legalBusinessName: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  businessAddress: string | null;
  idDocumentType: IdDocumentType | null;
  authorizedContact: AuthorizedContact | null;
  documents: VerificationDocumentView[];
  history: VerificationHistoryEntry[];
  submitted: boolean;
  requiredDocumentTypes: VerificationDocumentType[];
  storeStatus: string;
  rejectionReason: string | null;
}

export interface UpdateVerificationPayload {
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

/** Locks the submission in for admin review — first time ('submitted') or
 *  after a rejection ('resubmitted', flips the store back to 'pending'). */
export function apiSubmitVerification(storeId: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.STORE.VERIFICATION_SUBMIT(storeId));
}
