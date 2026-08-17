import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import type { PosPaymentMethod } from './posSales';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaymentMethodBreakdown {
  cash:  { count: number; total: number };
  card:  { count: number; total: number };
  other: { count: number; total: number };
}

export interface TopProduct {
  productId: string;
  name:      string;
  qty:       number;
  revenue:   number;
}

export interface ReportSummary {
  totalTransactions:   number;
  totalRevenue:        number;
  totalDiscount:       number;
  totalTax:            number;
  netRevenue:          number;
  avgTransactionValue: number;
  refundsCount:        number;
  refundsTotal:        number;
}

export interface DailyReport {
  date:             string;
  summary:          ReportSummary;
  byPaymentMethod:  PaymentMethodBreakdown;
  topProducts:      TopProduct[];
  hourlyBreakdown:  { hour: number; label: string; total: number }[];
}

export interface DateRangeReport {
  from:            string;
  to:              string;
  summary:         ReportSummary;
  byPaymentMethod: PaymentMethodBreakdown;
  topProducts:     TopProduct[];
  dailyBreakdown:  { date: string; total: number }[];
}

export interface RegisterReport {
  register: { _id: string; name: string; defaultFloatCash: number; status: string };
  period:   { from: string | null; to: string | null };
  summary: {
    totalSessions:     number;
    totalTransactions: number;
    totalRevenue:      number;
    avgPerSession:     number;
  };
  sessions: Array<{
    sessionId:         string;
    employeeId:        string;
    openedAt:          string;
    closedAt:          string | null;
    totalSales:        number;
    totalTransactions: number;
    status:            string;
  }>;
}

export interface EmployeeReport {
  employee: { _id: string; name: string; email: string; role: string };
  period:   { from: string | null; to: string | null };
  summary: {
    totalTransactions:   number;
    totalRevenue:        number;
    avgTransactionValue: number;
    totalSessions:       number;
  };
  recentSales: Array<{
    saleId:        string;
    saleNumber:    string;
    total:         number;
    paymentMethod: PosPaymentMethod;
    createdAt:     string;
  }>;
}

export interface DateRangeQuery { from: string; to: string }
export interface DailyQuery { date?: string; registerId?: string }

interface ApiResponse<T> { success: boolean; data: T }

// ── API ───────────────────────────────────────────────────────────────────────

/** GET /api/pos/reports/daily?storeId=&date=&registerId= */
export function apiGetDailyReport(storeId: string, query: DailyQuery = {}) {
  const params = new URLSearchParams({ storeId, ...cleanQuery(query) });
  return client.get<never, ApiResponse<DailyReport>>(`${ENDPOINTS.POS.REPORTS.DAILY}?${params}`);
}

/** GET /api/pos/reports/range?storeId=&from=&to= */
export function apiGetDateRangeReport(storeId: string, query: DateRangeQuery) {
  const params = new URLSearchParams({ storeId, ...query });
  return client.get<never, ApiResponse<DateRangeReport>>(`${ENDPOINTS.POS.REPORTS.RANGE}?${params}`);
}

/** GET /api/pos/reports/daily/export?storeId=&date= — downloads a CSV file */
export async function apiExportDailyReportCsv(storeId: string, query: DailyQuery = {}) {
  const params = new URLSearchParams({ storeId, ...cleanQuery(query) });
  const blob = await client.get<never, Blob>(`${ENDPOINTS.POS.REPORTS.DAILY_EXPORT}?${params}`, {
    responseType: 'blob',
  });
  const filename = `pos-report-${query.date ?? new Date().toISOString().split('T')[0]}.csv`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** GET /api/pos/reports/register/:registerId?from=&to= */
export function apiGetRegisterReport(registerId: string, query: DateRangeQuery | Record<string, never> = {}) {
  const params = new URLSearchParams(cleanQuery(query));
  const qs = params.toString();
  return client.get<never, ApiResponse<RegisterReport>>(
    `${ENDPOINTS.POS.REPORTS.REGISTER(registerId)}${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/pos/reports/employee/:employeeId?storeId=&from=&to= */
export function apiGetEmployeeReport(employeeId: string, storeId: string, query: Partial<DateRangeQuery> = {}) {
  const params = new URLSearchParams({ storeId, ...cleanQuery(query) });
  return client.get<never, ApiResponse<EmployeeReport>>(
    `${ENDPOINTS.POS.REPORTS.EMPLOYEE(employeeId)}?${params}`,
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function cleanQuery<T extends object>(query: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(query) as [string, unknown][]) {
    if (value !== undefined && value !== null && value !== '') out[key] = String(value);
  }
  return out;
}
