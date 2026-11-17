import type { MetafieldValueEntry } from '@/api/services/metafields';
import type { ThemeSettingsFieldDef } from './themeManifest';

export type SpecsTableStyle = 'lines' | 'striped' | 'boxed';

/** How the seller wants the specs table to look (Theme Settings -> Specifications table). Colours null = the theme's own. */
export interface SpecsLook {
  style: SpecsTableStyle;
  rowSpace: number;
  labelWidth: number;
  fontSize: number;
  labelBold: boolean;
  labelColor: string | null;
  valueColor: string | null;
  lineColor: string | null;
  stripeColor: string | null;
  hoverColor: string | null;
  radius: number;
  alignRight: boolean;
  stackOnMobile: boolean;
}

export const DEFAULT_SPECS_LOOK: SpecsLook = {
  style: 'lines', rowSpace: 12, labelWidth: 36, fontSize: 13.5, labelBold: true, labelColor: null, valueColor: null,
  lineColor: null, stripeColor: null, hoverColor: null, radius: 8, alignRight: false, stackOnMobile: false,
};

/** Read the `specs*` keys of `StorefrontColors.themeSettings` (bad values fall back to the defaults). */
export function readSpecsLook(ts: Record<string, unknown> | undefined | null): SpecsLook {
  const d = DEFAULT_SPECS_LOOK;
  const num = (v: unknown, min: number, max: number, fallback: number) => { const n = Number(v); return v !== undefined && v !== null && v !== '' && Number.isFinite(n) && n >= min && n <= max ? n : fallback; };
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
  return {
    style: (['lines', 'striped', 'boxed'] as const).find(x => x === ts?.specsStyle) ?? d.style,
    rowSpace: num(ts?.specsRowSpace, 2, 30, d.rowSpace),
    labelWidth: num(ts?.specsLabelWidth, 20, 60, d.labelWidth),
    fontSize: num(ts?.specsFontSize, 11, 20, d.fontSize),
    labelBold: ts?.specsLabelWeight !== 'normal',
    labelColor: hex(ts?.specsLabelColor),
    valueColor: hex(ts?.specsValueColor),
    lineColor: hex(ts?.specsLineColor),
    stripeColor: hex(ts?.specsStripeColor),
    hoverColor: hex(ts?.specsHoverColor),
    radius: num(ts?.specsRadius, 0, 24, d.radius),
    alignRight: ts?.specsAlign === 'right',
    stackOnMobile: ts?.specsMobile === 'stacked',
  };
}

/** The rows a specs table shows: filled values only, raw JSON skipped. */
export function specRows(entries: MetafieldValueEntry[]): MetafieldValueEntry[] {
  return entries.filter(e => e.value?.trim() && e.type !== 'json');
}

/** The "Specifications table" settings, for a theme manifest (`...SPECS_FIELDS`). */
export const SPECS_FIELDS: ThemeSettingsFieldDef[] = [
  { key: 'custom.specsStyle', label: 'Style', group: 'Specifications table', control: { kind: 'select', options: [{ value: 'lines', label: 'Lines' }, { value: 'striped', label: 'Striped rows' }, { value: 'boxed', label: 'Boxed' }] }, helpText: 'How the rows are drawn.' },
  { key: 'custom.specsRowSpace', label: 'Row height (px)', group: 'Specifications table', control: { kind: 'number', min: 2, max: 30, placeholder: '12' }, helpText: 'Space above and below each row.' },
  { key: 'custom.specsLabelWidth', label: 'Name column width (%)', group: 'Specifications table', control: { kind: 'number', min: 20, max: 60, placeholder: '36' }, helpText: 'Share of the row used by the name.' },
  { key: 'custom.specsFontSize', label: 'Text size (px)', group: 'Specifications table', control: { kind: 'number', min: 11, max: 20, placeholder: '13' }, helpText: 'Size of the name and value text.' },
  { key: 'custom.specsLabelWeight', label: 'Name weight', group: 'Specifications table', control: { kind: 'select', options: [{ value: 'bold', label: 'Bold' }, { value: 'normal', label: 'Normal' }] }, helpText: 'Thickness of the name text.' },
  { key: 'custom.specsAlign', label: 'Value alignment', group: 'Specifications table', control: { kind: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] }, helpText: 'Where the value text sits.' },
  { key: 'custom.specsMobile', label: 'On phones', group: 'Specifications table', control: { kind: 'select', options: [{ value: 'columns', label: 'Two columns' }, { value: 'stacked', label: 'Name above value' }] }, helpText: 'Layout on small screens.' },
  { key: 'custom.specsRadius', label: 'Corner radius (px)', group: 'Specifications table', control: { kind: 'number', min: 0, max: 24, placeholder: '8' }, helpText: 'For the Boxed style.' },
  { key: 'custom.specsLabelColor', label: 'Name colour', group: 'Specifications table', control: { kind: 'color', optional: { fallback: '#111111' } }, helpText: 'Empty uses the theme text colour.' },
  { key: 'custom.specsValueColor', label: 'Value colour', group: 'Specifications table', control: { kind: 'color', optional: { fallback: '#555555' } }, helpText: 'Empty uses the theme muted colour.' },
  { key: 'custom.specsLineColor', label: 'Line colour', group: 'Specifications table', control: { kind: 'color', optional: { fallback: '#E5E5E5' } }, helpText: 'Empty uses the theme border colour.' },
  { key: 'custom.specsStripeColor', label: 'Striped row colour', group: 'Specifications table', control: { kind: 'color', optional: { fallback: '#F5F5F5' } }, helpText: 'Used by the Striped style.' },
  { key: 'custom.specsHoverColor', label: 'Row colour on hover', group: 'Specifications table', control: { kind: 'color', optional: { fallback: '#F5F5F5' } }, helpText: 'Empty = no hover effect.' },
];
