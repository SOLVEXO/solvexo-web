import client from '../client';

export interface PublicPlan {
  _id: string; name: string; description: string; type: 'free' | 'one_time' | 'recurring';
  amount: number; currency: string; productSlug?: string | null; autoRenew?: boolean; interval: string; intervalCount: number; trialDays: number; benefits: string[]; tier: number;
}
export interface MySubscription {
  _id: string; planId: string; status: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  provider?: 'manual' | 'stripe' | 'safepay'; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; awaitingFirstPayment: boolean; amountDue: number; pendingPlanId: string | null;
}

const ME = '/api/memberships/me';
export const apiPublicPlans = (storeId: string) => client.get(`/api/public/memberships/${storeId}/plans`) as Promise<PublicPlan[]>;
export const apiMyMemberships = (storeId: string) => client.get(ME, { params: { storeId } }) as Promise<MySubscription[]>;
/** Starts an automatic card subscription: returns Stripe's hosted checkout link. */
export const apiStartCheckout = (storeId: string, planId: string) => client.post(`${ME}/checkout`, { planId }, { params: { storeId } }) as Promise<{ url: string }>;
export const apiPaymentMethodUrl = (storeId: string, id: string) => client.post(`${ME}/${id}/payment-method`, {}, { params: { storeId } }) as Promise<{ url: string }>;
export const apiJoinPlan = (storeId: string, planId: string) => client.post(`${ME}/join`, { planId }, { params: { storeId } });
export const apiMembershipAction = (storeId: string, id: string, action: 'cancel' | 'pause' | 'resume') =>
  client.post(`${ME}/${id}/${action}`, {}, { params: { storeId } });
export const apiChangePlan = (storeId: string, id: string, planId: string) =>
  client.post(`${ME}/${id}/change-plan`, { planId }, { params: { storeId } }) as Promise<{ amountDue: number; effective: 'now' | 'period_end' }>;

// ── Manual renewal invoices (the buyer pays the store directly and uploads a receipt) ──
export interface RenewalInvoice {
  id: string; subscriptionId: string; planId: string; planName: string; amount: number; currency: string; dueAt: string;
  status: 'awaiting' | 'submitted' | 'overdue' | 'paid' | 'void';
  instructions: { label: string; details: string }[];
  reference: string | null; senderName: string | null; submittedAt: string | null; rejectionReason: string | null;
  submissionsLeft: number; hasProof: boolean; paidAt: string | null;
}
export const apiMyInvoices = (storeId: string) => client.get(`${ME}/invoices`, { params: { storeId } }) as Promise<RenewalInvoice[]>;
export function apiSubmitProof(storeId: string, invoiceId: string, f: { file?: File | null; reference?: string; senderName?: string }) {
  const body = new FormData();
  if (f.file) body.append('file', f.file);
  if (f.reference) body.append('reference', f.reference);
  if (f.senderName) body.append('senderName', f.senderName);
  return client.post(`${ME}/invoices/${invoiceId}/proof`, body, { params: { storeId } }) as Promise<RenewalInvoice>;
}
export const apiMyProofUrl = (storeId: string, invoiceId: string) => client.get(`${ME}/invoices/${invoiceId}/proof-url`, { params: { storeId } }) as Promise<{ url: string }>;
