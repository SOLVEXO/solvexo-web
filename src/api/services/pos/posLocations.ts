import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoreLocation {
  _id:          string;
  storeId:      string;
  sellerId:     string;
  name:         string;
  addressLine1: string | null;
  city:         string | null;
  phone:        string | null;
  status:       'active' | 'archived';
  createdAt:    string;
}

export interface CreateLocationPayload {
  name: string;
  addressLine1?: string;
  city?: string;
  phone?: string;
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  status?: 'active' | 'archived';
}

export interface LocationsOverviewRow {
  locationId: string | null;
  name: string;
  city: string | null;
  status: string;
  totalSales: number;
  transactionCount: number;
}

export interface LocationsOverview {
  from: string;
  to: string;
  combinedTotalSales: number;
  combinedTransactionCount: number;
  byLocation: LocationsOverviewRow[];
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/locations/:storeId */
export function apiCreateLocation(storeId: string, payload: CreateLocationPayload) {
  return client.post<never, ApiResponse<StoreLocation>>(ENDPOINTS.POS.LOCATIONS.CREATE(storeId), payload);
}

/** GET /api/pos/locations/:storeId */
export function apiListLocations(storeId: string) {
  return client.get<never, ApiResponse<StoreLocation[]>>(ENDPOINTS.POS.LOCATIONS.LIST(storeId));
}

/** GET /api/pos/locations/:storeId/overview?from=&to= */
export function apiGetLocationsOverview(storeId: string, query: { from?: string; to?: string } = {}) {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  const qs = params.toString();
  return client.get<never, ApiResponse<LocationsOverview>>(`${ENDPOINTS.POS.LOCATIONS.OVERVIEW(storeId)}${qs ? `?${qs}` : ''}`);
}

/** GET /api/pos/locations/:storeId/:locationId */
export function apiGetLocationById(storeId: string, locationId: string) {
  return client.get<never, ApiResponse<StoreLocation>>(ENDPOINTS.POS.LOCATIONS.GET_BY_ID(storeId, locationId));
}

/** PATCH /api/pos/locations/:storeId/:locationId */
export function apiUpdateLocation(storeId: string, locationId: string, payload: UpdateLocationPayload) {
  return client.patch<never, ApiResponse<StoreLocation>>(ENDPOINTS.POS.LOCATIONS.UPDATE(storeId, locationId), payload);
}

/** DELETE /api/pos/locations/:storeId/:locationId?force= */
export function apiArchiveLocation(storeId: string, locationId: string, force = false) {
  return client.delete<never, { success: boolean; message: string }>(
    `${ENDPOINTS.POS.LOCATIONS.ARCHIVE(storeId, locationId)}${force ? '?force=true' : ''}`,
  );
}
