import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Solvexo's own website analytics (GA4 on the public site + sign-up). Backend: solvexo-api/src/site-analytics. */
export type SiteRange = '7d' | '28d' | '90d' | '365d';

export interface SitePublicConfig { measurementId: string | null; consentRequired: boolean; enabled?: boolean }
export interface SiteAnalyticsSettings {
  /** The id the public site loads: the one saved in Settings, else the API server's environment. */
  measurementId: string | null;
  /** 'settings' (saved here) or 'env:VARIABLE_NAME' (API server environment). */
  measurementIdSource: string | null;
  enabled: boolean;
  ga4: {
    connected: boolean;
    /** Who reads the reports: a service account from the server environment, or the SEO page's Google sign-in. */
    source: 'service_account' | 'google_sign_in' | null;
    status: string | null;
    propertyId: string | null;
    lastError: string | null;
    /** Result of the live test request (null when not tested). */
    ok: boolean | null;
    serviceAccountEmail: string | null;
  };
  env: { measurementIdVariable: string | null; propertyIdVariable: string | null; serviceAccountVariable: string | null; problems: string[] };
  detectedMeasurementId: string | null;
}
export interface TotalMetric { value: number; previous: number; change: number | null }
export interface SiteOverview {
  range: SiteRange;
  series: { date: string; users: number; newUsers: number; sessions: number; pageViews: number }[];
  totals: Record<'users' | 'newUsers' | 'sessions' | 'pageViews' | 'avgSessionSeconds' | 'engagementRate', TotalMetric>;
}
export interface SiteAcquisition {
  range: SiteRange;
  channels: { channel: string; sessions: number; users: number; engagementRate: number }[];
  sources: { source: string; medium: string; sessions: number; users: number }[];
  campaigns: { campaign: string; sessions: number; users: number }[];
}
export interface SiteContent {
  range: SiteRange;
  pages: { path: string; views: number; users: number }[];
  landingPages: { path: string; sessions: number; engagementRate: number }[];
  countries: { country: string; users: number; sessions: number }[];
  cities: { city: string; country: string; users: number }[];
  devices: { device: string; users: number; sessions: number }[];
}
export interface SiteRealtime {
  activeUsers: number;
  pages: { title: string; users: number }[];
  countries: { country: string; users: number }[];
}
export interface SiteFunnel {
  range: SiteRange;
  steps: { key: string; label: string; users: number; fromPrevious: number | null; fromStart: number | null }[];
}

const base = '/api/admin/site-analytics';
export const apiSitePublicConfig = () => client.get<never, ApiResponse<SitePublicConfig>>('/api/site-analytics/config');
export const apiSiteSettings = (check = false) =>
  client.get<never, ApiResponse<SiteAnalyticsSettings>>(`${base}/settings`, { params: check ? { check: 1 } : undefined });
export const apiSaveSiteSettings = (body: { measurementId?: string; enabled?: boolean }) =>
  client.put<never, ApiResponse<SiteAnalyticsSettings>>(`${base}/settings`, body);
export const apiSiteOverview = (range: SiteRange) => client.get<never, ApiResponse<SiteOverview>>(`${base}/overview`, { params: { range } });
export const apiSiteAcquisition = (range: SiteRange) => client.get<never, ApiResponse<SiteAcquisition>>(`${base}/acquisition`, { params: { range } });
export const apiSiteContent = (range: SiteRange) => client.get<never, ApiResponse<SiteContent>>(`${base}/content`, { params: { range } });
export const apiSiteRealtime = () => client.get<never, ApiResponse<SiteRealtime>>(`${base}/realtime`);
export const apiSiteFunnel = (range: SiteRange) => client.get<never, ApiResponse<SiteFunnel>>(`${base}/funnel`, { params: { range } });
