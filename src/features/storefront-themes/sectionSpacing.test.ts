import { describe, it, expect } from 'vitest';
import { sectionSpacing, sectionAnchorId, sectionScopedCss } from './sectionSpacing';
import { copyText, showEyebrow } from './sectionCopy';

describe('sectionSpacing', () => {
  it('adds nothing when no design setting is set', () => {
    expect(sectionSpacing({})).toEqual({ className: '', style: { paddingTop: undefined, paddingBottom: undefined } });
  });

  it('maps spacing, full width and show-on to classes', () => {
    const r = sectionSpacing({ spacingTop: 0, spacingBottom: 24, fullWidth: true, visibility: 'desktop' });
    expect(r.className.split(' ').sort()).toEqual(['sx-full', 'sx-hide-m', 'sx-sp-b', 'sx-sp-t']);
    expect(r.style).toMatchObject({ paddingTop: 0, paddingBottom: 24 });
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
