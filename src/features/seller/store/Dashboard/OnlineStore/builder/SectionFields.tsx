import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SectionType } from '@/api/services/storefrontTypes';
import type { MetafieldOwnerResource } from '@/api/services/metafields';
import { SchemaForm, type FieldSchema } from './SchemaForm';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import { resolveSectionMeta } from './themeSectionMeta';
import type { PageOption } from './BlockFields';
import { ContentItemsEditor } from './ContentItemsEditor';

/** Settings every (non-core) section has, Shopify-style — rendered by each
 *  theme's section wrapper (`storefront-themes/sectionSpacing.ts`). */
const COMMON_SECTION_SCHEMA: FieldSchema[] = [
  { key: 'spacingTop', kind: 'number', label: 'Space above (px)', min: -160, max: 160, step: 4, half: true, hint: 'A minus number pulls the section closer to (or over) the one above.' },
  { key: 'spacingBottom', kind: 'number', label: 'Space below (px)', min: -160, max: 160, step: 4, half: true },
  { key: 'paddingTop', kind: 'number', label: 'Inner space top (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'paddingBottom', kind: 'number', label: 'Inner space bottom (px)', min: 0, max: 160, step: 4, half: true },
  {
    key: 'visibility', kind: 'select', label: 'Show on',
    options: [
      { value: 'all', label: 'All devices' },
      { value: 'desktop', label: 'Desktop and tablet only' },
      { value: 'mobile', label: 'Mobile only' },
      { value: 'tablet', label: 'Tablet only' },
      { value: 'large', label: 'Large screens only (1024px and up)' },
      { value: 'mobile-tablet', label: 'Mobile and tablet only' },
    ],
  },
  { key: 'fullWidth', kind: 'checkbox', label: 'Full width', hint: 'Content spans the whole screen instead of the centred page width.', defaultOff: true },
  { key: 'backgroundImageUrl', kind: 'image', label: 'Background image', hint: 'Shown behind this section. Wide images (1920px+) work best.' },
  { key: 'backgroundOverlay', kind: 'number', label: 'Image overlay darkness (%)', min: 0, max: 80, step: 5, showIf: s => !!s.backgroundImageUrl, hint: 'Darkens the image so text stays readable.' },
  { key: 'sectionBgColor', kind: 'color', label: 'Background colour', hint: 'Gives this section its own colour. Empty keeps the theme colour.' },
  { key: 'borderWidth', kind: 'number', label: 'Border thickness (px)', min: 0, max: 8, step: 1, half: true },
  { key: 'borderColor', kind: 'color', label: 'Border colour', showIf: s => Number(s.borderWidth) > 0, hint: 'Empty uses the text colour.' },
  { key: 'borderRadius', kind: 'number', label: 'Rounded corners (px)', min: 0, max: 80, step: 4, half: true },
  {
    key: 'shadow', kind: 'select', label: 'Shadow', half: true,
    options: [
      { value: 'none', label: 'None' },
      { value: 'soft', label: 'Soft' },
      { value: 'medium', label: 'Medium' },
      { value: 'strong', label: 'Strong' },
    ],
  },
  { key: 'anchorId', kind: 'text', label: 'Section ID', maxLength: 40, placeholder: 'e.g. our-story', hint: 'Link straight to this section with #our-story. Letters, numbers, - and _ only.' },
  { key: 'customCss', kind: 'textarea', label: 'Custom CSS', rows: 4, maxLength: 5000, placeholder: 'h2 { letter-spacing: 0.02em; }', hint: 'Applies to this section only. Plain properties style the section itself. Theme colours are set on each element, so add !important to override them (e.g. h2 { color: red !important; }).' },
];

/** Design v2: phone values, gradient/video background, text style, motion and "show when" rules. All optional, unset = the theme's look. */
const ALIGN_OPTIONS = [
  { value: 'default', label: 'Theme default' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const V2_FIELDS: FieldSchema[] = [
  { key: 'spacingTopMobile', kind: 'number', label: 'Space above on phone (px)', min: -160, max: 160, step: 4, half: true, hint: 'Empty = same as the value above.' },
  { key: 'spacingBottomMobile', kind: 'number', label: 'Space below on phone (px)', min: -160, max: 160, step: 4, half: true },
  { key: 'paddingTopMobile', kind: 'number', label: 'Inner space top on phone (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'paddingBottomMobile', kind: 'number', label: 'Inner space bottom on phone (px)', min: 0, max: 160, step: 4, half: true },
  { key: 'gradientFrom', kind: 'color', label: 'Gradient: from colour', half: true, hint: 'Pick both colours to turn the gradient on.' },
  { key: 'gradientTo', kind: 'color', label: 'Gradient: to colour', half: true },
  { key: 'gradientAngle', kind: 'number', label: 'Gradient direction (degrees)', min: 0, max: 360, step: 15, showIf: s => !!s.gradientFrom && !!s.gradientTo, hint: '180 = top to bottom, 90 = left to right.' },
  { key: 'backgroundVideoUrl', kind: 'text', label: 'Background video (link)', maxLength: 2000, placeholder: 'https://… .mp4 or .webm', hint: 'Plays muted on a loop behind the section. Keep it short and small (under 5 MB). Hidden for visitors who asked their device for less motion; the background image is shown instead.' },
  { key: 'textAlign', kind: 'select', label: 'Text alignment', options: ALIGN_OPTIONS, half: true },
  { key: 'textAlignMobile', kind: 'select', label: 'Text alignment on phone', options: ALIGN_OPTIONS, half: true },
  { key: 'textColor', kind: 'color', label: 'Text colour', half: true, hint: 'Paragraph and list text. Buttons keep their own colours.' },
  { key: 'headingColor', kind: 'color', label: 'Heading colour', half: true },
  {
    key: 'headingWeight', kind: 'select', label: 'Heading weight', half: true,
    options: [{ value: 'default', label: 'Theme default' }, { value: 'normal', label: 'Regular' }, { value: 'medium', label: 'Medium' }, { value: 'semibold', label: 'Semibold' }, { value: 'bold', label: 'Bold' }, { value: 'black', label: 'Black' }],
  },
  {
    key: 'headingCase', kind: 'select', label: 'Heading letters', half: true,
    options: [{ value: 'default', label: 'Theme default' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' }, { value: 'capitalize', label: 'Capitalize Each Word' }, { value: 'sentence', label: 'Sentence case' }, { value: 'none', label: 'As typed' }],
  },
  {
    key: 'animation', kind: 'select', label: 'Entrance animation',
    options: [
      { value: 'none', label: 'None' },
      { value: 'fade', label: 'Fade in' },
      { value: 'slide-up', label: 'Slide up' },
      { value: 'slide-left', label: 'Slide from left' },
      { value: 'slide-right', label: 'Slide from right' },
      { value: 'zoom', label: 'Zoom in' },
    ],
    hint: 'Plays once, when the visitor scrolls to this section. Not shown to visitors who asked their device for less motion.',
  },
  {
    key: 'animationSpeed', kind: 'select', label: 'Animation speed', half: true,
    options: [{ value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }, { value: 'slow', label: 'Slow' }],
    showIf: s => !!s.animation && s.animation !== 'none',
  },
  { key: 'animationDelay', kind: 'number', label: 'Delay (ms)', min: 0, max: 2000, step: 100, half: true, showIf: s => !!s.animation && s.animation !== 'none' },
  { key: 'sticky', kind: 'checkbox', label: 'Stick to the top while scrolling', defaultOff: true, hint: 'The section stays visible at the top of the screen while the page scrolls past it.' },
  { key: 'stickyOffset', kind: 'number', label: 'Distance from the top (px)', min: 0, max: 300, step: 4, showIf: s => s.sticky === true, hint: 'Use your header height if the section hides behind a sticky header.' },
  {
    key: 'showTo', kind: 'select', label: 'Show to',
    options: [{ value: 'all', label: 'Everyone' }, { value: 'guests', label: 'Visitors who are not signed in' }, { value: 'customers', label: 'Signed-in customers' }],
  },
  { key: 'showFrom', kind: 'datetime', label: 'Show from', half: true, hint: 'Empty = no start date.' },
  { key: 'showUntil', kind: 'datetime', label: 'Hide after', half: true, hint: 'Empty = never hide. Times are in your own time zone.' },
  { key: 'showCountries', kind: 'text', label: 'Show only in these countries', maxLength: 200, placeholder: 'PK, AE, GB', hint: 'Two-letter country codes, separated by commas. Empty = every country.' },
  { key: 'hideCountries', kind: 'text', label: 'Hide in these countries', maxLength: 200, placeholder: 'US, CA' },
  { key: 'showLanguages', kind: 'text', label: 'Show only in these languages', maxLength: 100, placeholder: 'en, ur', hint: 'Language codes, separated by commas. Empty = every language.' },
];
const ALL_DESIGN_FIELDS: FieldSchema[] = [...COMMON_SECTION_SCHEMA, ...V2_FIELDS];
const pick = (keys: string[]): FieldSchema[] => keys.map(k => {
  const f = ALL_DESIGN_FIELDS.find(x => x.key === k);
  if (!f) throw new Error('Unknown design field ' + k);
  return f;
});

/** The "Design & visibility" panel, split into small groups (each opens by itself when it already holds a value). */
const DESIGN_GROUPS: { id: string; title: string; fields: FieldSchema[] }[] = [
  { id: 'spacing', title: 'Spacing & width', fields: pick(['spacingTop', 'spacingBottom', 'paddingTop', 'paddingBottom', 'spacingTopMobile', 'spacingBottomMobile', 'paddingTopMobile', 'paddingBottomMobile', 'fullWidth']) },
  { id: 'background', title: 'Background', fields: pick(['sectionBgColor', 'gradientFrom', 'gradientTo', 'gradientAngle', 'backgroundImageUrl', 'backgroundVideoUrl', 'backgroundOverlay']) },
  { id: 'border', title: 'Border & shadow', fields: pick(['borderWidth', 'borderColor', 'borderRadius', 'shadow']) },
  { id: 'text', title: 'Text', fields: pick(['textAlign', 'textAlignMobile', 'textColor', 'headingColor', 'headingWeight', 'headingCase']) },
  { id: 'motion', title: 'Motion', fields: pick(['animation', 'animationSpeed', 'animationDelay', 'sticky', 'stickyOffset']) },
  { id: 'rules', title: 'Show when', fields: pick(['visibility', 'showTo', 'showFrom', 'showUntil', 'showCountries', 'hideCountries', 'showLanguages']) },
  { id: 'advanced', title: 'Advanced', fields: pick(['anchorId', 'customCss']) },
];

/** A group counts as "in use" when one of its fields holds a real (non-default) value, so it opens by itself. */
function groupInUse(fields: FieldSchema[], settings: Record<string, unknown> | undefined): boolean {
  return fields.some(f => {
    const v = settings?.[f.key];
    return v !== undefined && v !== null && v !== '' && v !== false && v !== 'default' && v !== 'none' && v !== 'all';
  });
}

function DesignGroup({ title, fields, settings, onChange, storeId, pageOptions, ownerResource }: {
  title: string;
  fields: FieldSchema[];
  settings: Record<string, unknown>;
  onChange: Parameters<typeof SchemaForm>[0]['onChange'];
  storeId: string;
  pageOptions?: PageOption[];
  ownerResource?: MetafieldOwnerResource | null;
}) {
  const [open, setOpen] = useState(() => groupInUse(fields, settings));
  return (
    <div className="border-t border-bone/50 first:border-t-0">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 py-1.5 text-left text-[12px] font-medium text-charcoal">
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {title}
        {!open && groupInUse(fields, settings) && <span className="ml-auto size-1.5 rounded-full bg-brand-orange" aria-label="In use" />}
      </button>
      {open && (
        <div className="pb-2 pt-1">
          <SchemaForm schema={fields} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />
        </div>
      )}
    </div>
  );
}

/** A section's own settings form (separate from its blocks) — thin wrapper
 *  around `SchemaForm`, driven by `SECTION_META_BY_TYPE[type].settingsSchema`,
 *  plus the shared "Design & visibility" groups every section gets. */
export function SectionFields({ type, settings, onChange, storeId, pageOptions, ownerResource }: {
  type: SectionType;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
  /** Phase 9 — Dynamic Sources; see `SchemaForm`'s own doc comment. */
  ownerResource?: MetafieldOwnerResource | null;
}) {
  const meta = type === 'theme_section' ? resolveSectionMeta({ type, settings }) : SECTION_META_BY_TYPE[type];
  const schema = meta?.settingsSchema ?? [];
  const isLocked = meta?.locked;
  const hasDesign = DESIGN_GROUPS.some(g => groupInUse(g.fields, settings));
  const [designOpen, setDesignOpen] = useState(hasDesign);
  return (
    <div className="flex flex-col gap-3">
      <SchemaForm schema={schema} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />
      {!isLocked && (
        <ContentItemsEditor value={settings.contentItems} onChange={contentItems => onChange({ ...settings, contentItems })} storeId={storeId} pageOptions={pageOptions} />
      )}
      {!isLocked && (
        <div className="border-t border-bone/70 pt-2">
          <button type="button" onClick={() => setDesignOpen(o => !o)} aria-expanded={designOpen}
            className="w-full flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 py-1 text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate">
            {designOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Design &amp; visibility
          </button>
          {designOpen && (
            <div className="pt-1">
              {DESIGN_GROUPS.map(g => (
                <DesignGroup key={g.id} title={g.title} fields={g.fields} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} ownerResource={ownerResource} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
