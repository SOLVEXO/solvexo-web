import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface ShippingZone {
  _id: string;
  country: string;
  province: string | null;
  city: string | null;
  shippingPrice: number;
  estimatedDeliveryTime: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateShippingZonePayload {
  country: string;
  province?: string;
  city?: string;
  shippingPrice: number;
  estimatedDeliveryTime?: string;
  status?: 'active' | 'inactive';
}

export type UpdateShippingZonePayload = Partial<CreateShippingZonePayload>;

export function apiGetShippingZones(query?: { status?: string; country?: string }) {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.country) params.set('country', query.country);
  const qs = params.toString();
  return client.get<never, ApiResponse<ShippingZone[]>>(`${ENDPOINTS.ADMIN_SHIPPING_ZONES.LIST}${qs ? `?${qs}` : ''}`);
}

export function apiCreateShippingZone(payload: CreateShippingZonePayload) {
  return client.post<never, ApiResponse<ShippingZone>>(ENDPOINTS.ADMIN_SHIPPING_ZONES.CREATE, payload);
}

export function apiUpdateShippingZone(zoneId: string, payload: UpdateShippingZonePayload) {
  return client.patch<never, ApiResponse<ShippingZone>>(ENDPOINTS.ADMIN_SHIPPING_ZONES.UPDATE(zoneId), payload);
}

export function apiDeleteShippingZone(zoneId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.ADMIN_SHIPPING_ZONES.DELETE(zoneId));
}
