import type { SectionType } from '@/api/services/storefrontTypes';
import { SchemaForm } from './SchemaForm';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import type { PageOption } from './BlockFields';

/** A section's own settings form (separate from its blocks) — thin wrapper
 *  around `SchemaForm`, driven entirely by `SECTION_META_BY_TYPE[type].settingsSchema`.
 *  This file used to be a hand-written `{type === '…' && …}` branch per
 *  section type; adding a field (or a whole new section type) now means
 *  editing `sectionRegistry.ts`'s schema, never this component. */
export function SectionFields({ type, settings, onChange, storeId, pageOptions }: {
  type: SectionType;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
}) {
  const schema = SECTION_META_BY_TYPE[type]?.settingsSchema ?? [];
  return <SchemaForm schema={schema} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} />;
}
