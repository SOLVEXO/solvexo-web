import { useSyncExternalStore } from 'react';
import { apiExperimentAssignments, apiExperimentExposure, type ExperimentAssignment } from '@/api/services/experiments';
import { experimentIdentity, experimentVisitorId } from '@/utils/storefrontAnalytics';
import type { Section } from '@/api/services/storefrontTypes';

/**
 * A/B tests on the storefront. Visitors who did NOT allow analytics have no visitor id, so they are never put in a test
 * (they only see an applied winner, which the server hands to everyone). A visit reports "I joined test X" once;
 * the server recomputes the variant, so the browser cannot choose it. Failures never break the storefront.
 */
let state: { storeId: string; items: ExperimentAssignment[] } = { storeId: '', items: [] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const reported = new Set<string>();

export function loadExperiments(storeId: string): void {
  if (!storeId) return;
  apiExperimentAssignments(storeId, experimentVisitorId() ?? undefined)
    .then((items) => { state = { storeId, items: Array.isArray(items) ? items : [] }; emit(); })
    .catch(() => { /* the normal store is always the fallback */ });
}

export function useExperimentAssignments(): ExperimentAssignment[] {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => state.items, () => state.items);
}

/** Once per visit and test. The page view creates the visit first, so the first try waits a moment and retries once. */
export function reportExposure(storeId: string, experimentId: string): void {
  const key = `${storeId}:${experimentId}`;
  if (reported.has(key)) return;
  reported.add(key);
  const attempt = (n: number) => {
    const id = experimentIdentity(storeId);
    if (!id) { reported.delete(key); return; }
    apiExperimentExposure(storeId, { sessionId: id.sessionId, visitorId: id.visitorId, experimentId })
      .then((r) => { if (!r.recorded && n === 0) setTimeout(() => attempt(1), 4000); })
      .catch(() => { /* ignore */ });
  };
  setTimeout(() => attempt(0), 1500);
}

/** Merges the overrides of the assigned section tests into the matching sections (never touches blocks, type or colours). */
export function applySectionOverrides(sections: Section[], items: ExperimentAssignment[]): Section[] {
  const bySection = new Map<string, Record<string, string | number | boolean>>();
  for (const a of items) if (a.kind === 'section' && a.sectionId && (a.variant === 'b' || a.variant === 'winner') && Object.keys(a.overrides).length) bySection.set(a.sectionId, a.overrides);
  if (bySection.size === 0) return sections;
  return sections.map((s) => { const o = bySection.get(String(s._id)); return o ? { ...s, settings: { ...(s.settings ?? {}), ...o } } : s; });
}
