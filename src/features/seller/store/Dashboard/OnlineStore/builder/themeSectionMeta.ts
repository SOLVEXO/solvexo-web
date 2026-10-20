import { Boxes } from 'lucide-react';
import { findCustomBlockDef, findCustomSectionDef, type ThemeCustomSectionDef, type ThemeCustomSectionPreset } from '@/features/storefront-themes/themeManifest';
import type { Section } from '@/api/services/storefrontTypes';
import type { FieldSchema } from './SchemaForm';
import { SECTION_META_BY_TYPE, type SectionMeta } from './sectionRegistry';

type SectionLike = { type: string; settings?: Record<string, unknown> };

/** Editor metadata for a section a theme declares in its manifest (stored as `theme_section` + `settings.sectionKey`). */
export function metaForCustomDef(def: ThemeCustomSectionDef): SectionMeta {
  const blockKey = def.block ? `${def.key}.${def.block.key}` : null;
  return {
    type: 'theme_section',
    label: def.label,
    description: def.description,
    Icon: Boxes,
    color: def.color ?? '#7C3AED',
    defaultSettings: { sectionKey: def.key, ...(def.defaults ?? {}) },
    allowedBlockTypes: blockKey ? ['theme_block'] : [],
    blockLabel: def.block?.label ?? '',
    defaultBlockSettings: blockKey ? { blockKey, ...(def.block?.defaults ?? {}) } : {},
    settingsSchema: def.fields,
  };
}

/** The editor metadata of any saved section: the built-in catalogue, or the theme's own declaration. */
export function resolveSectionMeta(section: SectionLike): SectionMeta | undefined {
  if (section.type === 'theme_section') {
    const def = findCustomSectionDef(section.settings?.sectionKey);
    return def ? metaForCustomDef(def) : undefined;
  }
  return (SECTION_META_BY_TYPE as Record<string, SectionMeta | undefined>)[section.type];
}

/** The form fields of a saved `theme_block`. */
export function customBlockSchema(blockKey: unknown): FieldSchema[] | undefined {
  return findCustomBlockDef(blockKey)?.fields;
}

/** A brand-new section of a theme-declared type, ready for the page: the section's defaults, then the preset's, with blocks from the preset or `initialBlocks` empty ones. */
export function newCustomSection(def: ThemeCustomSectionDef, preset?: ThemeCustomSectionPreset): Pick<Section, 'type' | 'settings' | 'blocks'> {
  const meta = metaForCustomDef(def);
  const block = (extra: Record<string, unknown> = {}) => ({ type: 'theme_block', settings: { ...meta.defaultBlockSettings, ...extra } });
  let blocks: ReturnType<typeof block>[] = [];
  if (def.block) blocks = preset?.blocks ? preset.blocks.map(b => block(b)) : Array.from({ length: Math.max(0, def.initialBlocks ?? 0) }, () => block());
  return { type: 'theme_section', settings: { ...meta.defaultSettings, ...(preset?.settings ?? {}) }, blocks };
}
