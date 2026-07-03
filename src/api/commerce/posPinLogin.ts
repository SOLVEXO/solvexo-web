import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { PosEmployee } from './posEmployees';
import type { RegisterSession } from './posSessions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PinLoginPayload {
  storeId: string;
  email:   string;
  pin:     string;
}

export interface PinLoginResult {
  employee:      PosEmployee;
  activeSession: RegisterSession | null;
  employeeToken: string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/pin-login */
export function apiPinLogin(payload: PinLoginPayload) {
  return client.post<never, ApiResponse<PinLoginResult>>(ENDPOINTS.POS.PIN_LOGIN, payload);
}
