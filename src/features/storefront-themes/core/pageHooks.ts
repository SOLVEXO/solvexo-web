import { useEffect, useRef, useState } from 'react';
import type { Section, SectionType } from '@/api/services/storefrontTypes';
import { apiGetPublicCollectionTemplate, type ResourceTemplateType } from '@/api/services/collectionTemplate';

/** The seller's published template sections for a page (product / collection / search / cart / 404 ...). */
export function useTemplateSections(storeId: string | undefined, type: ResourceTemplateType, key: string): Section[] {
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    if (!storeId) return;
    let off = false;
    apiGetPublicCollectionTemplate(storeId, type, key)
      .then(r => { if (!off) setSections(r.data?.sections ?? []); })
      .catch(() => { if (!off) setSections([]); });
    return () => { off = true; };
  }, [storeId, type, key]);
  return sections;
}

/** Sections above / below a locked core section; with no such section everything goes below. */
export function splitAround(sections: Section[], core: SectionType): { before: Section[]; after: Section[]; main?: Section } {
  const at = sections.findIndex(s => s.type === core);
  const clean = (list: Section[]) => list.filter(s => s.type !== core);
  if (at < 0) return { before: [], after: clean(sections) };
  return { before: clean(sections.slice(0, at)), after: clean(sections.slice(at + 1)), main: sections[at] };
}

/** Loads something whenever `deps` change; `retry` runs it again. `loading` is derived, so there is no flash of stale data. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: boolean; retry: () => void } {
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  const [tick, setTick] = useState(0);
  const [res, setRes] = useState<{ key: string; data: T | null; error: boolean } | null>(null);
  const key = `${JSON.stringify(deps)}#${tick}`;
  useEffect(() => {
    let off = false;
    loadRef.current()
      .then(data => { if (!off) setRes({ key, data, error: false }); })
      .catch(() => { if (!off) setRes({ key, data: null, error: true }); });
    return () => { off = true; };
  }, [key]);
  const done = res?.key === key;
  return { data: done ? res.data : null, loading: !done, error: done && res.error, retry: () => setTick(n => n + 1) };
}