import { resolveSectionMeta } from './themeSectionMeta';

/** What the Customize editor can tell the seller about a save/publish error from the server. */
export interface EditorErrorInfo {
  /** Plain-language message, naming the section (e.g. "Image Banner: Button link must be a valid URL"). */
  text: string;
  /** Same ids the section cards / preview use (`String(section._id ?? index)`), so selecting them scrolls + highlights the card. */
  sectionId?: string;
  blockId?: string;
}

interface SectionLite { _id?: unknown; type: string; settings?: Record<string, unknown>; blocks?: Array<{ _id?: unknown }> }

const words = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Backend validation errors look like `sections.1.blocks.0.settings.buttonLink must be a URL`.
 * Finds the section (and block) behind that path and rewrites it in words.
 */
export function describeEditorError(message: string, sections: SectionLite[]): EditorErrorInfo {
  const m = /sections\.(\d+)(?:\.blocks\.(\d+))?(?:\.settings)?(?:\.([A-Za-z0-9_]+))?\s*(.*)$/.exec(message);
  if (!m) return { text: message };
  const section = sections[Number(m[1])];
  if (!section) return { text: message };
  const label = resolveSectionMeta(section as never)?.label ?? cap(words(section.type));
  const blockIndex = m[2] !== undefined ? Number(m[2]) : undefined;
  const block = blockIndex !== undefined ? section.blocks?.[blockIndex] : undefined;
  const field = m[3] && !/^(settings|blocks)$/.test(m[3]) ? cap(words(m[3])) : '';
  let rest = (m[4] ?? '').trim();
  if (/^must be an object$/i.test(rest)) rest = 'is missing its settings. Open it and save again';
  const where = blockIndex !== undefined ? `${label}, item ${blockIndex + 1}` : label;
  const detail = [field, rest].filter(Boolean).join(' ');
  return {
    text: detail ? `${where}: ${detail}` : where,
    sectionId: String(section._id ?? m[1]),
    blockId: blockIndex !== undefined ? String(block?._id ?? blockIndex) : undefined,
  };
}
