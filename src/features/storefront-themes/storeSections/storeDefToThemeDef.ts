import type { FieldSchema } from '@/features/seller/store/Dashboard/OnlineStore/builder/SchemaForm';
import type { StoreFieldDef, StoreSectionDef } from '@/api/services/storeSectionDefs';
import type { ThemeCustomSectionDef } from '../themeManifest';

/** A derived field -> the form control the editor already knows. */
export function toFieldSchema(f: StoreFieldDef): FieldSchema {
  const base = { key: f.key, label: f.label } as const;
  switch (f.kind) {
    case 'textarea': return { ...base, kind: 'textarea', rows: f.rows ?? 3, maxLength: f.maxLength ?? 1000 };
    case 'richtext': return { ...base, kind: 'richtext' };
    case 'image': return { ...base, kind: 'image' };
    case 'video': return { ...base, kind: 'video' };
    case 'link': return { ...base, kind: 'link' };
    default: return { ...base, kind: 'text', maxLength: f.maxLength ?? 160 };
  }
}

/** A seller-built section as a theme-declared one: the whole editor (Add section, section form, blocks, defaults) then works unchanged. */
export function storeDefToThemeDef(def: StoreSectionDef): ThemeCustomSectionDef {
  return {
    key: def.key,
    label: def.name,
    description: def.description || 'Your own section',
    color: def.color ?? '#0D9488',
    fields: def.fields.map(toFieldSchema),
    defaults: def.defaults,
    block: def.block ? { key: def.block.key, label: def.block.label, fields: def.block.fields.map(toFieldSchema), defaults: def.block.defaults } : undefined,
    initialBlocks: def.initialBlocks,
  };
}
