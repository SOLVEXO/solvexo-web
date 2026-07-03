import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmployeeRole = 'cashier' | 'manager';

export interface PosEmployee {
  _id:       string;
  storeId:   string;
  sellerId:  string;
  name:      string;
  email:     string;
  role:      EmployeeRole;
  shiftIds:  string[];
  status:    'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  storeId:   string;
  name:      string;
  email:     string;
  pin:       string;
  role?:     EmployeeRole;
  shiftIds?: string[];
}

export interface UpdateEmployeePayload {
  name?:     string;
  pin?:      string;
  role?:     EmployeeRole;
  shiftIds?: string[];
  status?:   'active' | 'inactive';
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; count: number; data: T[] }
interface ActionResponse { success: boolean; message: string }

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/employees */
export function apiAddEmployee(payload: CreateEmployeePayload) {
  return client.post<never, ApiResponse<PosEmployee>>(ENDPOINTS.POS.EMPLOYEES.CREATE, payload);
}

/** GET /api/pos/employees/:storeId */
export function apiGetEmployees(storeId: string) {
  return client.get<never, ListResponse<PosEmployee>>(ENDPOINTS.POS.EMPLOYEES.LIST(storeId));
}

/** GET /api/pos/employees/:storeId/:employeeId */
export function apiGetEmployeeById(storeId: string, employeeId: string) {
  return client.get<never, ApiResponse<PosEmployee>>(ENDPOINTS.POS.EMPLOYEES.GET_BY_ID(storeId, employeeId));
}

/** PATCH /api/pos/employees/:storeId/:employeeId */
export function apiUpdateEmployee(storeId: string, employeeId: string, payload: UpdateEmployeePayload) {
  return client.patch<never, ApiResponse<PosEmployee>>(ENDPOINTS.POS.EMPLOYEES.UPDATE(storeId, employeeId), payload);
}

/** DELETE /api/pos/employees/:storeId/:employeeId */
export function apiRemoveEmployee(storeId: string, employeeId: string) {
  return client.delete<never, ActionResponse>(ENDPOINTS.POS.EMPLOYEES.REMOVE(storeId, employeeId));
}

/** POST /api/pos/employees/:storeId/:employeeId/reset-pin */
export function apiResetEmployeePin(storeId: string, employeeId: string, newPin: string) {
  return client.post<never, ActionResponse>(ENDPOINTS.POS.EMPLOYEES.RESET_PIN(storeId, employeeId), { newPin });
}
