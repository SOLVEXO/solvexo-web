import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CashAdjustmentEntry {
  _id?:       string;
  type:       'cash_in' | 'cash_out';
  amount:     number;
  reason:     string;
  employeeId: string;
  createdAt:  string;
}

export interface RegisterSession {
  _id:                string;
  storeId:            string;
  registerId:         string;
  employeeId:         string;
  shiftId:            string | null;
  openedAt:            string;
  closedAt:            string | null;
  openingCash:         number;
  closingCash:         number | null;
  expectedCash:        number;
  cashDifference:      number;
  cashSales:           number;
  cardSales:           number;
  otherSales:          number;
  totalSales:          number;
  totalTransactions:   number;
  totalRefunds:        number;
  cashAdjustments:     CashAdjustmentEntry[];
  status:              'open' | 'closed';
  forceClosedBy:       string | null;
  forceCloseReason:    string | null;
  forceCloseAt:        string | null;
  createdAt:           string;
  updatedAt:           string;
}

export interface OpenSessionPayload {
  storeId:     string;
  registerId:  string;
  employeeId:  string;
  shiftId?:    string;
  openingCash: number;
}

export interface CloseSessionPayload {
  sessionId:   string;
  closingCash: number;
}

export interface CashAdjustmentPayload {
  type:       'cash_in' | 'cash_out';
  amount:     number;
  reason:     string;
  employeeId: string;
}

export interface SessionHistoryQuery {
  page?:       number;
  registerId?: string;
  employeeId?: string;
  status?:     'open' | 'closed';
  from?:       string;
  to?:         string;
}

export interface SessionReport {
  session: RegisterSession;
  summary: {
    totalSales:        number;
    totalTransactions: number;
    completedSales:    number;
    heldSales:         number;
    refundsCount:      number;
    refundsTotal:      number;
    byPaymentMethod:   Record<'cash' | 'card' | 'other', { count: number; total: number }>;
    cashFlow: {
      openingCash:    number;
      cashSales:      number;
      cashIn:         number;
      cashOut:        number;
      expectedCash:   number;
      closingCash:    number | null;
      cashDifference: number;
    };
  };
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    pagination: { page: number; limit: number; total: number; totalPages: number };
    sessions:   T[];
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/sessions/open */
export function apiOpenSession(payload: OpenSessionPayload) {
  return client.post<never, ApiResponse<RegisterSession>>(ENDPOINTS.POS.SESSIONS.OPEN, payload);
}

/** POST /api/pos/sessions/close */
export function apiCloseSession(payload: CloseSessionPayload) {
  return client.post<never, ApiResponse<RegisterSession>>(ENDPOINTS.POS.SESSIONS.CLOSE, payload);
}

/** GET /api/pos/sessions/active?storeId=&registerId= */
export function apiGetActiveSession(storeId: string, registerId: string) {
  return client.get<never, ApiResponse<RegisterSession | null>>(
    `${ENDPOINTS.POS.SESSIONS.ACTIVE}?storeId=${storeId}&registerId=${registerId}`,
  );
}

/** GET /api/pos/sessions/history?storeId=&... */
export function apiGetSessionHistory(storeId: string, query: SessionHistoryQuery = {}) {
  const params = new URLSearchParams({ storeId, ...cleanQuery(query) });
  return client.get<never, PaginatedResponse<RegisterSession>>(`${ENDPOINTS.POS.SESSIONS.HISTORY}?${params}`);
}

/** POST /api/pos/sessions/:sessionId/cash-adjustment */
export function apiCashInOut(sessionId: string, payload: CashAdjustmentPayload) {
  return client.post<never, ApiResponse<CashAdjustmentEntry>>(ENDPOINTS.POS.SESSIONS.CASH_ADJUSTMENT(sessionId), payload);
}

/** GET /api/pos/sessions/:sessionId/report */
export function apiGetSessionReport(sessionId: string) {
  return client.get<never, ApiResponse<SessionReport>>(ENDPOINTS.POS.SESSIONS.REPORT(sessionId));
}

/** POST /api/pos/sessions/:sessionId/force-close */
export function apiForceCloseSession(sessionId: string, reason?: string) {
  return client.post<never, ApiResponse<RegisterSession>>(ENDPOINTS.POS.SESSIONS.FORCE_CLOSE(sessionId), { reason });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function cleanQuery<T extends object>(query: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(query) as [string, unknown][]) {
    if (value !== undefined && value !== null && value !== '') out[key] = String(value);
  }
  return out;
}
