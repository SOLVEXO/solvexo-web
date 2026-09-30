// A plan picked on the public Pricing page, carried across the sign-up →
// verify-OTP → login → /onboard hops (none of which keep a query string) so the
// onboarding checkout opens on the plan the visitor actually chose. Stored in
// localStorage with a timestamp: a stale pick (never followed through) expires
// after a day instead of surprising a later, unrelated onboarding.
const KEY = 'solvexo.pendingPlan';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PendingPlan = { planId: string; billing: 'monthly' | 'annual' };

export function savePendingPlan(planId: string, billing: 'monthly' | 'annual'): void {
  try { localStorage.setItem(KEY, JSON.stringify({ planId, billing, at: Date.now() })); } catch { /* storage blocked — the pick just won't carry over */ }
}

/** Reads the pick (if fresh) and clears it — a pick is applied at most once. */
export function takePendingPlan(): PendingPlan | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { planId?: unknown; billing?: unknown; at?: unknown };
    if (typeof parsed.planId !== 'string' || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return { planId: parsed.planId, billing: parsed.billing === 'annual' ? 'annual' : 'monthly' };
  } catch {
    return null;
  }
}
