import type { ChangePlanResult, StorePlatformSubscription } from '@/api/services/platformPlans';

/** Statuses that block the workspace with the "Select a plan" gate. 'canceled' (Stripe subscription ended) is treated like an ended trial. */
export const PLAN_GATE_STATUSES = ['trial_ended', 'locked', 'canceled'] as const;
export function isPlanGateStatus(status: string | null | undefined): boolean {
  return !!status && (PLAN_GATE_STATUSES as readonly string[]).includes(status);
}

/**
 * Shopify-like trial rule: while the trial still has time left, picking a plan commits to it but the first charge
 * happens when the trial ends (Stripe trial_end). Once the trial is over (or there never was one) it charges now.
 */
export function shouldBillImmediately(sub: Pick<StorePlatformSubscription, 'status' | 'trialEndsAt'> | null | undefined, now = Date.now()): boolean {
  if (!sub) return true;
  const trialRunning = sub.status === 'trialing' && !!sub.trialEndsAt && new Date(sub.trialEndsAt).getTime() > now;
  return !trialRunning;
}

export interface PlanChangeDeps {
  change: () => Promise<{ data: ChangePlanResult }>;
  /** stripe.confirmCardPayment on the returned client secret — must throw if the card fails. */
  confirmCard: (clientSecret: string) => Promise<void>;
  /** Server-side verification of a confirmed 3DS charge (applies the pending upgrade). */
  confirmPending: () => Promise<unknown>;
  fetchSub: () => Promise<StorePlatformSubscription>;
  sleep?: (ms: number) => Promise<void>;
  pollAttempts?: number;
}

const applied = (sub: StorePlatformSubscription, planId: string) =>
  sub.platformPlanId === planId && !sub.pendingPlanChange && sub.status === 'active';

/**
 * Runs a plan change end to end and resolves ONLY when the plan really is active (or, for a trial commitment, when the
 * commitment is recorded). Throws with a real reason on a declined / unconfirmed payment — never reports success on HTTP 200 alone.
 */
export async function completePlanChange(planId: string, expectPaidNow: boolean, deps: PlanChangeDeps): Promise<StorePlatformSubscription> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  const res = await deps.change();
  const d = res.data ?? {};

  const paidByCard = !!(d.requiresAction && d.clientSecret);
  if (paidByCard) await deps.confirmCard(d.clientSecret!);
  if (d.pending) await deps.confirmPending();

  const attempts = deps.pollAttempts ?? 20;
  let sub = await deps.fetchSub();
  for (let i = 0; ; i++) {
    if (d.scheduled) return sub;
    if (applied(sub, planId)) return sub;
    if (!expectPaidNow && sub.pendingPlanChange?.planId === planId) return sub; // trial commitment recorded, billed at trial end
    if (!d.pending && !d.requiresAction && sub.platformPlanId === planId) return sub; // free / credit-only / manual provider
    if (i >= attempts) break;
    await sleep(1000);
    // Ask the server to check with the payment provider again: it applies a paid purchase even when the provider's own
    // notification is late (a refusal here is not final — the plan state below decides).
    if (d.pending && i % 4 === 3) await deps.confirmPending().catch(() => undefined);
    sub = await deps.fetchSub();
  }
  if (sub.lastBillingError) throw new Error(sub.lastBillingError);
  // The card step succeeded, so the seller has most likely been charged: never tell them to pay again.
  if (paidByCard || (d.pending && expectPaidNow)) throw new PlanStillActivatingError();
  throw new Error('We could not confirm your payment yet — your plan was not changed. Please try again.');
}

/** The payment went through but the plan is not active yet: shown instead of a "try again" that could lead to paying twice. */
export class PlanStillActivatingError extends Error {
  readonly stillActivating = true;
  constructor() {
    super('Your payment was received and your plan is being switched on. This can take a few minutes — please do not pay again. Refresh this page shortly.');
    this.name = 'PlanStillActivatingError';
  }
}

/** Banner for the two states the generic status banners miss: an ended ('canceled') subscription and a failed purchase attempt on a seller who kept their prior state. */
export function planProblemBanner(sub: Pick<StorePlatformSubscription, 'status' | 'lastBillingError' | 'pendingPlanChange'> | null | undefined): { text: string; action: string } | null {
  if (!sub) return null;
  if (sub.status === 'canceled') {
    return { text: 'Your subscription has ended — choose a plan to continue selling. Your data is safe.', action: 'Choose a plan' };
  }
  if (sub.lastBillingError && !isPlanGateStatus(sub.status) && sub.status !== 'past_due') {
    return { text: `Your last plan payment didn't go through (${sub.lastBillingError}). Your plan has not changed.`, action: 'Try again' };
  }
  return null;
}
