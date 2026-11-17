import type { Section } from '@/api/services/storefrontTypes';
import type { SavedSectionEntry } from '@/api/services/savedSections';

/** Pure part of "saved (global) sections": a page holds `{ type: 'saved_section', settings: { savedSectionId } }`; the storefront
 *  and the editor preview draw the library entry's content in its place. The reference keeps its own id (so the editor's
 *  click-to-select still matches the card), its position, hidden state and lock; the content comes from the entry. */

export function isSavedSectionRef(section: Pick<Section, 'type'>): boolean {
  return section.type === 'saved_section';
}

export function hasSavedSectionRefs(sections: readonly Pick<Section, 'type'>[]): boolean {
  return sections.some(isSavedSectionRef);
}

/** Replaces every reference with the entry's content. A reference whose entry no longer exists (or is still loading) is dropped.
 *  Returns the SAME array when there is nothing to resolve, so memoised callers do not re-render. */
export function resolveSavedSections(sections: Section[], library: readonly SavedSectionEntry[] | null): Section[] {
  if (!hasSavedSectionRefs(sections)) return sections;
  const byId = new Map((library ?? []).map(e => [e._id, e]));
  const out: Section[] = [];
  for (const section of sections) {
    if (!isSavedSectionRef(section)) { out.push(section); continue; }
    const entry = byId.get(String(section.settings?.savedSectionId ?? ''));
    if (!entry) continue;
    out.push({
      _id: section._id,
      type: entry.type,
      settings: entry.settings ?? {},
      blocks: entry.blocks ?? [],
      enabled: section.enabled,
      colorSchemeId: entry.colorSchemeId ?? null,
      locked: section.locked,
    });
  }
  return out;
}
