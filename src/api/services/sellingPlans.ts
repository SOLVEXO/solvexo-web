import client from '../client';

export type PlanUnit = 'week' | 'month';
export interface PlanOption { id: string; label: string; unit: PlanUnit; count: number; discountPercent: number }
export interface PlanGroup {
  _id: string;
  name: string;
  options: PlanOption[];
  trialDays: number;
  maxCycles: number | null;
  productIds: string[];
  variantIds: string[];
  shippingAmount: number;
  taxPercent: number;
  status: 'active' | 'archived';
}
export type PlanGroupInput = Partial<Omit<PlanGroup, '_id' | 'options'>> & { options?: { id?: string; label?: string; unit: PlanUnit; count: number; discountPercent: number }[] };
export type ContractStatus = 'active' | 'paused' | 'cancelled' | 'completed';
export interface ContractRow {
  _id: string;
  groupId: string;
  optionId: string;
  terms: { name: string; unit: PlanUnit; count: number; discountPercent: number; shippingAmount: number; taxPercent: number; maxCycles: number | null };
  items: { productId: string; variantId: string; quantity: number }[];
  shippingAddress: { recipientName: string; addressLine1: string; addressLine2?: string; city: string; state?: string; zipCode?: string; phoneNumber: string };
  customerName: string;
  customerEmail: string | null;
  status: ContractStatus;
  nextBillingAt: string;
  cyclesDone: number;
  lastOrderId: string | null;
  pausedReason: string | null;
  createdAt: string;
}
export interface PlanReport { currency: string; active: number; paused: number; cancelledLast30Days: number; total: number; monthlyRecurring: number }

const base = (storeId: string) => `/api/selling-plans/${storeId}`;
export const apiListPlanGroups = (storeId: string) => client.get(`${base(storeId)}/groups`) as Promise<PlanGroup[]>;
export const apiCreatePlanGroup = (storeId: string, body: PlanGroupInput & { name: string }) => client.post(`${base(storeId)}/groups`, body) as Promise<PlanGroup>;
export const apiUpdatePlanGroup = (storeId: string, id: string, body: PlanGroupInput) => client.patch(`${base(storeId)}/groups/${id}`, body) as Promise<PlanGroup>;
export const apiListContracts = (storeId: string, params: { status?: string; page?: number; limit?: number } = {}) =>
  client.get(`${base(storeId)}/contracts`, { params }) as Promise<{ items: ContractRow[]; total: number; page: number; limit: number }>;
export const apiUpcomingRenewals = (storeId: string, days = 14) => client.get(`${base(storeId)}/upcoming`, { params: { days } }) as Promise<ContractRow[]>;
export const apiPlanReport = (storeId: string) => client.get(`${base(storeId)}/report`) as Promise<PlanReport>;
export const apiContractAction = (storeId: string, id: string, action: 'pause' | 'resume' | 'cancel' | 'skip') => client.post(`${base(storeId)}/contracts/${id}/${action}`) as Promise<ContractRow>;

// ── storefront (buyer) ──
export interface StorefrontPlanOption { optionId: string; label: string; unit: PlanUnit; count: number; discountPercent: number; unitPrice: number | null }
export interface StorefrontPlan { groupId: string; name: string; trialDays: number; maxCycles: number | null; shippingAmount: number; options: StorefrontPlanOption[] }
export interface SubscribeAddress { recipientName: string; addressLine1: string; addressLine2?: string; city: string; state?: string; zipCode?: string; phoneNumber: string }

export const apiPublicPlansFor = (storeId: string, productId: string, variantId?: string) =>
  client.get(`/api/public/selling-plans/${storeId}`, { params: { productId, variantId } }) as Promise<StorefrontPlan[]>;
export const apiSubscribe = (storeId: string, body: { groupId: string; optionId: string; variantId: string; quantity: number; address: SubscribeAddress }) =>
  client.post('/api/subscriptions/storefront/subscribe', { storeId, ...body }) as Promise<{ contractId: string; firstOrder: { ok: boolean; orderNumber?: string; error?: string } | null }>;
export const apiMySubscriptions = (storeId: string) => client.get('/api/subscriptions/storefront/mine', { params: { storeId } }) as Promise<ContractRow[]>;
export const apiSubscriptionAction = (storeId: string, id: string, action: 'skip' | 'pause' | 'resume' | 'cancel' | 'frequency' | 'address', extra: Record<string, unknown> = {}) =>
  client.post(`/api/subscriptions/storefront/${id}/${action}`, { storeId, ...extra }) as Promise<ContractRow>;
