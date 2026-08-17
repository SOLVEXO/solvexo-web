import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosRegister {
  _id:              string;
  name:             string;
  defaultFloatCash: number;
  status:           'active' | 'inactive';
}

export interface CreateRegisterPayload {
  name:              string;
  defaultFloatCash?: number;
}

export interface UpdateRegisterPayload {
  name?:             string;
  defaultFloatCash?: number;
  status?:           'active' | 'inactive';
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; count: number; data: T[] }

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/registers/:storeId — returns the full updated registers array */
export function apiAddRegister(storeId: string, payload: CreateRegisterPayload) {
  return client.post<never, ApiResponse<PosRegister[]>>(ENDPOINTS.POS.REGISTERS.ADD(storeId), payload);
}

/** GET /api/pos/registers/:storeId */
export function apiListRegisters(storeId: string) {
  return client.get<never, ListResponse<PosRegister>>(ENDPOINTS.POS.REGISTERS.LIST(storeId));
}

/** GET /api/pos/registers/:storeId/:registerId */
export function apiGetRegisterById(storeId: string, registerId: string) {
  return client.get<never, ApiResponse<PosRegister>>(ENDPOINTS.POS.REGISTERS.GET_BY_ID(storeId, registerId));
}

/** PATCH /api/pos/registers/:storeId/:registerId */
export function apiUpdateRegister(storeId: string, registerId: string, payload: UpdateRegisterPayload) {
  return client.patch<never, ApiResponse<PosRegister>>(ENDPOINTS.POS.REGISTERS.UPDATE(storeId, registerId), payload);
}

/** DELETE /api/pos/registers/:storeId/:registerId — returns the full updated registers array */
export function apiRemoveRegister(storeId: string, registerId: string) {
  return client.delete<never, ApiResponse<PosRegister[]>>(ENDPOINTS.POS.REGISTERS.REMOVE(storeId, registerId));
}
