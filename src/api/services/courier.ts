import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types — mirror solvexo-api `src/integrations/couriers` and `OrdersService` courier methods ─────────────

export const COURIER_KEYS = ['postex', 'leopards', 'tcs', 'trax', 'mnp', 'blueex', 'callcourier', 'swyft', 'daewoo_fastex'] as const;
export type CourierKey = (typeof COURIER_KEYS)[number];

export type CourierStatus = 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'cancelled' | 'failed';
export type CourierBookingStatus = 'pending' | 'booked' | 'fulfil_failed' | 'cancelled' | 'failed';

export interface CourierCapabilities {
  bulkBooking: boolean; trackBatchSize: number; airwayBillBatchSize: number; airwayBill: boolean;
  loadSheet: boolean; cityList: boolean; cancel: boolean; codStatus: boolean; pushWebhook: boolean;
}

export interface CourierCredentialFieldView { key: string; label: string; secret: boolean; optional: boolean }

export interface CourierCatalogView {
  label: string;
  fields: CourierCredentialFieldView[];
  capabilities: CourierCapabilities | null;
  /** false until the platform owner verified the courier's mapping in its sandbox. */
  verified: boolean;
  docsUrl: string | null;
}

/** One courier card in Settings → Integrations (the stored integration row, never with credentials). */
export interface CourierIntegrationView {
  id: string | null;
  type: 'courier';
  provider: CourierKey;
  mode: 'sandbox' | 'live';
  status: 'not_connected' | 'connected' | 'disabled' | 'error' | 'needs_reauth';
  lastVerifiedAt: string | null;
  lastError: string | null;
  maskedHints: Record<string, string>;
  catalog: CourierCatalogView;
}

export interface CourierParty { name: string; phone: string; email?: string; address: string; city: string; addressCode?: string }

export interface CourierSettings {
  defaultProvider: CourierKey | null;
  defaultWeightKg: number;
  pickup: CourierParty | null;
  returnAddress: CourierParty | null;
}

export interface BookableCourier { provider: CourierKey; label: string; mode: 'sandbox' | 'live'; capabilities: CourierCapabilities }

export interface CourierTrackingEvent { status: CourierStatus; rawStatus: string; description: string | null; location: string | null; occurredAt: string }

export interface CourierBookingView {
  id: string; orderId: string; provider: CourierKey; providerLabel: string; mode: 'sandbox' | 'live';
  bookingStatus: CourierBookingStatus; isActive: boolean; referenceNumber: string;
  trackingNumber: string | null; trackingUrl: string | null; hasLabel: boolean; shipmentId: string | null;
  items: { itemId: string; quantity: number }[]; weightKg: number; pieces: number;
  /** What the courier was told to collect (store currency); 0 = prepaid. Display only. */
  codAmount: number; currency: string | null;
  courierStatus: CourierStatus | null; rawStatus: string | null;
  rto: boolean; rtoAt: string | null;
  cod: { amount?: number | null; status?: string | null; collectedAt?: string | null; settledAt?: string | null } | null;
  events: CourierTrackingEvent[];
  lastSyncedAt: string | null; lastSyncError: string | null; error: string | null; cancelledAt: string | null; createdAt: string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface BulkBookResult {
  provider: CourierKey; total: number; succeeded: number; failed: number; bookingIds: string[];
  results: Array<{ orderId: string; ok: boolean; trackingNumber?: string | null; bookingId?: string; alreadyBooked?: boolean; error?: string }>;
}

// ── Settings ───────────────────────────────────────────────────────────────────────────────────────────────

export function apiGetCourierSettings(storeId: string) {
  return client.get<never, ApiResponse<CourierSettings>>(ENDPOINTS.STORE_INTEGRATIONS.COURIER_SETTINGS(storeId));
}

export function apiSaveCourierSettings(storeId: string, payload: CourierSettings) {
  return client.put<never, ApiResponse<CourierSettings>>(ENDPOINTS.STORE_INTEGRATIONS.COURIER_SETTINGS(storeId), payload);
}

// ── Order screen ───────────────────────────────────────────────────────────────────────────────────────────

export function apiGetCourierOptions(storeId: string) {
  return client.get<never, ApiResponse<{ providers: BookableCourier[]; settings: CourierSettings }>>(ENDPOINTS.ORDERS.COURIER_OPTIONS(storeId));
}

export function apiValidateCourierCity(storeId: string, provider: CourierKey, city: string) {
  return client.get<never, ApiResponse<{ ok: boolean; city?: string; message?: string }>>(ENDPOINTS.ORDERS.COURIER_VALIDATE_CITY(storeId), { params: { provider, city } });
}

export function apiGetCourierBookings(storeId: string, orderId: string) {
  return client.get<never, ApiResponse<CourierBookingView[]>>(ENDPOINTS.ORDERS.COURIER_FOR_ORDER(storeId, orderId));
}

/** `idempotencyKey` makes a double-click/retry safe on the server too (Idempotency-Key header). */
export function apiBookCourier(
  payload: { orderId: string; storeId: string; provider?: CourierKey; weightKg?: number; pieces?: number; items?: { itemId: string; quantity: number }[]; notifyCustomer?: boolean },
  idempotencyKey?: string,
) {
  return client.put<never, ApiResponse<{ booking: CourierBookingView; alreadyBooked: boolean }>>(
    ENDPOINTS.ORDERS.COURIER_BOOK, payload, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );
}

export function apiBulkBookCourier(payload: { storeId: string; orderIds: string[]; provider?: CourierKey }, idempotencyKey?: string) {
  return client.put<never, ApiResponse<BulkBookResult>>(
    ENDPOINTS.ORDERS.COURIER_BULK_BOOK, payload, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );
}

export function apiCancelCourierBooking(payload: { storeId: string; orderId: string; bookingId: string }) {
  return client.put<never, ApiResponse<{ bookingId: string }>>(ENDPOINTS.ORDERS.COURIER_CANCEL, payload);
}

/** Downloads the combined PDF; when the courier only provides links, opens each link instead. */
export async function apiDownloadCourierDocument(storeId: string, bookingIds: string[], kind: 'airway_bill' | 'load_sheet') {
  const url = kind === 'airway_bill' ? ENDPOINTS.ORDERS.COURIER_AIRWAY_BILL(storeId) : ENDPOINTS.ORDERS.COURIER_LOAD_SHEET(storeId);
  const blob = await client.get<never, Blob>(url, { params: { bookingIds: bookingIds.join(',') }, responseType: 'blob' } as never);
  if (blob.type.includes('json')) {
    const parsed = JSON.parse(await blob.text()) as ApiResponse<{ urls: string[] }>;
    parsed.data.urls.forEach((u) => window.open(u, '_blank', 'noopener'));
    return;
  }
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = kind === 'airway_bill' ? 'airway-bills.pdf' : 'load-sheet.pdf';
  a.click();
  URL.revokeObjectURL(objUrl);
}

/** Connects (or re-connects) a courier with the seller's own credentials; stored encrypted server-side, never returned. */
export function apiConnectCourier(storeId: string, provider: CourierKey, payload: Record<string, string> & { mode?: 'sandbox' | 'live' }) {
  return client.post<never, ApiResponse<{ id: string }>>(ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'courier', provider), payload);
}
