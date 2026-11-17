import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import type { Section } from '@/api/services/storefrontTypes';
import type { SavedSectionEntry } from '@/api/services/savedSections';
import { resolveSavedSections, hasSavedSectionRefs } from './savedSectionsResolve';
import { invalidateSavedSections, resetSavedSectionsCache, useResolvedSavedSections } from './useSavedSections';

const listPublic = vi.fn();
vi.mock('@/api/services/savedSections', () => ({ apiListPublicSavedSections: (...a: unknown[]) => listPublic(...a) }));

const entry = (over: Partial<SavedSectionEntry> = {}): SavedSectionEntry => ({
  _id: 'e1', name: 'Shipping bar', type: 'rich_text', settings: { heading: 'Free shipping', paddingTop: 8 },
  blocks: [{ _id: 'b1', type: 'paragraph', settings: { text: 'hi' } }] as never, colorSchemeId: 'cs1', ...over,
});
const ref = (id = 'e1', over: Partial<Section> = {}): Section => ({ _id: 'p1', type: 'saved_section', settings: { savedSectionId: id }, blocks: [], ...over });
const plain = (id: string): Section => ({ _id: id, type: 'faq', settings: {}, blocks: [] });

describe('resolveSavedSections', () => {
  it('returns the same array when nothing is a reference (no work, no re-render)', () => {
    const list = [plain('a'), plain('b')];
    expect(hasSavedSectionRefs(list)).toBe(false);
    expect(resolveSavedSections(list, null)).toBe(list);
  });

  it('draws the entry content in place of the reference and keeps the page\'s own id, position, hidden state and lock', () => {
    const out = resolveSavedSections([plain('a'), ref('e1', { enabled: false, locked: true }), plain('b')], [entry()]);
    expect(out.map(s => s.type)).toEqual(['faq', 'rich_text', 'faq']);
    expect(out[1]).toMatchObject({ _id: 'p1', enabled: false, locked: true, colorSchemeId: 'cs1', settings: { heading: 'Free shipping', paddingTop: 8 } });
    expect(out[1].blocks).toHaveLength(1);
  });

  it('drops a reference whose entry was deleted, or has not loaded yet', () => {
    expect(resolveSavedSections([plain('a'), ref('gone')], [entry()]).map(s => s._id)).toEqual(['a']);
    expect(resolveSavedSections([ref('e1')], null)).toEqual([]);
  });

  it('two pages can use the same entry', () => {
    const out = resolveSavedSections([ref('e1', { _id: 'x' }), ref('e1', { _id: 'y' })], [entry()]);
    expect(out.map(s => s._id)).toEqual(['x', 'y']);
  });
});

describe('useResolvedSavedSections', () => {
  beforeEach(() => { resetSavedSectionsCache(); listPublic.mockReset(); });
  afterEach(cleanup);

  it('makes no request for a page without references', () => {
    const sections = [plain('a')];
    const { result } = renderHook(() => useResolvedSavedSections(sections, 'S1'));
    expect(result.current).toBe(sections);
    expect(listPublic).not.toHaveBeenCalled();
  });

  it('loads the library once and fills the references in', async () => {
    listPublic.mockResolvedValue({ data: [entry()] });
    const sections = [ref()];
    const { result } = renderHook(() => useResolvedSavedSections(sections, 'S1'));
    expect(result.current).toEqual([]); // still loading: draws nothing
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].type).toBe('rich_text');
    // a second page of the same store reuses the loaded copy
    renderHook(() => useResolvedSavedSections([ref()], 'S1'));
    expect(listPublic).toHaveBeenCalledTimes(1);
  });

  it('re-draws from the new content after the editor changes an entry', async () => {
    listPublic.mockResolvedValue({ data: [entry()] });
    const sections = [ref()];
    const { result } = renderHook(() => useResolvedSavedSections(sections, 'S1'));
    await waitFor(() => expect(result.current).toHaveLength(1));
    listPublic.mockResolvedValue({ data: [entry({ settings: { heading: 'Changed' } })] });
    await act(async () => { invalidateSavedSections('S1'); });
    await waitFor(() => expect(result.current[0].settings.heading).toBe('Changed'));
  });

  it('a failed load keeps the page working (the reference just draws nothing)', async () => {
    listPublic.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useResolvedSavedSections([plain('a'), ref()], 'S1'));
    await waitFor(() => expect(listPublic).toHaveBeenCalled());
    expect(result.current.map(s => s._id)).toEqual(['a']);
  });
});
