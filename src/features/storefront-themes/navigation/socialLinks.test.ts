import { describe, expect, it } from 'vitest';
import { socialHref, hasSocialTarget } from './socialLinks';

describe('socialHref', () => {
  it('keeps a full https link', () => {
    expect(socialHref({ platform: 'instagram', url: 'https://instagram.com/a' })).toBe('https://instagram.com/a');
  });
  it('adds https to a known social link typed without it', () => {
    expect(socialHref({ platform: 'instagram', url: 'instagram.com/saeedanwaroud' })).toBe('https://instagram.com/saeedanwaroud');
    expect(socialHref({ platform: 'facebook', url: 'www.facebook.com/x' })).toBe('https://www.facebook.com/x');
  });
  it('turns a username into the platform link', () => {
    expect(socialHref({ platform: 'instagram', url: '@store' })).toBe('https://instagram.com/store');
    expect(socialHref({ platform: 'tiktok', url: 'store' })).toBe('https://tiktok.com/@store');
  });
  it('builds a wa.me link from a phone number', () => {
    expect(socialHref({ platform: 'whatsapp', url: '+92 312 1110000' })).toBe('https://wa.me/923121110000');
  });
  it('shows nothing for an empty or unsafe value', () => {
    expect(socialHref({ platform: 'instagram', url: '' })).toBeNull();
    expect(socialHref({ platform: 'instagram', url: 'javascript:alert(1)' })).toBeNull();
    expect(socialHref({ platform: 'instagram', url: 'http://evil.com/x' })).toBeNull();
    expect(socialHref({ platform: 'whatsapp', url: 'abc' })).toBeNull();
    expect(hasSocialTarget({ settings: { platform: 'x', url: '' } })).toBe(false);
  });
});
