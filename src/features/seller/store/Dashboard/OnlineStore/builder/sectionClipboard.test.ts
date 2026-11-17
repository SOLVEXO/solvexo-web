import { describe, it, expect, beforeEach } from 'vitest';
import type { Section } from '@/api/services/storefrontTypes';
import { cleanSectionCopy, clearSectionClipboard, copySectionToClipboard, pasteBlockedReason, readSectionClipboard, type PasteContext } from './sectionClipboard';

const section: Section = {
  _id: 'abc', type: 'rich_text', enabled: false, locked: true, colorSchemeId: 'cs',
  settings: { heading: 'Hi', animation: 'fade' },
  blocks: [{ _id: 'b1', type: 'paragraph', settings: { text: 'x' } } as never],
};
const ctx = (over: Partial<PasteContext> = {}): PasteContext => ({
  isCoreType: t => t === 'product_main', themeSectionKnown: () => true, savedSectionKnown: id => id === 'known',
  count: 3, max: 25, ...over,
});

beforeEach(() => { localStorage.clear(); });

describe('section clipboard', () => {
  it('a copy has no ids and no lock (a pasted section is a new one) but keeps its content', () => {
    const c = cleanSectionCopy(section);
    expect(c).not.toHaveProperty('_id');
    expect(c).not.toHaveProperty('locked');
    expect(c.blocks[0]).not.toHaveProperty('_id');
    expect(c).toMatchObject({ type: 'rich_text', enabled: false, colorSchemeId: 'cs', settings: { heading: 'Hi', animation: 'fade' } });
    expect(c.blocks[0]).toMatchObject({ type: 'paragraph', settings: { text: 'x' } });
  });

  it('the copy is detached from the original (editing one never edits the other)', () => {
    const c = cleanSectionCopy(section);
    c.settings.heading = 'Changed';
    expect(section.settings.heading).toBe('Hi');
  });

  it('copies to the browser and reads it back; clearing empties it', () => {
    expect(readSectionClipboard()).toBeNull();
    expect(copySectionToClipboard(section)).toBe(true);
    expect(readSectionClipboard()?.section.type).toBe('rich_text');
    clearSectionClipboard();
    expect(readSectionClipboard()).toBeNull();
  });

  it('ignores a damaged or foreign clipboard value', () => {
    localStorage.setItem('solvexo:section-clipboard', '{nope');
    expect(readSectionClipboard()).toBeNull();
    localStorage.setItem('solvexo:section-clipboard', JSON.stringify({ v: 99, section: { type: 'x', settings: {} } }));
    expect(readSectionClipboard()).toBeNull();
  });
});

describe('pasteBlockedReason', () => {
  const clipOf = (s: Partial<Section>) => { copySectionToClipboard({ type: 'rich_text', settings: {}, blocks: [], ...s } as Section); return readSectionClipboard(); };

  it('allows an ordinary section', () => { expect(pasteBlockedReason(clipOf({}), ctx())).toBeNull(); });
  it('says when nothing was copied', () => { expect(pasteBlockedReason(null, ctx())).toMatch(/Nothing copied/); });
  it('refuses at the section limit', () => { expect(pasteBlockedReason(clipOf({}), ctx({ count: 25 }))).toMatch(/most sections/); });
  it('refuses a fixed core part of a page', () => { expect(pasteBlockedReason(clipOf({ type: 'product_main' }), ctx())).toMatch(/fixed/); });
  it('refuses a type the active theme cannot draw', () => {
    expect(pasteBlockedReason(clipOf({ type: 'hero' }), ctx({ supportedTypes: ['rich_text'] }))).toMatch(/theme can not show/);
    expect(pasteBlockedReason(clipOf({ type: 'rich_text' }), ctx({ supportedTypes: ['rich_text'] }))).toBeNull();
  });
  it('a theme-defined section needs the active theme to know it', () => {
    expect(pasteBlockedReason(clipOf({ type: 'theme_section', settings: { sectionKey: 'x.y' } }), ctx({ themeSectionKnown: () => false }))).toMatch(/another theme/);
  });
  it('a saved-section reference only works in the store that owns it', () => {
    expect(pasteBlockedReason(clipOf({ type: 'saved_section', settings: { savedSectionId: 'known' } }), ctx())).toBeNull();
    expect(pasteBlockedReason(clipOf({ type: 'saved_section', settings: { savedSectionId: 'other-store' } }), ctx())).toMatch(/another store|deleted/);
  });
});
