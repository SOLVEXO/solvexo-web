import type { EntitlementsSummary } from '@/api/services/platformPlans';

/**
 * Is a page blocked because the store's PLAN does not include its feature?
 * `entitlements === null` (not loaded yet) never blocks, same convention as the sidebar
 * (`hasNavEntitlement`), so a page does not flash "not in your plan" while the plan loads.
 * A key the API does not know (older API) also never blocks.
 */
export function planGateFor(
  entitlements: EntitlementsSummary | null,
  key: string | null | undefined,
): { blocked: boolean; requiredPlan: string | null } {
  if (!key || !entitlements) return { blocked: false, requiredPlan: null };
  const feature = entitlements[key] as { allowed?: boolean; requiredPlan?: string | null } | undefined;
  if (feature?.allowed !== false) return { blocked: false, requiredPlan: null };
  return { blocked: true, requiredPlan: feature.requiredPlan ?? null };
}
