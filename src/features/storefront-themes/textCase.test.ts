import { describe, expect, it, beforeEach } from 'vitest';
import { applyTextCase, asTextCase, buttonCaseCss, cased, caseCss, setTextCases, textCaseOf, TEXT_CASE_KEYS } from './textCase';
import { TEXT_CASE_FIELDS } from './textCaseFields';
import { fashionThemeManifest } from './theme-03-fashion/theme.manifest';
import { techThemeManifest } from './theme-04-tech/theme.manifest';
import { ledupThemeManifest } from './theme-05-ledup/theme.manifest';

describe('applyTextCase', () => {
  it('As typed changes nothing', () => {
    expect(applyTextCase('Chairs aNd TABLES', 'none')).toBe('Chairs aNd TABLES');
    expect(applyTextCase('Chairs aNd TABLES', '')).toBe('Chairs aNd TABLES');
    expect(applyTextCase('Chairs', undefined)).toBe('Chairs');
  });
  it('UPPERCASE and lowercase', () => {
    expect(applyTextCase('Chairs and Tables', 'uppercase')).toBe('CHAIRS AND TABLES');
    expect(applyTextCase('Chairs AND Tables', 'lowercase')).toBe('chairs and tables');
  });
  it('Capitalize Each Word raises the first letter of every word and leaves the rest alone', () => {
    expect(applyTextCase('chairs and tables', 'capitalize')).toBe('Chairs And Tables');
    expect(applyTextCase('iPhone cases', 'capitalize')).toBe('IPhone Cases');
    expect(applyTextCase("women's wear", 'capitalize')).toBe("Women's Wear");
    expect(applyTextCase('new-in / sale', 'capitalize')).toBe('New-In / Sale');
    expect(applyTextCase('(new) "best" seller', 'capitalize')).toBe('(New) "Best" Seller');
  });
  it('Title Case keeps small words small, but never as the first or last word', () => {
    expect(applyTextCase('chairs and tables', 'title')).toBe('Chairs and Tables');
    expect(applyTextCase('THE LORD OF THE RINGS', 'title')).toBe('The Lord of the Rings');
    expect(applyTextCase('what to look for in', 'title')).toBe('What to Look for In');
    expect(applyTextCase('a gift for the home', 'title')).toBe('A Gift for the Home');
    expect(applyTextCase("women's wear", 'title')).toBe("Women's Wear");
  });
  it('Sentence case: only the first letter of each sentence is a capital', () => {
    expect(applyTextCase('NEW ARRIVALS', 'sentence')).toBe('New arrivals');
    expect(applyTextCase('big SALE today. SHOP now! really? YES', 'sentence')).toBe('Big sale today. Shop now! Really? Yes');
    expect(applyTextCase('"quoted" start', 'sentence')).toBe('"Quoted" start');
  });
  it('scripts without capitals pass through untouched, and mixed text only changes its Latin letters', () => {
    for (const m of ['uppercase', 'lowercase', 'capitalize', 'title', 'sentence'] as const) expect(applyTextCase('نیا مجموعہ', m)).toBe('نیا مجموعہ');
    expect(applyTextCase('نیا sale', 'uppercase')).toBe('نیا SALE');
    expect(applyTextCase('', 'title')).toBe('');
    expect(applyTextCase('   ', 'title')).toBe('   ');
  });
  it('non-English letters with accents are handled', () => {
    expect(applyTextCase('école de mode', 'capitalize')).toBe('École De Mode');
    expect(applyTextCase('ÉCOLE', 'sentence')).toBe('École');
  });
});

describe('asTextCase', () => {
  it('accepts the six cases and reads anything else as "not chosen"', () => {
    for (const m of ['none', 'uppercase', 'lowercase', 'capitalize', 'title', 'sentence']) expect(asTextCase(m)).toBe(m);
    for (const bad of ['', 'upper', 'camelCase', 'snake_case', 5, null, undefined]) expect(asTextCase(bad)).toBe('');
  });
});

describe('the active choices', () => {
  beforeEach(() => setTextCases({}));

  it('with nothing chosen, each place keeps the theme\'s own behaviour (the fallback)', () => {
    expect(textCaseOf('menu')).toBe('');
    expect(cased('menu', 'Chairs')).toBe('Chairs');
    expect(cased('megaHeading', 'Chairs', 'uppercase')).toBe('CHAIRS');
  });
  it('a choice beats the fallback — including "As typed" over a capitals default', () => {
    setTextCases({ caseMegaHeading: 'none', caseFooterLink: 'title' });
    expect(cased('megaHeading', 'Chairs and Tables', 'uppercase')).toBe('Chairs and Tables');
    expect(cased('footerLink', 'track my order', 'none')).toBe('Track My Order');
    expect(cased('menu', 'Chairs', 'uppercase')).toBe('CHAIRS'); // untouched place
  });
  it('every place reads its own setting', () => {
    const all = Object.fromEntries(Object.values(TEXT_CASE_KEYS).map(k => [k, 'uppercase']));
    setTextCases(all);
    for (const area of Object.keys(TEXT_CASE_KEYS) as (keyof typeof TEXT_CASE_KEYS)[]) expect(textCaseOf(area)).toBe('uppercase');
    setTextCases({ caseBadge: 'lowercase' });
    expect(textCaseOf('badge')).toBe('lowercase');
    expect(textCaseOf('product')).toBe('');
  });
  it('junk values are ignored', () => {
    setTextCases({ caseMenu: 'camelCase' });
    expect(textCaseOf('menu')).toBe('');
  });
});

describe('CSS for headings and buttons', () => {
  it('maps each case to text-transform', () => {
    expect(caseCss('h', 'uppercase')).toBe('h{text-transform:uppercase}');
    expect(caseCss('h', 'lowercase')).toBe('h{text-transform:lowercase}');
    expect(caseCss('h', 'capitalize')).toBe('h{text-transform:capitalize}');
    expect(caseCss('h', 'title')).toBe('h{text-transform:capitalize}');
    expect(caseCss('h', 'sentence')).toContain('h::first-letter{text-transform:uppercase}');
    expect(caseCss('h', 'none')).toBe('');
    expect(caseCss('h', '')).toBe('');
  });
  it('buttons never get the ::first-letter trick (it does nothing on a flex button)', () => {
    expect(buttonCaseCss('b', 'sentence')).not.toContain('first-letter');
    expect(buttonCaseCss('b', 'uppercase')).toContain('letter-spacing');
    expect(buttonCaseCss('b', 'none')).toBe('');
  });
});

describe('Theme settings: every theme offers the Text case dropdowns', () => {
  const keys = TEXT_CASE_FIELDS.map(f => f.key);
  it('eleven places, each its own setting, "Theme default" first', () => {
    expect(keys.length).toBe(11);
    expect(new Set(keys).size).toBe(11);
    for (const f of TEXT_CASE_FIELDS) {
      expect(f.group).toBe('Text case');
      expect(f.control.kind).toBe('select');
      if (f.control.kind === 'select') expect(f.control.options[0].value).toBe('');
    }
  });
  it('buttons only offer the cases CSS can do well; the rest offer all six', () => {
    const opts = (k: string) => { const f = TEXT_CASE_FIELDS.find(x => x.key === `custom.${k}`)!; return f.control.kind === 'select' ? f.control.options.map(o => o.value) : []; };
    expect(opts('caseButton')).toEqual(['', 'none', 'uppercase', 'lowercase', 'capitalize']);
    expect(opts('caseMenu')).toEqual(['', 'none', 'uppercase', 'lowercase', 'capitalize', 'title', 'sentence']);
  });
  for (const [name, m] of [['Fashion', fashionThemeManifest], ['Tech', techThemeManifest], ['LedUp', ledupThemeManifest]] as const) {
    it(`${name} lists all of them, and no longer lists the old separate capital-letters switches`, () => {
      const have = m.themeSettingsFields.map(f => f.key as string);
      for (const k of keys) expect(have).toContain(k);
      for (const old of ['headingCase', 'buttonCase', 'custom.megaHeading']) expect(have).not.toContain(old);
    });
  }
});
