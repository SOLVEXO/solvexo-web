import { describe, it, expect } from 'vitest';
import type { EntitlementsSummary } from '@/api/services/platformPlans';
import { entitlementForPath } from './StoreLayout';
import { planGateFor } from './planGate';
import { visibleDigitalTabs, activeDigitalTab } from '@/features/seller/store/Dashboard/StoreSection/digital/digitalTabs';

const ent = (over: Record<string, unknown>) => ({ currentPlanName: 'Basic', ...over }) as unknown as EntitlementsSummary;

describe('entitlementForPath', () => {
  it('maps gated pages to their plan feature, including sub-URLs', () => {
    expect(entitlementForPath('app-platform')).toBe('apiWebhooksAllowed');
    expect(entitlementForPath('wholesale')).toBe('b2bWholesaleAllowed');
    expect(entitlementForPath('wholesale/catalogs/abc')).toBe('b2bWholesaleAllowed');
    expect(entitlementForPath('loyalty')).toBe('loyaltyProgramAllowed');
  });
  it('returns null for pages that are not plan-gated or not a nav page', () => {
    expect(entitlementForPath('orders')).toBeNull();
    expect(entitlementForPath('account')).toBeNull();
  });
});

describe('planGateFor', () => {
  it('passes while entitlements are not loaded, or the page has no plan feature', () => {
    expect(planGateFor(null, 'apiWebhooksAllowed').blocked).toBe(false);
    expect(planGateFor(ent({}), null).blocked).toBe(false);
  });
  it('passes when the plan allows it or the API does not know the key', () => {
    expect(planGateFor(ent({ apiWebhooksAllowed: { allowed: true, requiredPlan: null } }), 'apiWebhooksAllowed').blocked).toBe(false);
    expect(planGateFor(ent({}), 'apiWebhooksAllowed').blocked).toBe(false);
  });
  it('blocks when the plan says not allowed and reports the plan that unlocks it', () => {
    expect(planGateFor(ent({ apiWebhooksAllowed: { allowed: false, requiredPlan: 'Advanced' } }), 'apiWebhooksAllowed')).toEqual({ blocked: true, requiredPlan: 'Advanced' });
    expect(planGateFor(ent({ b2bWholesaleAllowed: { allowed: false, requiredPlan: null } }), 'b2bWholesaleAllowed')).toEqual({ blocked: true, requiredPlan: null });
  });
});

describe('Digital hub tabs', () => {
  const everyone = () => true;
  const ids = (e: EntitlementsSummary | null) => visibleDigitalTabs(everyone, e).map(t => t.id);
  it('shows every tab while the plan is unknown or allows everything', () => {
    expect(ids(null)).toEqual(['overview', 'plans', 'subscribers', 'courses', 'licenses', 'reports', 'log']);
  });
  it('hides memberships, licenses and courses tabs the plan does not include', () => {
    const e = ent({
      digitalMembershipsAllowed: { allowed: false, requiredPlan: 'Grow' },
      digitalLicensesAllowed: { allowed: false, requiredPlan: 'Grow' },
      digitalCoursesAllowed: { allowed: false, requiredPlan: 'Grow' },
    });
    expect(ids(e)).toEqual(['overview', 'reports', 'log']);
  });
  it('hides only the tab whose feature is off, and still applies the staff permission', () => {
    expect(ids(ent({ digitalCoursesAllowed: { allowed: false, requiredPlan: 'Grow' } }))).not.toContain('courses');
    expect(visibleDigitalTabs(p => p === 'digital.view', null).map(t => t.id)).toEqual(['overview', 'reports', 'log']);
  });
  it('falls back to the first visible tab when the chosen one is hidden', () => {
    const visible = [{ id: 'overview' as const }, { id: 'log' as const }];
    expect(activeDigitalTab('courses', visible)).toBe('overview');
    expect(activeDigitalTab('log', visible)).toBe('log');
  });
});
