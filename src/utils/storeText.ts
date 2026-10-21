import type { Section, Block } from '@/api/services/storefrontTypes';

/** key → translated text, as served by GET api/public/store-text-translations/:storeId/:locale. Keys look like `s:<sectionId>#heading`. */
export type TextStrings = Record<string, string>;

/** The same strings grouped by container (`s:<id>`, `b:<sectionId>:<blockId>`, `hb:<id>`, `store`...) so one lookup serves one component. */
export type TextIndex = Map<string, [path: string, value: string][]>;

export function indexTextStrings(strings: TextStrings | null | undefined): TextIndex {
  const index: TextIndex = new Map();
  for (const [key, value] of Object.entries(strings ?? {})) {
    const at = key.indexOf('#');
    if (at < 1 || !value) continue;
    const container = key.slice(0, at);
    const list = index.get(container);
    if (list) list.push([key.slice(at + 1), value]);
    else index.set(container, [[key.slice(at + 1), value]]);
  }
  return index;
}

/** Returns a copy of `target` with the text at the dotted `path` replaced (arrays are walked by index); the source is never mutated. */
function setAtPath<T>(target: T, path: string, value: string): T {
  const parts = path.split('.');
  const walk = (node: any, i: number): any => {
    if (node == null || typeof node !== 'object') return node;
    const key = Array.isArray(node) ? Number(parts[i]) : parts[i];
    if (Array.isArray(node) && !Number.isInteger(key)) return node;
    if (!(key in node)) return node;
    const copy = Array.isArray(node) ? [...node] : { ...node };
    (copy as any)[key] = i === parts.length - 1 ? (typeof node[key] === 'string' ? value : node[key]) : walk(node[key], i + 1);
    return copy;
  };
  return walk(target, 0);
}

/** Applies the translated text of one container (e.g. `faq:<id>`) to a plain object. */
export function localizeFields<T>(target: T, container: string, index: TextIndex): T {
  return overlay(target, container, index);
}

function overlay<T>(target: T, container: string, index: TextIndex): T {
  const list = index.get(container);
  if (!list) return target;
  let next = target;
  for (const [path, value] of list) next = setAtPath(next, path, value);
  return next;
}

export function localizeSection(section: Section, index: TextIndex): Section {
  if (!index.size) return section;
  const sid = section._id;
  if (!sid) return section;
  const settings = overlay(section.settings, `s:${sid}`, index);
  const blocks = (section.blocks ?? []).map((block, i): Block => {
    const settingsOfBlock = overlay(block.settings, `b:${sid}:${block._id ?? i}`, index);
    return settingsOfBlock === block.settings ? block : { ...block, settings: settingsOfBlock };
  });
  return { ...section, settings, blocks };
}

export function localizeSections(sections: Section[], index: TextIndex): Section[] {
  return index.size ? sections.map((s) => localizeSection(s, index)) : sections;
}

function localizeChromeBlocks(blocks: Block[] | undefined, prefix: 'hb' | 'fb', index: TextIndex): Block[] | undefined {
  if (!blocks) return blocks;
  return blocks.map((block, i) => {
    const settings = overlay(block.settings, `${prefix}:${block._id ?? i}`, index);
    return settings === block.settings ? block : { ...block, settings };
  });
}

/** Store name, tagline, description and the announcement bar in the visitor's language. */
export function localizeStoreText<S extends { name?: string; tagline?: string | null; description?: string | null; announcementBar?: any }>(store: S, index: TextIndex): S {
  if (!index.size) return store;
  const own = overlay({ name: store.name, tagline: store.tagline, description: store.description }, 'store', index);
  const bar = store.announcementBar ? overlay(store.announcementBar, 'announcement', index) : store.announcementBar;
  return { ...store, ...own, announcementBar: bar };
}

/** Header and footer text (button, labels, nav links, footer columns and their extra sections) in the visitor's language. */
export function localizeThemeText<T extends { header?: any; footer?: any }>(theme: T | null, index: TextIndex): T | null {
  if (!theme || !index.size) return theme;
  const header = theme.header ? { ...overlay(theme.header, 'header', index), blocks: localizeChromeBlocks(theme.header.blocks, 'hb', index), sections: theme.header.sections ? localizeSections(theme.header.sections, index) : theme.header.sections } : theme.header;
  const footer = theme.footer ? { ...overlay(theme.footer, 'footer', index), blocks: localizeChromeBlocks(theme.footer.blocks, 'fb', index), sections: theme.footer.sections ? localizeSections(theme.footer.sections, index) : theme.footer.sections } : theme.footer;
  return { ...theme, header, footer };
}
