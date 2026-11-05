import client from '../client';

// ── Types — mirror solvexo-api `src/customer-segments` ─────────────────────────────────────────────────────

export type SegmentFieldKey =
  | 'amount_spent' | 'order_count' | 'average_order_value' | 'store_credit_balance'
  | 'last_order_date' | 'first_order_date' | 'tags' | 'country' | 'city'
  | 'marketing_status' | 'account_status' | 'product_purchased' | 'loyalty_tier';

export interface SegmentCondition { field: SegmentFieldKey; op: string; value?: unknown }
export interface SegmentFilter { combinator: 'and' | 'or'; conditions: SegmentCondition[] }

export interface CustomerSegment { id: string; name: string; description: string; filter: SegmentFilter; createdAt: string; updatedAt: string }

interface ApiResponse<T> { success: boolean; message?: string; data: T }
const base = (storeId: string) => `/api/customer-segments/${storeId}`;

export const apiListSegments = (storeId: string) =>
  client.get<never, ApiResponse<{ segments: CustomerSegment[]; limit: number }>>(base(storeId));
export const apiCreateSegment = (storeId: string, body: { name: string; description?: string; filter: SegmentFilter }) =>
  client.post<never, ApiResponse<CustomerSegment>>(base(storeId), body);
export const apiUpdateSegment = (storeId: string, id: string, body: Partial<{ name: string; description: string; filter: SegmentFilter }>) =>
  client.patch<never, ApiResponse<CustomerSegment>>(`${base(storeId)}/${id}`, body);
export const apiDeleteSegment = (storeId: string, id: string) => client.delete<never, ApiResponse<null>>(`${base(storeId)}/${id}`);
export const apiDuplicateSegment = (storeId: string, id: string) => client.post<never, ApiResponse<CustomerSegment>>(`${base(storeId)}/${id}/duplicate`);
/** Live member count of an UNSAVED filter (builder preview). */
export const apiPreviewSegment = (storeId: string, filter: SegmentFilter) =>
  client.post<never, ApiResponse<{ count: number }>>(`${base(storeId)}/preview`, { filter });
export const apiSegmentCount = (storeId: string, id: string) => client.get<never, ApiResponse<{ count: number }>>(`${base(storeId)}/${id}/count`);

export async function apiExportSegment(storeId: string, id: string, filename = 'segment.csv') {
  const blob = await client.get<never, Blob>(`${base(storeId)}/${id}/export`, { responseType: 'blob' } as never);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
