import { describe, it, expect } from 'vitest';
import { sectionSpacing, sectionAnchorId, sectionScopedCss } from './sectionSpacing';
import { copyText, showEyebrow } from './sectionCopy';

describe('sectionSpacing', () => {
  it('adds nothing when no design setting is set', () => {
    expect(sectionSpacing({})).toEqual({ className: '', style: { marginTop: undefined, marginBottom: undefined } });
  });

  it('maps spacing, full width and show-on to classes', () => {
    const r = sectionSpacing({ spacingTop: 0, spacingBottom: 24, fullWidth: true, visibility: 'desktop' });
    expect(r.className.split(' ').sort()).toEqual(['sx-full', 'sx-hide-m']);
    // outside space is a margin; the section's own padding is left alone
    expect(r.style).toMatchObject({ marginTop: 0, marginBottom: 24 });
    expect(r.style).not.toHaveProperty('paddingTop');
  });

  it('inner padding replaces the own padding of the section through CSS variables', () => {
    const r = sectionSpacing({ paddingTop: 12, paddingBottom: 0 });
    expect(r.className.split(' ').sort()).toEqual(['sx-pad-b', 'sx-pad-t']);
    expect(r.style).toMatchObject({ '--sx-pt': '12px', '--sx-pb': '0px' });
    expect(sectionSpacing({ visibility: 'mobile' }).className).toBe('sx-hide-d');
  });

  it('only uses https background images, with a capped overlay', () => {
    expect(sectionSpacing({ backgroundImageUrl: 'javascript:alert(1)' }).style.backgroundImage).toBeUndefined();
    const r = sectionSpacing({ backgroundImageUrl: 'https://cdn.x/a.jpg', backgroundOverlay: 200 });
    expect(r.style.backgroundImage).toBe('linear-gradient(rgba(0,0,0,0.8),rgba(0,0,0,0.8)),url("https://cdn.x/a.jpg")');
  });

  it('cleans the anchor id', () => {
    expect(sectionAnchorId({ anchorId: ' our story!' })).toBe('ourstory');
    expect(sectionAnchorId({ anchorId: '' })).toBeUndefined();
  });

  it('scopes custom CSS to the section and strips "<"', () => {
    expect(sectionScopedCss({ customCss: 'h2{color:red}' }, 'abc')).toBe('[data-sx="abc"]{h2{color:red}}');
    expect(sectionScopedCss({ customCss: '</style><script>' }, 'abc')).not.toContain('<');
    expect(sectionScopedCss({}, 'abc')).toBeNull();
  });
});

describe('sectionCopy', () => {
  it('falls back to the theme text when blank', () => {
    expect(copyText({}, 'eyebrow', 'Good to know')).toBe('Good to know');
    expect(copyText({ eyebrow: '  ' }, 'eyebrow', 'Good to know')).toBe('Good to know');
    expect(copyText({ eyebrow: 'Need help?' }, 'eyebrow', 'Good to know')).toBe('Need help?');
  });

  it('hides the eyebrow only when switched off', () => {
    expect(showEyebrow({})).toBe(true);
    expect(showEyebrow({ showEyebrow: false })).toBe(false);
  });
});

describe('sectionSpacing show-on', () => {
  it.each([
    ['all', ''], ['desktop', 'sx-hide-m'], ['mobile', 'sx-hide-d'],
    ['tablet', 'sx-hide-m sx-hide-w'], ['large', 'sx-hide-m sx-hide-t'], ['mobile-tablet', 'sx-hide-w'],
  ])('%s -> %s', (visibility, classes) => {
    expect(sectionSpacing({ visibility }).className).toBe(classes);
  });
});
