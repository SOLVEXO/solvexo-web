import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface ShippingZone {
  _id: string;
  storeId: string | null;
  zoneType: 'shipping' | 'local_delivery';
  country: string;
  province: string;
  city: string;
  shippingPrice: number;
  estimatedDeliveryTime: string;
  status: 'active' | 'inactive';
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ShippingZonePayload {
  country: string;
  province?: string;
  city?: string;
  shippingPrice: number;
  estimatedDeliveryTime?: string;
  status?: 'active' | 'inactive';
  zoneType?: 'shipping' | 'local_delivery';
}

interface ShippingZonesResponse {
  message: string;
  data: ShippingZone[];
}

interface ShippingZoneResponse {
  success: boolean;
  message: string;
  data: ShippingZone;
}

interface ShippingZonesListResponse {
  success: boolean;
  data: ShippingZone[];
}

// Buyer-facing checkout zone picker — `storeId` scopes to that seller's own
// zones first, falling back server-side to the platform-wide default set if
// the store has none of its own. Omitted entirely for the legacy multi-store
// marketplace checkout (unlinked from nav, still reachable), preserving its
// original unscoped-global-list behavior. `currency` (the caller's already-
// resolved display currency) makes the server convert each zone's price for
// display so it matches what `addShippingInCheckout` will actually charge.
export function apiGetShippingZones(storeId?: string, currency?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (currency) params.set('currency', currency);
  const qs = params.toString();
  const url = qs ? `${ENDPOINTS.SHIPPING.GET_SHIPPING_ZONES}?${qs}` : ENDPOINTS.SHIPPING.GET_SHIPPING_ZONES;
  return client.get<never, ShippingZonesResponse>(url);
}

// ── Seller's own store-scoped zones (management view — every status, both
// zoneTypes; the Shipping page itself splits by zoneType client-side) ───────
export function apiListStoreShippingZones(storeId: string, zoneType?: 'shipping' | 'local_delivery') {
  const url = zoneType
    ? `${ENDPOINTS.STORE_SHIPPING_ZONES.LIST(storeId)}?zoneType=${zoneType}`
    : ENDPOINTS.STORE_SHIPPING_ZONES.LIST(storeId);
  return client.get<never, ShippingZonesListResponse>(url);
}

export function apiCreateStoreShippingZone(storeId: string, payload: ShippingZonePayload) {
  return client.post<never, ShippingZoneResponse>(ENDPOINTS.STORE_SHIPPING_ZONES.CREATE(storeId), payload);
}

export function apiUpdateStoreShippingZone(storeId: string, zoneId: string, payload: Partial<ShippingZonePayload>) {
  return client.patch<never, ShippingZoneResponse>(ENDPOINTS.STORE_SHIPPING_ZONES.UPDATE(storeId, zoneId), payload);
}

export function apiDeleteStoreShippingZone(storeId: string, zoneId: string) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.STORE_SHIPPING_ZONES.DELETE(storeId, zoneId));
}

// ── Seller's own named carriers (feeds the Orders tracking-number modal) ───
export interface ShippingCarrier {
  _id: string;
  storeId: string;
  name: string;
  trackingUrlTemplate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarrierPayload {
  name: string;
  trackingUrlTemplate?: string;
}

interface ShippingCarriersListResponse {
  success: boolean;
  data: ShippingCarrier[];
}

interface ShippingCarrierResponse {
  success: boolean;
  message: string;
  data: ShippingCarrier;
}

export function apiListShippingCarriers(storeId: string) {
  return client.get<never, ShippingCarriersListResponse>(ENDPOINTS.STORE_SHIPPING_CARRIERS.LIST(storeId));
}

export function apiCreateShippingCarrier(storeId: string, payload: ShippingCarrierPayload) {
  return client.post<never, ShippingCarrierResponse>(ENDPOINTS.STORE_SHIPPING_CARRIERS.CREATE(storeId), payload);
}

export function apiUpdateShippingCarrier(storeId: string, carrierId: string, payload: Partial<ShippingCarrierPayload> & { isActive?: boolean }) {
  return client.patch<never, ShippingCarrierResponse>(ENDPOINTS.STORE_SHIPPING_CARRIERS.UPDATE(storeId, carrierId), payload);
}

export function apiDeleteShippingCarrier(storeId: string, carrierId: string) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.STORE_SHIPPING_CARRIERS.DELETE(storeId, carrierId));
}

// Substitutes a tracking number into a carrier's `{tracking}` URL template —
// used by the Orders "mark as shipped" modal to auto-fill the tracking link.
export function buildTrackingUrl(template: string | null | undefined, trackingNumber: string): string {
  if (!template || !trackingNumber) return '';
  return template.replace('{tracking}', encodeURIComponent(trackingNumber));
}

// ── Real live carrier rates (Shippo) — an additional option next to the
// flat `apiGetShippingZones` list above, never a replacement. `data` is
// `null` (not an error) whenever a live quote isn't available for this store
// (Shippo not connected, buyer has no saved address, cart empty, or the
// provider is unreachable) — checkout simply shows only the flat zone list
// in that case, exactly today's behavior for every store that never
// connects Shippo. See CheckoutService.getLiveShippingRates. ──────────────
export interface LiveShippingRate {
  rateId: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDays: number | null;
}

export function apiGetLiveShippingRates(storeId: string) {
  return client.get<never, { success: boolean; data: LiveShippingRate[] | null }>(
    `${ENDPOINTS.CHECKOUT.LIVE_SHIPPING_RATES}?storeId=${storeId}`,
  );
}
