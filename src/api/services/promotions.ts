import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { PromotionPlacement } from './banner';

export type PromotionRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'expired' | 'cancelled';
export type PromotionPaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PromotionLinkType = 'product' | 'category' | 'external' | 'collection';

export interface PromotionPriceBreakdown {
  unit: 'monthly' | 'weekly' | 'daily' | 'hourly' | 'festival';
  baseRate: number;
  hours: number;
  weekendFraction: number;
  weekendMultiplierApplied: number;
  peakMultiplierApplied: number;
  festivalName?: string;
  priceUSD: number;
}

export interface PromotionRequest {
  _id: string;
  sellerId: string;
  storeId: string;
  placement: PromotionPlacement;
  creativeUrl: string;
  mobileCreativeUrl: string | null;
  ctaLabel: string | null;
  linkType: PromotionLinkType;
  linkTarget: string | null;
  message: string | null;
  startAt: string;
  endAt: string;
  priceUSD: number;
  pricingBreakdown: PromotionPriceBreakdown;
  paymentStatus: PromotionPaymentStatus;
  status: PromotionRequestStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export interface CreatePromotionRequestFields {
  placement: PromotionPlacement;
  ctaLabel?: string;
  linkType?: PromotionLinkType;
  linkTarget?: string;
  message?: string;
  startAt: string;
  endAt: string;
  isPeak?: boolean;
}

// ── Seller ──────────────────────────────────────────────────────────────────────

export function apiPreviewPromotionPrice(storeId: string, placement: PromotionPlacement, startAt: string, endAt: string, isPeak = false) {
  return client.get<never, { success: boolean; data: PromotionPriceBreakdown }>(ENDPOINTS.PROMOTIONS.PREVIEW_PRICE, {
    params: { storeId, placement, startAt, endAt, isPeak },
  });
}

export function apiListPromotionRequests(storeId: string) {
  return client.get<never, { success: boolean; data: PromotionRequest[] }>(ENDPOINTS.PROMOTIONS.LIST(storeId));
}

export function apiCreatePromotionRequest(storeId: string, fields: CreatePromotionRequestFields, file: File, mobileFile?: File) {
  const fd = new FormData();
  fd.append('file', file);
  if (mobileFile) fd.append('mobileFile', mobileFile);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) fd.append(key, String(value));
  });
  return client.post<never, { success: boolean; message: string; data: PromotionRequest }>(ENDPOINTS.PROMOTIONS.CREATE(storeId), fd);
}

export function apiPayPromotionRequest(id: string, idempotencyKey: string) {
  return client.post<never, { success: boolean; data: { clientSecret: string; amount: number } }>(
    ENDPOINTS.PROMOTIONS.PAY(id), {}, { headers: { 'Idempotency-Key': idempotencyKey } },
  );
}

/** Called right after Stripe Elements confirms the card payment client-side —
 *  verifies the PaymentIntent directly with Stripe and activates the
 *  promotion immediately instead of waiting on a webhook, which in local dev
 *  only arrives if Stripe CLI is forwarding to this machine. Safe to call
 *  even if the webhook also later fires for the same payment. */
export function apiConfirmPromotionPayment(id: string) {
  return client.post<never, { success: boolean; message: string; data: PromotionRequest }>(ENDPOINTS.PROMOTIONS.CONFIRM(id));
}

export function apiCancelPromotionRequest(id: string) {
  return client.patch<never, { success: boolean; message: string; data: PromotionRequest }>(ENDPOINTS.PROMOTIONS.CANCEL(id));
}

export function apiGetPromotionTimeline(id: string) {
  return client.get<never, { success: boolean; data: unknown[] }>(ENDPOINTS.PROMOTIONS.TIMELINE(id));
}

// ── Admin ───────────────────────────────────────────────────────────────────────

export function apiAdminListPromotionRequests(status?: string) {
  return client.get<never, { success: boolean; data: PromotionRequest[] }>(ENDPOINTS.PROMOTIONS.ADMIN.LIST, { params: status ? { status } : undefined });
}

export function apiAdminApprovePromotionRequest(id: string) {
  return client.patch<never, { success: boolean; message: string; data: PromotionRequest }>(ENDPOINTS.PROMOTIONS.ADMIN.APPROVE(id));
}

export function apiAdminRejectPromotionRequest(id: string, rejectionReason: string) {
  return client.patch<never, { success: boolean; message: string; data: PromotionRequest }>(ENDPOINTS.PROMOTIONS.ADMIN.REJECT(id), { rejectionReason });
}

export interface PromotionConflictsData {
  overlappingCount: number;
  visibleLimit: number;
  isOversubscribed: boolean;
  overlapping: { _id: string; storeId: string; startAt: string; endAt: string; priceUSD: number }[];
}

export function apiAdminCheckPromotionConflicts(placement: PromotionPlacement, startAt: string, endAt: string, excludeId?: string) {
  return client.get<never, { success: boolean; data: PromotionConflictsData }>(ENDPOINTS.PROMOTIONS.ADMIN.CONFLICTS, {
    params: { placement, startAt, endAt, excludeId },
  });
}

export interface CalendarPromotionItem {
  _id: string;
  placement: PromotionPlacement;
  storeId: string;
  startAt: string;
  endAt: string;
  priceUSD: number;
  status: PromotionRequestStatus;
}

export interface CalendarCampaignItem {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function apiAdminPromotionCalendar(from: string, to: string) {
  return client.get<never, { success: boolean; data: { promotions: CalendarPromotionItem[]; campaigns: CalendarCampaignItem[] } }>(ENDPOINTS.PROMOTIONS.ADMIN.CALENDAR, {
    params: { from, to },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface PromotionAnalyticsData {
  impressions: number;
  clicks: number;
  conversions: number;
  revenueUSD: number;
  orders: number;
  ctr: number;
  byDate: { date: string; impressions: number; clicks: number; revenueUSD: number }[];
}

export function apiGetSellerPromotionAnalytics(storeId: string) {
  return client.get<never, { success: boolean; data: PromotionAnalyticsData }>(ENDPOINTS.PROMOTIONS.ANALYTICS(storeId));
}

export function apiGetAdminPromotionAnalytics() {
  return client.get<never, { success: boolean; data: PromotionAnalyticsData & { platformRevenueUSD: number } }>(ENDPOINTS.PROMOTIONS.ADMIN.ANALYTICS);
}

// ── Tracking (public, fire-and-forget) ──────────────────────────────────────────

type TrackedEntityType = 'banner' | 'store_banner';
type Device = 'desktop' | 'mobile' | 'tablet';

function detectDevice(): Device {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function apiTrackPromotionImpression(entityType: TrackedEntityType, entityId: string) {
  return client.post(ENDPOINTS.PROMOTIONS.TRACK_IMPRESSION, { entityType, entityId, device: detectDevice() }).catch(() => {});
}

export function apiTrackPromotionClick(entityType: TrackedEntityType, entityId: string) {
  return client.post(ENDPOINTS.PROMOTIONS.TRACK_CLICK, { entityType, entityId, device: detectDevice() }).catch(() => {});
}
