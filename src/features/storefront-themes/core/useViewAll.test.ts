import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { eyebrowText } from '../sectionCopy';

vi.mock('@/features/storefront/StorefrontContext', () => ({
  useStorefront: () => ({
    resolveLink: (l: { linkType?: string; url?: string; newTab?: boolean }) =>
      (l.linkType === 'external' ? { href: l.url, ...(l.newTab ? { newTab: true } : {}) } : { to: '/page' }),
  }),
}));

import { useViewAll } from './useViewAll';

describe('eyebrowText: only what the seller typed', () => {
  it('shows nothing by default (no theme words)', () => {
    expect(eyebrowText({})).toBeUndefined();
    expect(eyebrowText(undefined)).toBeUndefined();
    expect(eyebrowText({ eyebrow: '   ' })).toBeUndefined();
  });
  it('shows the seller text', () => expect(eyebrowText({ eyebrow: 'New season' })).toBe('New season'));
  it('an older store that switched it off stays off', () => expect(eyebrowText({ showEyebrow: false, eyebrow: 'x' })).toBeUndefined());
});

describe('useViewAll: the seller decides', () => {
  const run = (s: Record<string, unknown>) => renderHook(() => useViewAll(s, 'View all', '/search')).result.current;

  it('older stores (no setting) keep the link, with the theme word and the default page', () => {
    expect(run({})).toEqual({ label: 'View all', to: '/search', newTab: false });
  });
  it('can be switched off', () => expect(run({ showViewAll: false })).toBeNull());
  it('uses the seller text', () => expect(run({ viewAllLabel: 'Shop everything' })?.label).toBe('Shop everything'));
  it('Tech/Ledup older "linkLabel" still counts', () => expect(run({ linkLabel: 'More' })?.label).toBe('More'));
  it('uses the seller link (in-app page)', () => expect(run({ viewAllLink: { linkType: 'page', pageSlug: 'sale' } })).toMatchObject({ to: '/page' }));
  it('uses the seller link (external, new tab)', () => {
    expect(run({ viewAllLink: { linkType: 'external', url: 'https://x.test', newTab: true } })).toMatchObject({ href: 'https://x.test', newTab: true });
  });
  it('a blank link falls back to the default page', () => expect(run({ viewAllLink: {} })).toMatchObject({ to: '/page' }));
});
