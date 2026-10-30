import client from '../client';

export interface PublicPlan {
  _id: string; name: string; description: string; type: 'free' | 'one_time' | 'recurring';
  amount: number; currency: string; productSlug?: string | null; interval: string; intervalCount: number; trialDays: number; benefits: string[]; tier: number;
}
export interface MySubscription {
  _id: string; planId: string; status: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; awaitingFirstPayment: boolean; amountDue: number; pendingPlanId: string | null;
}

const ME = '/api/memberships/me';
export const apiPublicPlans = (storeId: string) => client.get(`/api/public/memberships/${storeId}/plans`) as Promise<PublicPlan[]>;
export const apiMyMemberships = (storeId: string) => client.get(ME, { params: { storeId } }) as Promise<MySubscription[]>;
export const apiJoinPlan = (storeId: string, planId: string) => client.post(`${ME}/join`, { planId }, { params: { storeId } });
export const apiMembershipAction = (storeId: string, id: string, action: 'cancel' | 'pause' | 'resume') =>
  client.post(`${ME}/${id}/${action}`, {}, { params: { storeId } });
export const apiChangePlan = (storeId: string, id: string, planId: string) =>
  client.post(`${ME}/${id}/change-plan`, { planId }, { params: { storeId } }) as Promise<{ amountDue: number; effective: 'now' | 'period_end' }>;
