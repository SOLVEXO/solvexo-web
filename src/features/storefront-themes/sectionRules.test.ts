import { describe, it, expect } from 'vitest';
import { hasSectionRules, localDateTimeToMs, sectionAllowed, type SectionRuleContext } from './sectionRules';
import { sectionSpacing, sectionVideoUrl } from './sectionSpacing';

const ctx = (over: Partial<SectionRuleContext> = {}): SectionRuleContext => ({
  loggedIn: false, country: 'PK', language: 'en', now: Date.parse('2026-06-15T12:00:00Z'), ...over,
});

describe('sectionAllowed (show-when rules)', () => {
  it('shows everything when no rule is set', () => {
    expect(hasSectionRules({})).toBe(false);
    expect(hasSectionRules({ showTo: 'all', showCountries: '' })).toBe(false);
    expect(sectionAllowed({}, ctx())).toBe(true);
    expect(sectionAllowed(undefined, ctx())).toBe(true);
  });

  it('signed-in rule: guests vs customers', () => {
    expect(sectionAllowed({ showTo: 'customers' }, ctx({ loggedIn: false }))).toBe(false);
    expect(sectionAllowed({ showTo: 'customers' }, ctx({ loggedIn: true }))).toBe(true);
    expect(sectionAllowed({ showTo: 'guests' }, ctx({ loggedIn: true }))).toBe(false);
    expect(sectionAllowed({ showTo: 'guests' }, ctx({ loggedIn: false }))).toBe(true);
  });

  it('schedule: from / until are exact moments', () => {
    const s = { showFrom: '2026-06-15T10:00:00.000Z', showUntil: '2026-06-15T14:00:00.000Z' };
    expect(sectionAllowed(s, ctx())).toBe(true);
    expect(sectionAllowed(s, ctx({ now: Date.parse('2026-06-15T09:59:59Z') }))).toBe(false);
    expect(sectionAllowed(s, ctx({ now: Date.parse('2026-06-15T14:00:00Z') }))).toBe(false);
    // a bad value never hides the section
    expect(sectionAllowed({ showFrom: 'not a date' }, ctx())).toBe(true);
    expect(localDateTimeToMs('2026-06-15T10:00:00.000Z')).toBe(Date.parse('2026-06-15T10:00:00Z'));
    expect(localDateTimeToMs('2026-06-15T10:00')).toBe(new Date(2026, 5, 15, 10, 0).getTime());
  });

  it('countries: show-only list needs a known matching country, hide list only hides a known match', () => {
    expect(sectionAllowed({ showCountries: 'pk, ae' }, ctx({ country: 'PK' }))).toBe(true);
    expect(sectionAllowed({ showCountries: 'pk, ae' }, ctx({ country: 'US' }))).toBe(false);
    expect(sectionAllowed({ showCountries: 'PK' }, ctx({ country: null }))).toBe(false);
    expect(sectionAllowed({ hideCountries: 'US CA' }, ctx({ country: 'US' }))).toBe(false);
    expect(sectionAllowed({ hideCountries: 'US CA' }, ctx({ country: 'PK' }))).toBe(true);
    expect(sectionAllowed({ hideCountries: 'US' }, ctx({ country: null }))).toBe(true);
  });

  it('languages: compares the base language', () => {
    expect(sectionAllowed({ showLanguages: 'en, ur' }, ctx({ language: 'ur' }))).toBe(true);
    expect(sectionAllowed({ showLanguages: 'pt' }, ctx({ language: 'pt-BR' }))).toBe(true);
    expect(sectionAllowed({ showLanguages: 'en' }, ctx({ language: 'ar' }))).toBe(false);
    expect(sectionAllowed({ showLanguages: 'en' }, ctx({ language: null }))).toBe(false);
  });

  it('every rule must pass together', () => {
    const s = { showTo: 'customers', showCountries: 'PK' };
    expect(sectionAllowed(s, ctx({ loggedIn: true, country: 'PK' }))).toBe(true);
    expect(sectionAllowed(s, ctx({ loggedIn: true, country: 'US' }))).toBe(false);
    expect(sectionAllowed(s, ctx({ loggedIn: false, country: 'PK' }))).toBe(false);
  });
});

describe('sectionSpacing design v2', () => {
  it('phone-only spacing uses its own classes and variables', () => {
    const r = sectionSpacing({ paddingTopMobile: 8, paddingBottomMobile: 0, spacingTopMobile: 12, spacingBottomMobile: 16 });
    expect(r.className.split(' ').sort()).toEqual(['sx-mb-m', 'sx-mt-m', 'sx-pad-bm', 'sx-pad-tm']);
    expect(r.style).toMatchObject({ '--sx-ptm': '8px', '--sx-pbm': '0px', '--sx-mtm': '12px', '--sx-mbm': '16px' });
  });

  it('gradient needs both colours; a bad colour is ignored', () => {
    expect(sectionSpacing({ gradientFrom: '#112233' }).style.backgroundImage).toBeUndefined();
    expect(sectionSpacing({ gradientFrom: 'red', gradientTo: '#000000' }).style.backgroundImage).toBeUndefined();
    const r = sectionSpacing({ gradientFrom: '#112233', gradientTo: '#445566', gradientAngle: 90 });
    expect(r.style.backgroundImage).toBe('linear-gradient(90deg,#112233,#445566)');
    expect(r.className).toContain('sx-own-bg');
  });

  it('keeps the gradient under a background image', () => {
    const r = sectionSpacing({ gradientFrom: '#112233', gradientTo: '#445566', backgroundImageUrl: 'https://cdn.x/a.jpg' });
    expect(r.style.backgroundImage).toBe('url("https://cdn.x/a.jpg"),linear-gradient(180deg,#112233,#445566)');
  });

  it('background video: https only, no quotes or brackets', () => {
    expect(sectionVideoUrl({ backgroundVideoUrl: 'https://cdn.x/v.mp4' })).toBe('https://cdn.x/v.mp4');
    expect(sectionVideoUrl({ backgroundVideoUrl: 'http://cdn.x/v.mp4' })).toBeNull();
    expect(sectionVideoUrl({ backgroundVideoUrl: 'javascript:alert(1)' })).toBeNull();
    expect(sectionVideoUrl({ backgroundVideoUrl: 'https://cdn.x/v.mp4" onload="x' })).toBeNull();
    expect(sectionSpacing({ backgroundVideoUrl: 'https://cdn.x/v.mp4' }).className).toContain('sx-vid');
  });

  it('text style: alignment, colours, heading weight and case', () => {
    const r = sectionSpacing({ textAlign: 'center', textAlignMobile: 'left', textColor: '#111111', headingColor: '#222222', headingWeight: 'bold', headingCase: 'uppercase' });
    expect(r.className.split(' ').sort()).toEqual(['sx-hc', 'sx-hcase', 'sx-hw', 'sx-ta-c', 'sx-tam-l', 'sx-tc']);
    expect(r.style).toMatchObject({ '--sx-tc': '#111111', color: '#111111', '--sx-hc': '#222222', '--sx-hw': '700', '--sx-hcase': 'uppercase' });
    // "as typed" must switch a theme's uppercase headings off; "default" must do nothing
    expect(sectionSpacing({ headingCase: 'none' }).style).toMatchObject({ '--sx-hcase': 'none' });
    expect(sectionSpacing({ headingCase: 'default', headingWeight: 'default', textAlign: 'default' }).className).toBe('');
  });

  it('sticky and entrance animation', () => {
    const s = sectionSpacing({ sticky: true, stickyOffset: 72 });
    expect(s.style).toMatchObject({ position: 'sticky', top: 72, zIndex: 20 });
    const a = sectionSpacing({ animation: 'slide-up', animationDelay: 200, animationSpeed: 'slow' });
    expect(a.className.split(' ').sort()).toEqual(['sx-anim', 'sx-anim-slide-up']);
    expect(a.style).toMatchObject({ '--sx-ad': '200ms', '--sx-ad-dur': '1s' });
    expect(sectionSpacing({ animation: 'none' }).className).toBe('');
    expect(sectionSpacing({ animation: 'spin' }).className).toBe('');
  });
});
