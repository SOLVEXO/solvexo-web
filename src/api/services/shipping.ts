import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type ShippingZoneType = 'shipping' | 'local_delivery' | 'pickup';
export type ShippingRateType = 'flat' | 'weight' | 'price';
export interface ShippingRateTier { min: number; max: number | null; price: number }

export interface ShippingZone {
  _id: string;
  storeId: string | null;
  zoneType: ShippingZoneType;
  name?: string | null;
  rateType?: ShippingRateType;
  rateTiers?: ShippingRateTier[];
  freeShippingThreshold?: number | null;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  /** Numeric delivery window (days) — drives the "Arrives <date range>" line at checkout. */
  minDays?: number | null;
  maxDays?: number | null;
  /** Local delivery by postcode list; empty = match by city/area. */
  postalCodes?: string[];
  /** Minimum order subtotal (store currency) for this option. */
  minOrderAmount?: number | null;
  /** Shipping profile this rate belongs to; null/absent = General profile. */
  profileId?: string | null;
  /** Checkout delivery group key (profile id, or 'general'). */
  groupKey?: string;
  /** Region label grouping several rates under one card in the seller UI. */
  regionName?: string | null;
  /** Local delivery radius (km) around the profile's ship-from location. */
  radiusKm?: number | null;
  /** Ship-from coordinates, sent by the storefront endpoint for radius zones only. */
  originLatitude?: number | null;
  originLongitude?: number | null;
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
  zoneType?: ShippingZoneType;
  name?: string;
  rateType?: ShippingRateType;
  rateTiers?: ShippingRateTier[];
  freeShippingThreshold?: number | null;
  pickupAddress?: string;
  pickupInstructions?: string;
  minDays?: number | null;
  maxDays?: number | null;
  postalCodes?: string[];
  minOrderAmount?: number | null;
  profileId?: string | null;
  regionName?: string | null;
  radiusKm?: number | null;
}

/** One delivery group of a cart (a shipping profile's products); the buyer picks one rate per group. */
export interface ShippingGroup { groupKey: string; profileId: string | null; name: string }

interface ShippingZonesResponse {
  message: string;
  data: ShippingZone[];
  groups?: ShippingGroup[];
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
export function apiListStoreShippingZones(storeId: string, zoneType?: ShippingZoneType, profileId?: string) {
  const params = new URLSearchParams();
  if (zoneType) params.set('zoneType', zoneType);
  if (profileId) params.set('profileId', profileId);
  const qs = params.toString();
  const url = qs ? `${ENDPOINTS.STORE_SHIPPING_ZONES.LIST(storeId)}?${qs}` : ENDPOINTS.STORE_SHIPPING_ZONES.LIST(storeId);
  return client.get<never, ShippingZonesListResponse>(url);
}

// ── Shipping profiles (Shopify) ────────────────────────────────────────────
export interface ShippingProfile {
  _id: string;
  name: string;
  isGeneral: boolean;
  originLocationIds: string[];
  productCount: number;
  zoneCount: number;
}
export interface ShippingProfileLocation {
  _id: string; name: string; city: string | null; addressLine1: string | null; zipCode: string | null; country: string | null; type: 'store' | 'warehouse';
}
export interface ShippingProfilesData { generalProfileId: string; profiles: ShippingProfile[]; locations: ShippingProfileLocation[] }
export interface ProfileProduct { _id: string; name: string; image: string | null; shippingProfileId: string | null; status: string }

export function apiListShippingProfiles(storeId: string) {
  return client.get<never, { success: boolean; data: ShippingProfilesData }>(ENDPOINTS.STORE_SHIPPING_PROFILES.LIST(storeId));
}
export function apiCreateShippingProfile(storeId: string, payload: { name: string; originLocationIds?: string[] }) {
  return client.post<never, { success: boolean; data: { _id: string } }>(ENDPOINTS.STORE_SHIPPING_PROFILES.CREATE(storeId), payload);
}
export function apiUpdateShippingProfile(storeId: string, profileId: string, payload: { name?: string; originLocationIds?: string[] }) {
  return client.patch<never, { success: boolean }>(ENDPOINTS.STORE_SHIPPING_PROFILES.UPDATE(storeId, profileId), payload);
}
export function apiDeleteShippingProfile(storeId: string, profileId: string) {
  return client.delete<never, { success: boolean; data: { productsMovedToGeneral: number; ratesRemoved: number } }>(ENDPOINTS.STORE_SHIPPING_PROFILES.DELETE(storeId, profileId));
}
/** `profileRef` = a profile id, or 'general' to move products back to the General profile. */
export function apiAssignProfileProducts(storeId: string, profileRef: string, productIds: string[]) {
  return client.post<never, { success: boolean; data: { matched: number; modified: number } }>(ENDPOINTS.STORE_SHIPPING_PROFILES.ASSIGN(storeId, profileRef), { productIds });
}
export function apiSearchProfileProducts(storeId: string, q?: string, profileRef?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (profileRef) params.set('profileId', profileRef);
  const qs = params.toString();
  return client.get<never, { success: boolean; data: ProfileProduct[] }>(`${ENDPOINTS.STORE_SHIPPING_PROFILES.PRODUCTS(storeId)}${qs ? `?${qs}` : ''}`);
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
