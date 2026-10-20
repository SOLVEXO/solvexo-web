import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SectionType } from '@/api/services/storefrontTypes';
import type { MetafieldOwnerResource } from '@/api/services/metafields';
import { SchemaForm, type FieldSchema } from './SchemaForm';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import type { PageOption } from './BlockFields';

/** Settings every (non-core) section has, Shopify-style — rendered by each
 *  theme's section wrapper (`storefront-themes/sectionSpacing.ts`). */
const COMMON_SECTION_SCHEMA: FieldSchema[] = [
  { key: 'spacingTop', kind: 'number', label: 'Space above (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'spacingBottom', kind: 'number', label: 'Space below (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'paddingTop', kind: 'number', label: 'Inner space top (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'paddingBottom', kind: 'number', label: 'Inner space bottom (px)', min: 0, max: 160, step: 4, half: true },
  {
    key: 'visibility', kind: 'select', label: 'Show on',
    options: [
      { value: 'all', label: 'All devices' },
      { value: 'desktop', label: 'Desktop and tablet only' },
      { value: 'mobile', label: 'Mobile only' },
    ],
  },
  { key: 'fullWidth', kind: 'checkbox', label: 'Full width', hint: 'Content spans the whole screen instead of the centred page width.', defaultOff: true },
  { key: 'backgroundImageUrl', kind: 'image', label: 'Background image', hint: 'Shown behind this section. Wide images (1920px+) work best.' },
  { key: 'backgroundOverlay', kind: 'number', label: 'Image overlay darkness (%)', min: 0, max: 80, step: 5, showIf: s => !!s.backgroundImageUrl, hint: 'Darkens the image so text stays readable.' },
  { key: 'anchorId', kind: 'text', label: 'Section ID', maxLength: 40, placeholder: 'e.g. our-story', hint: 'Link straight to this section with #our-story. Letters, numbers, - and _ only.' },
  { key: 'customCss', kind: 'textarea', label: 'Custom CSS', rows: 4, maxLength: 5000, placeholder: 'h2 { letter-spacing: 0.02em; }', hint: 'Applies to this section only. Plain properties style the section itself. Theme colours are set on each element, so add !important to override them (e.g. h2 { color: red !important; }).' },
];

/** A section's own settings form (separate from its blocks) — thin wrapper
 *  around `SchemaForm`, driven by `SECTION_META_BY_TYPE[type].settingsSchema`,
 *  plus the shared "Design & visibility" group every section gets. */
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
  const hasDesign = ['visibility', 'fullWidth', 'backgroundImageUrl', 'anchorId', 'customCss'].some(k => settings?.[k]);
  const [designOpen, setDesignOpen] = useState(hasDesign);
  return (
    <div className="flex flex-col gap-3">
      <SchemaForm schema={schema} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />
      {!isLocked && (
        <div className="border-t border-bone/70 pt-2">
          <button type="button" onClick={() => setDesignOpen(o => !o)} aria-expanded={designOpen}
            className="w-full flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 py-1 text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate">
            {designOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Design &amp; visibility
          </button>
          {designOpen && (
            <div className="pt-2">
              <SchemaForm schema={COMMON_SECTION_SCHEMA} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
