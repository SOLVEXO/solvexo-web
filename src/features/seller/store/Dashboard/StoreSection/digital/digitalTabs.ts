import type { EntitlementsSummary } from '@/api/services/platformPlans';
import { planGateFor } from '@/components/layouts/planGate';

export type Tab = 'overview' | 'plans' | 'subscribers' | 'courses' | 'licenses' | 'reports' | 'log';

/** `entitlement` = the plan feature the tab needs; the tab is hidden while the plan says `allowed: false`. */
export const TABS: { id: Tab; label: string; perm: string; entitlement?: string }[] = [
  { id: 'overview', label: 'Overview', perm: 'digital.view' },
  { id: 'plans', label: 'Plans', perm: 'members.manage', entitlement: 'digitalMembershipsAllowed' },
  { id: 'subscribers', label: 'Subscribers', perm: 'members.manage', entitlement: 'digitalMembershipsAllowed' },
  { id: 'courses', label: 'Courses', perm: 'courses.manage', entitlement: 'digitalCoursesAllowed' },
  { id: 'licenses', label: 'Licenses', perm: 'licenses.manage', entitlement: 'digitalLicensesAllowed' },
  { id: 'reports', label: 'Reports', perm: 'digital.view' },
  { id: 'log', label: 'Delivery log', perm: 'digital.view' },
];

/** Tabs the role may open AND the plan includes. Entitlements not loaded yet = nothing hidden (no flash). */
export function visibleDigitalTabs(allowedByRole: (perm: string) => boolean, entitlements: EntitlementsSummary | null) {
  return TABS.filter(t => allowedByRole(t.perm) && !planGateFor(entitlements, t.entitlement).blocked);
}

/** The tab to show: the chosen one when still visible, else the first visible one. */
export function activeDigitalTab(chosen: Tab, visible: { id: Tab }[]): Tab {
  return visible.some(t => t.id === chosen) ? chosen : (visible[0]?.id ?? 'overview');
}
