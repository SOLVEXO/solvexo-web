import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosShift {
  _id:        string;
  name:       string;
  startTime:  string;      // "08:00"
  endTime:    string;      // "16:00"
  daysOfWeek: number[];    // 0=Sun … 6=Sat
  status:     'active' | 'inactive';
}

export interface CreateShiftPayload {
  name:        string;
  startTime:   string;
  endTime:     string;
  daysOfWeek?: number[];
}

export interface UpdateShiftPayload {
  name?:        string;
  startTime?:   string;
  endTime?:     string;
  daysOfWeek?:  number[];
  status?:      'active' | 'inactive';
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; count: number; data: T[] }

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/shifts/:storeId — returns the full updated shifts array */
export function apiAddShift(storeId: string, payload: CreateShiftPayload) {
  return client.post<never, ApiResponse<PosShift[]>>(ENDPOINTS.POS.SHIFTS.ADD(storeId), payload);
}

/** GET /api/pos/shifts/:storeId */
export function apiListShifts(storeId: string) {
  return client.get<never, ListResponse<PosShift>>(ENDPOINTS.POS.SHIFTS.LIST(storeId));
}

/** GET /api/pos/shifts/:storeId/:shiftId */
export function apiGetShiftById(storeId: string, shiftId: string) {
  return client.get<never, ApiResponse<PosShift>>(ENDPOINTS.POS.SHIFTS.GET_BY_ID(storeId, shiftId));
}

/** PATCH /api/pos/shifts/:storeId/:shiftId */
export function apiUpdateShift(storeId: string, shiftId: string, payload: UpdateShiftPayload) {
  return client.patch<never, ApiResponse<PosShift>>(ENDPOINTS.POS.SHIFTS.UPDATE(storeId, shiftId), payload);
}

/** DELETE /api/pos/shifts/:storeId/:shiftId?force=true — returns the full updated shifts array */
export function apiDeleteShift(storeId: string, shiftId: string, force = false) {
  const url = ENDPOINTS.POS.SHIFTS.DELETE(storeId, shiftId) + (force ? '?force=true' : '');
  return client.delete<never, ApiResponse<PosShift[]>>(url);
}
