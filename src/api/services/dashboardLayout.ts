import client from '../client';
interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type WidgetSize = 'small' | 'third' | 'medium' | 'large' | 'full';

export interface LayoutWidget {
  id: string;
  visible: boolean;
  size: WidgetSize;
  settings: Record<string, string | number>;
}

export interface DashboardLayout {
  preset: string | null;
  columns: 2 | 3;
  widgets: LayoutWidget[];
}

interface LayoutResponse { layout: DashboardLayout | null }

// Store layouts belong to the signed-in user + that store; the Super Admin layout to the signed-in admin.
const storePath = (storeId: string) => `/api/dashboard-layouts/store/${encodeURIComponent(storeId)}`;
const ADMIN_PATH = '/api/dashboard-layouts/admin';

export type DashboardScope = { kind: 'store'; storeId: string } | { kind: 'admin' };
const pathFor = (scope: DashboardScope) => (scope.kind === 'store' ? storePath(scope.storeId) : ADMIN_PATH);

export function apiGetDashboardLayout(scope: DashboardScope) {
  return client.get<never, ApiResponse<LayoutResponse>>(pathFor(scope));
}

export function apiSaveDashboardLayout(scope: DashboardScope, layout: DashboardLayout) {
  return client.put<never, ApiResponse<LayoutResponse>>(pathFor(scope), layout);
}

export function apiResetDashboardLayout(scope: DashboardScope) {
  return client.delete<never, ApiResponse<LayoutResponse>>(pathFor(scope));
}
