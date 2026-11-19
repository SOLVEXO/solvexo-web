import client from '../client';

// Growth (Shopify: Growth → Overview / Campaigns / Attribution). Reports live under the seller analytics API,
// the saved campaigns under /api/marketing-campaigns.

export type AttributionModel = 'last_non_direct' | 'last_click' | 'first_click';
export type AttributionBy = 'channel' | 'source' | 'campaign';
export type GrowthRange = '7d' | '30d' | '90d' | '12m';
export type CampaignChannel = 'email' | 'social' | 'paid' | 'search' | 'influencer' | 'other';

export interface AttributionRow {
  key: string;
  sessions: number;
  orders: number;
  sales: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface AttributionTotals {
  sessions: number;
  orders: number;
  sales: number;
  averageOrderValue: number;
  conversionRate: number;
  /** Sales credited to a marketing channel (everything except direct / unattributed); null when not by channel. */
  marketingSales: number | null;
}

export interface CampaignReportRow {
  _id: string;
  name: string;
  channel: CampaignChannel;
  status: 'active' | 'archived';
  utmCampaign: string;
  utmSource: string | null;
  utmMedium: string | null;
  createdAt: string;
  sessions: number;
  orders: number;
  sales: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface Api<T> { success: boolean; message?: string; data: T }

export interface AttributionReport {
  model: AttributionModel;
  by: AttributionBy;
  currency: string;
  range: { from: string; to: string };
  lookbackDays: number;
  rows: AttributionRow[];
  totals: AttributionTotals;
}

export interface GrowthOverview {
  model: AttributionModel;
  currency: string;
  range: { from: string; to: string };
  totals: AttributionTotals;
  topChannels: AttributionRow[];
  recentCampaigns: CampaignReportRow[];
}

export interface CampaignsReport {
  model: AttributionModel;
  currency: string;
  range: { from: string; to: string };
  campaigns: CampaignReportRow[];
  /** UTM campaign names that brought visits but are not saved as a campaign yet. */
  untracked: AttributionRow[];
}

export function apiGetGrowthOverview(storeId: string, range: GrowthRange) {
  return client.get<never, Api<GrowthOverview>>('/api/seller/analytics/marketing/overview', { params: { storeId, range } });
}

export function apiGetAttribution(storeId: string, params: { range: GrowthRange; model: AttributionModel; by: AttributionBy }) {
  return client.get<never, Api<AttributionReport>>('/api/seller/analytics/marketing/attribution', { params: { storeId, ...params } });
}

export function apiGetCampaignsReport(storeId: string, range: GrowthRange) {
  return client.get<never, Api<CampaignsReport>>('/api/seller/analytics/marketing/campaigns', { params: { storeId, range } });
}

export interface CampaignInput {
  name: string;
  channel?: CampaignChannel;
  utmCampaign?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  notes?: string;
}

export function apiCreateMarketingCampaign(storeId: string, payload: CampaignInput) {
  return client.post<never, Api<{ _id: string }>>(`/api/marketing-campaigns/${storeId}`, payload);
}

export function apiUpdateMarketingCampaign(storeId: string, id: string, payload: { name?: string; channel?: CampaignChannel; notes?: string; status?: 'active' | 'archived' }) {
  return client.patch<never, Api<{ _id: string }>>(`/api/marketing-campaigns/${storeId}/${id}`, payload);
}

export function apiDeleteMarketingCampaign(storeId: string, id: string) {
  return client.delete<never, Api<null>>(`/api/marketing-campaigns/${storeId}/${id}`);
}
