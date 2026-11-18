/** Text case for the storefront's own words (menus, footer, headings, buttons, badges, product names).
 *  The seller types a menu item once ("chairs and tables"); the theme shows it in the case chosen under Theme settings → Text case.
 *  '' (unset) = "Theme default (as before)": the behaviour the theme had before these settings existed, so no store changes by itself. */

export type TextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'title' | 'sentence';
export type TextCaseSetting = TextCase | '';

/** Every place a seller can choose a case for. */
export type TextCaseArea = 'menu' | 'megaHeading' | 'megaLink' | 'mobile' | 'footerHeading' | 'footerLink' | 'announcement' | 'heading' | 'button' | 'badge' | 'product';

export const TEXT_CASES: readonly TextCase[] = ['none', 'uppercase', 'lowercase', 'capitalize', 'title', 'sentence'];

/** Options of the dropdown. The first one keeps whatever the theme did before. */
export const TEXT_CASE_OPTIONS: { value: TextCaseSetting; label: string }[] = [
  { value: '', label: 'Theme default (as before)' },
  { value: 'none', label: 'As typed' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize Each Word' },
  { value: 'title', label: 'Title Case (small words stay small)' },
  { value: 'sentence', label: 'Sentence case' },
];

/** The settings key of each area (all live in the theme's custom settings, so no server change is needed). */
export const TEXT_CASE_KEYS: Record<TextCaseArea, string> = {
  menu: 'caseMenu', megaHeading: 'caseMegaHeading', megaLink: 'caseMegaLink', mobile: 'caseMobileMenu', footerHeading: 'caseFooterHeading',
  footerLink: 'caseFooterLink', announcement: 'caseAnnouncement', heading: 'caseHeading', button: 'caseButton', badge: 'caseBadge', product: 'caseProduct',
};

export const asTextCase = (v: unknown): TextCaseSetting => (typeof v === 'string' && (TEXT_CASES as readonly string[]).includes(v) ? (v as TextCase) : '');

// Words that stay small in Title Case (English), except as the first or last word.
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'off', 'on', 'onto', 'or', 'per', 'the', 'to', 'vs', 'via', 'with']);
// A word starts at the beginning, after a space / hyphen / slash, or after an opening bracket or quote (not after an apostrophe inside a word).
const WORD = /(^|[\s\-/([{])(["'“‘]*)(\p{L})/gu;
const up = (_m: string, pre: string, quote: string, c: string) => pre + quote + c.toUpperCase();
const upperFirst = (word: string) => word.replace(/^(\P{L}*)(\p{L})/u, (_m, pre: string, c: string) => pre + c.toUpperCase());

/** Applies the case to a piece of text. Scripts without upper/lower case (Urdu, Arabic, Hindi, Chinese...) pass through unchanged. */
export function applyTextCase(text: string, mode: TextCaseSetting | undefined): string {
  const s = String(text ?? '');
  switch (mode) {
    case 'uppercase': return s.toUpperCase();
    case 'lowercase': return s.toLowerCase();
    // like the browser's "capitalize": the first letter of each word goes up, nothing else is touched
    case 'capitalize': return s.replace(WORD, up);
    case 'title': {
      const parts = s.toLowerCase().split(/(\s+)/);
      const words = parts.map((p, i) => ({ p, i })).filter(x => x.p.trim() !== '');
      const first = words[0]?.i; const last = words[words.length - 1]?.i;
      return parts.map((p, i) => {
        if (p.trim() === '') return p;
        const bare = p.replace(/^\P{L}+|\P{L}+$/gu, '');
        if (i !== first && i !== last && SMALL.has(bare)) return p;
        return p.replace(WORD, up);
      }).join('');
    }
    case 'sentence': {
      const lower = s.toLowerCase();
      // the first letter of the text, and the first letter after a full stop / ! / ?
      return upperFirst(lower).replace(/([.!?]\s+)(\p{L})/gu, (_m, pre: string, c: string) => pre + c.toUpperCase());
    }
    default: return s;
  }
}

// ── the active theme's choices (one theme draws at a time, like the theme's other tokens) ──
const current: Record<TextCaseArea, TextCaseSetting> = {
  menu: '', megaHeading: '', megaLink: '', mobile: '', footerHeading: '', footerLink: '', announcement: '', heading: '', button: '', badge: '', product: '',
};

/** Called by each theme when its settings are applied. `ts` = the theme's custom settings. */
export function setTextCases(ts: Record<string, unknown> | null | undefined): void {
  (Object.keys(TEXT_CASE_KEYS) as TextCaseArea[]).forEach(a => { current[a] = asTextCase(ts?.[TEXT_CASE_KEYS[a]]); });
}

/** The seller's choice for an area ('' = keep the theme's own default). */
export const textCaseOf = (area: TextCaseArea): TextCaseSetting => current[area];

/** Text for an area with the seller's case applied. With no choice made, `fallback` (the theme's old behaviour) decides. */
export function cased(area: TextCaseArea, text: string, fallback: TextCase = 'none'): string {
  return applyTextCase(text, current[area] || fallback);
}

/** CSS for an area drawn with plain CSS (headings, buttons): the same cases, as far as CSS can do them.
 *  Title Case needs word lists, so in CSS it falls back to "Capitalize Each Word". Sentence case = lowercase + a capital first letter (block elements only). */
export function caseCss(selector: string, mode: TextCaseSetting | undefined): string {
  switch (mode) {
    case 'uppercase': return `${selector}{text-transform:uppercase}`;
    case 'lowercase': return `${selector}{text-transform:lowercase}`;
    case 'capitalize': case 'title': return `${selector}{text-transform:capitalize}`;
    case 'sentence': return `${selector}{text-transform:lowercase}${selector}::first-letter{text-transform:uppercase}`;
    default: return '';
  }
}

/** Button labels: the CSS cases that read well on a button. Capitals keep the theme's small letter-spaced look. */
export function buttonCaseCss(selector: string, mode: TextCaseSetting | undefined): string {
  if (mode === 'uppercase') return `${selector}{text-transform:uppercase;letter-spacing:.06em;font-size:13px}`;
  if (mode === 'lowercase') return `${selector}{text-transform:lowercase}`;
  if (mode === 'capitalize' || mode === 'title' || mode === 'sentence') return `${selector}{text-transform:capitalize}`;
  return '';
}
