import client from '../client';
import { ENDPOINTS } from '../endpoints';

// A seller's request for their own white-label, branded store app — distinct
// from Solvexo's own single POS app (see store.ts's apiGetPosAppInfo), which
// is a Google Play paid listing shown as a QR code with no request/Stripe
// flow at all. Android/iOS are tracked independently here since each has its
// own review pipeline/timeline (Apple's is typically slower) — see backend
// schema.

export const STORE_APP_PLATFORM_STATUSES = [
  'not_requested', 'pending', 'in_review', 'building', 'submitted', 'published', 'rejected',
] as const;
export type StoreAppPlatformStatus = (typeof STORE_APP_PLATFORM_STATUSES)[number];

// Each platform is its own paid build — 'unpaid' until a PaymentIntent is
// created ('pending'), then 'paid' once Stripe confirms it server-side.
export const STORE_APP_PLATFORM_PAYMENT_STATUSES = ['unpaid', 'pending', 'paid'] as const;
export type StoreAppPlatformPaymentStatus = (typeof STORE_APP_PLATFORM_PAYMENT_STATUSES)[number];

export interface StoreAppPlatformState {
  requested:          boolean;
  status:             StoreAppPlatformStatus;
  storeUrl:           string | null;
  rejectionReason:    string | null;
  publishedAt:        string | null;
  paymentStatus:      StoreAppPlatformPaymentStatus;
  stripePaymentIntentId: string | null;
}

export interface StoreAppRequest {
  _id:                    string;
  storeId:                string;
  sellerId:               string;
  appName:                string;
  shortDescription:       string;
  fullDescription:        string;
  iconUrl:                string | null;
  featureGraphicUrl:      string | null;
  android:                StoreAppPlatformState;
  ios:                    StoreAppPlatformState;
  adminNotes:             string | null;
  reviewedBy:             string | null;
  createdAt:              string;
  updatedAt:              string;
}

/** Admin-list/detail rows only — joined server-side so admin can always see
 *  which store sent the request without a separate lookup. */
export interface AdminStoreAppRequest extends StoreAppRequest {
  storeName: string | null;
  storeSlug: string | null;
}

export interface CreateStoreAppRequestFields {
  appName:          string;
  shortDescription: string;
  fullDescription:  string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── Seller ────────────────────────────────────────────────────────────────

/** POST /api/store-app-requests/:storeId — multipart. `iconFile`/
 *  `featureGraphicFile` are both optional (a seller can submit without them
 *  and add them later); when provided, Google Play spec applies: icon
 *  512×512 PNG/JPEG ≤1MB, feature graphic 1024×500 PNG/JPEG ≤15MB —
 *  enforced server-side against the real decoded pixel dimensions. */
export function apiCreateStoreAppRequest(
  storeId: string,
  fields: CreateStoreAppRequestFields,
  iconFile?: File | null,
  featureGraphicFile?: File | null,
) {
  const fd = new FormData();
  if (iconFile) fd.append('icon', iconFile);
  if (featureGraphicFile) fd.append('featureGraphic', featureGraphicFile);
  Object.entries(fields).forEach(([key, value]) => fd.append(key, String(value)));
  return client.post<never, ApiResponse<StoreAppRequest>>(ENDPOINTS.STORE_APP_REQUESTS.CREATE(storeId), fd);
}

/** GET /api/store-app-requests/:storeId — this store's requests, newest first. */
export function apiGetStoreAppRequests(storeId: string) {
  return client.get<never, ApiResponse<StoreAppRequest[]>>(ENDPOINTS.STORE_APP_REQUESTS.GET_FOR_STORE(storeId));
}

/** POST /api/store-app-requests/:storeId/platforms/:platform/pay — starts
 *  (or resumes) the paid build for one platform on the seller's existing app
 *  request, e.g. Android was bought first and iOS is wanted later. Returns a
 *  Stripe PaymentIntent client secret; the platform is only marked requested
 *  once apiConfirmPlatformPayment verifies the payment succeeded. */
export function apiCreatePlatformPaymentIntent(storeId: string, platform: 'android' | 'ios') {
  return client.post<never, ApiResponse<{ clientSecret: string; amount: number }>>(
    ENDPOINTS.STORE_APP_REQUESTS.PLATFORM_PAY(storeId, platform),
    {},
  );
}

/** POST /api/store-app-requests/:storeId/platforms/:platform/confirm —
 *  re-checks the PaymentIntent with Stripe server-side and, once it has
 *  succeeded, marks that platform as requested/paid and kicks off its
 *  build pipeline. */
export function apiConfirmPlatformPayment(storeId: string, platform: 'android' | 'ios') {
  return client.post<never, ApiResponse<StoreAppRequest> & { message: string }>(
    ENDPOINTS.STORE_APP_REQUESTS.PLATFORM_CONFIRM(storeId, platform),
    {},
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminListStoreAppRequestsParams {
  status?:   StoreAppPlatformStatus;
  platform?: 'android' | 'ios';
}

export function apiAdminListStoreAppRequests(params?: AdminListStoreAppRequestsParams) {
  return client.get<never, ApiResponse<AdminStoreAppRequest[]>>(ENDPOINTS.STORE_APP_REQUESTS.ADMIN.LIST, {
    params: params?.status || params?.platform ? params : undefined,
  });
}

export function apiAdminGetStoreAppRequest(id: string) {
  return client.get<never, ApiResponse<AdminStoreAppRequest>>(ENDPOINTS.STORE_APP_REQUESTS.ADMIN.GET_ONE(id));
}

export interface UpdatePlatformStatusPayload {
  platform:         'android' | 'ios';
  status:            StoreAppPlatformStatus;
  /** Required when status === 'published'. */
  storeUrl?:         string;
  /** Only meaningful when status === 'rejected'. */
  rejectionReason?:  string;
  adminNotes?:       string;
}

export function apiAdminUpdatePlatformStatus(id: string, payload: UpdatePlatformStatusPayload) {
  return client.patch<never, ApiResponse<StoreAppRequest>>(ENDPOINTS.STORE_APP_REQUESTS.ADMIN.UPDATE_PLATFORM_STATUS(id), payload);
}
