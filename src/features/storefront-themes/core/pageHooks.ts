import { useEffect, useRef, useState } from 'react';
import type { Section, SectionType } from '@/api/services/storefrontTypes';
import { apiGetPublicCollectionTemplate, type ResourceTemplateType } from '@/api/services/collectionTemplate';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

/** The seller's published template sections for a page (product / collection / search / cart / 404 ...). */
export function templateSsrKey(storeId: string, type: ResourceTemplateType, key: string): string {
  return `template:${storeId}:${type}:${key}`;
}

export function useTemplateSections(storeId: string | undefined, type: ResourceTemplateType, key: string): Section[] {
  const ssrKey = storeId ? templateSsrKey(storeId, type, key) : undefined;
  const [seeded] = useState(() => peekSsr<Section[]>(ssrKey));
  const [sections, setSections] = useState<Section[]>(() => seeded ?? []);
  const skipFirst = useRef(seeded !== undefined);
  // Same outcome as the effect below: a template that cannot be read means "no extra sections".
  if (seeded === undefined && storeId) wantSsr(ssrKey, () => apiGetPublicCollectionTemplate(storeId, type, key).then(r => r.data?.sections ?? []).catch(() => [] as Section[]));
  useEffect(() => {
    if (!storeId) return;
    if (skipFirst.current) { skipFirst.current = false; if (ssrKey) dropSsr(ssrKey); return; }
    let off = false;
    apiGetPublicCollectionTemplate(storeId, type, key)
      .then(r => { if (!off) setSections(r.data?.sections ?? []); })
      .catch(() => { if (!off) setSections([]); });
    return () => { off = true; };
  }, [storeId, type, key, ssrKey]);
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
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], ssrKey?: string): { data: T | null; loading: boolean; error: boolean; retry: () => void } {
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  const [tick, setTick] = useState(0);
  const key = `${JSON.stringify(deps)}#${tick}`;
  // Server-rendered / inline data for this call: the very first render already has it (no skeleton, no request).
  // Used once: after the first render the entry is dropped so navigations and retries fetch fresh data.
  const [seeded] = useState(() => peekSsr<T>(ssrKey));
  const [res, setRes] = useState<{ key: string; data: T | null; error: boolean } | null>(() => (seeded !== undefined ? { key, data: seeded, error: false } : null));
  const skipFirst = useRef(seeded !== undefined);
  // Server collecting pass: ask for this data (no effect runs on the server).
  if (seeded === undefined) wantSsr(ssrKey, load);
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; if (ssrKey) dropSsr(ssrKey); return; }
    let off = false;
    loadRef.current()
      .then(data => { if (!off) setRes({ key, data, error: false }); })
      .catch(() => { if (!off) setRes({ key, data: null, error: true }); });
    return () => { off = true; };
  }, [key, ssrKey]);
  const done = res?.key === key;
  return { data: done ? res.data : null, loading: !done, error: done && res.error, retry: () => setTick(n => n + 1) };
}