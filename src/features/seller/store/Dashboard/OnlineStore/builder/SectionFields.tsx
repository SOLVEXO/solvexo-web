import type { SectionType } from '@/api/services/storefrontTypes';
import type { MetafieldOwnerResource } from '@/api/services/metafields';
import { SchemaForm, type FieldSchema } from './SchemaForm';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import type { PageOption } from './BlockFields';

/** A section's own settings form (separate from its blocks) — thin wrapper
 *  around `SchemaForm`, driven entirely by `SECTION_META_BY_TYPE[type].settingsSchema`.
 *  This file used to be a hand-written `{type === '…' && …}` branch per
 *  section type; adding a field (or a whole new section type) now means
 *  editing `sectionRegistry.ts`'s schema, never this component. */
export function SectionFields({ type, settings, onChange, storeId, pageOptions, ownerResource }: {
  type: SectionType;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
  /** Phase 9 — Dynamic Sources; see `SchemaForm`'s own doc comment. */
  ownerResource?: MetafieldOwnerResource | null;
}) {
  const schema = SECTION_META_BY_TYPE[type]?.settingsSchema ?? [];
  const isLocked = SECTION_META_BY_TYPE[type]?.locked;
  const spacingSchema: FieldSchema[] = isLocked ? [] : [
    { key: 'spacingTop', kind: 'number', label: 'Space above (px)', min: 0, max: 160, step: 4, half: true },
    { key: 'spacingBottom', kind: 'number', label: 'Space below (px)', min: 0, max: 160, step: 4, half: true },
  ];
  return <SchemaForm schema={[...schema, ...spacingSchema]} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />;
}
