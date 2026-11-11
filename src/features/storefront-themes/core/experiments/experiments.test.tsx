import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const assignments = vi.fn();
const exposure = vi.fn();
let identity: { visitorId: string; sessionId: string } | null = { visitorId: 'visitor-00000001', sessionId: 'sess-00000001' };
let visitor: string | null = 'visitor-00000001';
vi.mock('@/api/services/experiments', () => ({ apiExperimentAssignments: (...a: unknown[]) => assignments(...a), apiExperimentExposure: (...a: unknown[]) => exposure(...a) }));
vi.mock('@/utils/storefrontAnalytics', () => ({ experimentIdentity: () => identity, experimentVisitorId: () => visitor }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1' } }) }));

import { applySectionOverrides, loadExperiments } from './experimentsStore';
import { useExperimentSections } from './useExperimentSections';
import type { Section } from '@/api/services/storefrontTypes';

const sec = (id: string, settings: Record<string, unknown> = {}) => ({ _id: id, type: 'hero', enabled: true, blocks: [{ type: 'x' }], settings } as unknown as Section);
const SEC = 'a'.repeat(24);
const asg = (variant: 'a' | 'b' | 'winner', overrides: Record<string, string | number | boolean> = {}, experimentId = 'e1') => ({ experimentId, kind: 'section' as const, sectionId: SEC, variant, overrides });

describe('applySectionOverrides', () => {
  it('only variant B and an applied winner change the section, and only its settings', () => {
    const s = [sec(SEC, { heading: 'Old', keep: 1 }), sec('b'.repeat(24), { heading: 'Other' })];
    expect(applySectionOverrides(s, [asg('a')])).toBe(s);
    const out = applySectionOverrides(s, [asg('b', { heading: 'New' })]);
    expect(out[0].settings).toEqual({ heading: 'New', keep: 1 });
    expect(out[0].blocks).toEqual(s[0].blocks); expect(out[0].type).toBe('hero');
    expect(out[1]).toBe(s[1]);
    expect(applySectionOverrides(s, [asg('winner', { heading: 'W' })])[0].settings).toMatchObject({ heading: 'W' });
    expect(s[0].settings).toEqual({ heading: 'Old', keep: 1 }); // never mutates the original
  });
  it('a test on a section that is not on the page changes nothing', () => {
    const s = [sec('c'.repeat(24))];
    expect(applySectionOverrides(s, [asg('b', { heading: 'x' })])).toEqual(s);
  });
});

function Probe({ sections, enabled, out }: { sections: Section[]; enabled: boolean; out: { current: Section[] } }) {
  out.current = useExperimentSections(sections, enabled);
  return null;
}

describe('useExperimentSections + exposure', () => {
  beforeEach(() => { vi.useFakeTimers(); assignments.mockReset(); exposure.mockReset(); exposure.mockResolvedValue({ recorded: true }); identity = { visitorId: 'visitor-00000001', sessionId: 'sess-00000001' }; visitor = 'visitor-00000001'; });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('shows B and reports the exposure once (after the visit exists), not in the editor', async () => {
    assignments.mockResolvedValue([asg('b', { heading: 'New' }, 'exp-report-1')]);
    const out = { current: [] as Section[] };
    const sections = [sec(SEC, { heading: 'Old' })];
    render(<Probe sections={sections} enabled out={out} />);
    loadExperiments('s1');
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(out.current[0].settings?.heading).toBe('New');
    expect(exposure).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1600); await Promise.resolve(); });
    expect(exposure).toHaveBeenCalledTimes(1);
    expect(exposure.mock.calls[0]).toEqual(['s1', { sessionId: 'sess-00000001', visitorId: 'visitor-00000001', experimentId: 'exp-report-1' }]);
    cleanup();
    const editorOut = { current: [] as Section[] };
    render(<Probe sections={sections} enabled={false} out={editorOut} />);
    expect(editorOut.current[0].settings?.heading).toBe('Old');
  });

  it('asks for assignments with no visitor id when analytics was not allowed (winners only)', async () => {
    visitor = null;
    assignments.mockResolvedValue([]);
    loadExperiments('s2');
    await act(async () => { await Promise.resolve(); });
    expect(assignments).toHaveBeenCalledWith('s2', undefined);
  });

  it('a failing request leaves the normal store (no crash)', async () => {
    assignments.mockRejectedValue(new Error('down'));
    const out = { current: [] as Section[] };
    const sections = [sec(SEC, { heading: 'Old' })];
    render(<Probe sections={sections} enabled out={out} />);
    loadExperiments('s3');
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(out.current[0].settings?.heading).toBe('Old');
  });
});
