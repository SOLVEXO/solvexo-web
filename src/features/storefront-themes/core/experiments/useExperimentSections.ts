import { useEffect, useMemo } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { applySectionOverrides, reportExposure, useExperimentAssignments } from './experimentsStore';

/** Used by every theme's section renderer: the sections a visitor really sees (variant B changes applied) and the exposure report.
 *  Never active in the editor / preview (`enabled` false). */
export function useExperimentSections(sections: Section[], enabled: boolean): Section[] {
  const items = useExperimentAssignments();
  const { store } = useStorefront();
  const result = useMemo(() => (enabled ? applySectionOverrides(sections, items) : sections), [sections, items, enabled]);
  useEffect(() => {
    if (!enabled) return;
    for (const a of items) {
      if (a.kind === 'section' && a.variant !== 'winner' && sections.some((s) => String(s._id) === a.sectionId)) reportExposure(store.storeId, a.experimentId);
    }
  }, [items, sections, enabled, store.storeId]);
  return result;
}
