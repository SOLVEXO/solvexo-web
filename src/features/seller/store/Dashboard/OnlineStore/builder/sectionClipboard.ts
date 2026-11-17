import type { Section } from '@/api/services/storefrontTypes';

/** "Copy section" / "Paste section": one section held in the browser (localStorage), so it can be pasted on another page, another
 *  template or another store tab. Nothing is stored on the server. */
const KEY = 'solvexo:section-clipboard';
const VERSION = 1;

export interface ClipboardSection {
  v: number;
  copiedAt: number;
  section: { type: Section['type']; settings: Record<string, unknown>; blocks: { type: string; settings: Record<string, unknown>; enabled?: boolean }[]; colorSchemeId: string | null; enabled: boolean };
}

/** Same content without any database id (a pasted section is a new one) and without the lock. */
export function cleanSectionCopy(section: Section): ClipboardSection['section'] {
  return {
    type: section.type,
    settings: JSON.parse(JSON.stringify(section.settings ?? {})),
    blocks: (section.blocks ?? []).map(b => {
      const { _id, ...rest } = b as { _id?: string; type: string; settings: Record<string, unknown>; enabled?: boolean };
      void _id;
      return JSON.parse(JSON.stringify({ ...rest, settings: rest.settings ?? {} }));
    }),
    colorSchemeId: section.colorSchemeId ?? null,
    enabled: section.enabled !== false,
  };
}

export function copySectionToClipboard(section: Section): boolean {
  try {
    const payload: ClipboardSection = { v: VERSION, copiedAt: Date.now(), section: cleanSectionCopy(section) };
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readSectionClipboard(): ClipboardSection | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClipboardSection;
    if (parsed?.v !== VERSION || typeof parsed.section?.type !== 'string' || typeof parsed.section.settings !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSectionClipboard(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

export interface PasteContext {
  /** The active theme's section types (undefined = no filter). */
  supportedTypes?: string[];
  /** Core/fixed section types that can never be pasted. */
  isCoreType: (type: string) => boolean;
  /** For a theme-defined section: does the active theme know it? */
  themeSectionKnown: (section: ClipboardSection['section']) => boolean;
  /** For a saved-section reference: does THIS store's library hold it? */
  savedSectionKnown: (id: string) => boolean;
  /** Sections the page already has / may have. */
  count: number;
  max: number;
}

/** Why the clipboard cannot be pasted here (null = fine). Plain words for the seller. */
export function pasteBlockedReason(clip: ClipboardSection | null, ctx: PasteContext): string | null {
  if (!clip) return 'Nothing copied yet. Use "Copy section" on any section first.';
  const s = clip.section;
  if (ctx.count >= ctx.max) return `This page already has the most sections allowed (${ctx.max}).`;
  if (ctx.isCoreType(s.type)) return 'This part of the page is fixed and can not be pasted.';
  if (s.type === 'saved_section') {
    return ctx.savedSectionKnown(String(s.settings?.savedSectionId ?? '')) ? null : 'That saved section belongs to another store, or was deleted.';
  }
  if (s.type === 'theme_section') return ctx.themeSectionKnown(s) ? null : 'This section belongs to another theme, so the current theme can not show it.';
  if (ctx.supportedTypes && !ctx.supportedTypes.includes(s.type)) return 'The current theme can not show this kind of section.';
  return null;
}
