import type { ThemeSettingsFieldDef } from './themeManifest';
import { TEXT_CASE_KEYS, TEXT_CASE_OPTIONS, type TextCaseArea } from './textCase';

/** The "Text case" group of Theme settings: one dropdown per place the storefront writes its own words.
 *  Shared by every theme's manifest, so the sellers see the same list whichever theme they use. */
const FIELDS: { area: TextCaseArea; label: string; help: string; simple?: boolean }[] = [
  { area: 'menu', label: 'Top menu', help: 'The main menu in the header.' },
  { area: 'megaHeading', label: 'Mega menu column headings', help: 'The heading of each column in a mega menu.' },
  { area: 'megaLink', label: 'Mega menu & dropdown links', help: 'The links under each heading, and the links of ordinary dropdowns.' },
  { area: 'mobile', label: 'Mobile menu', help: 'The menu that opens on phones.' },
  { area: 'footerHeading', label: 'Footer headings', help: 'The heading of each footer column.' },
  { area: 'footerLink', label: 'Footer links', help: 'The links inside the footer columns.' },
  { area: 'announcement', label: 'Announcement bar', help: 'The announcement bar text.' },
  { area: 'heading', label: 'Page headings', help: 'Headlines on every page. "Title Case" shows as Capitalize Each Word here.' },
  { area: 'button', label: 'Buttons', help: 'Button labels. Title Case and Sentence case are not offered for buttons.', simple: true },
  { area: 'badge', label: 'Product badges', help: 'The badge on a product card (Best seller, New...).' },
  { area: 'product', label: 'Product names', help: 'Product names on cards and on the product page.' },
];

const SIMPLE = new Set(['', 'none', 'uppercase', 'lowercase', 'capitalize']);

export const TEXT_CASE_FIELDS: ThemeSettingsFieldDef[] = FIELDS.map(f => ({
  key: `custom.${TEXT_CASE_KEYS[f.area]}` as const,
  label: f.label,
  group: 'Text case' as const,
  control: { kind: 'select' as const, options: TEXT_CASE_OPTIONS.filter(o => !f.simple || SIMPLE.has(o.value)) },
  helpText: `${f.help} "Theme default" keeps how this theme showed it before.`,
}));
