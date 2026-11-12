import { describe, it, expect } from 'vitest';
import routerSrc from '@/router/index.tsx?raw';
import { NAV, ACCOUNT_NAV, visibleNavForUser, hasNavPermission, hiddenNavIds } from './navConfig';

const allItems = NAV.flatMap(g => g.items);

describe('navConfig', () => {
  it('has no duplicate ids or paths', () => {
    const ids = allItems.map(i => i.id);
    const paths = allItems.map(i => i.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(ACCOUNT_NAV.every(a => !ids.includes(a.id))).toBe(true);
  });

  it('every mapped path has a route in the router', () => {
    for (const item of [...allItems, ...ACCOUNT_NAV]) {
      const has = (p: string) => new RegExp(`path: '${p}(['/:])`).test(routerSrc);
      const full = has(item.path);
      const segs = item.path.split('/').every(has);
      expect(full || segs, `no route for ${item.id} (${item.path})`).toBe(true);
    }
  });

  it('follows the Shopify-style map', () => {
    const groups = NAV.map(g => g.group);
    expect(groups).toContain('Discounts');
    expect(groups[groups.length - 1]).toBe('Settings');
    expect(allItems.find(i => i.id === 'security')).toBeUndefined();
    expect(ACCOUNT_NAV.map(i => i.id)).toEqual(['security']);
    const inGroup = (id: string) => NAV.find(g => g.items.some(i => i.id === id))?.group;
    expect(inGroup('discounts')).toBe('Discounts');
    expect(inGroup('shipping')).toBe('Settings');
    expect(inGroup('draft-orders')).toBe('Orders');
    expect(inGroup('khata')).toBe('Customers');
  });

  it('seller sees everything, staff only what they hold', () => {
    const seller = visibleNavForUser({ role: 'seller' });
    expect(seller.flatMap(g => g.items).length).toBe(allItems.length);
    const none = visibleNavForUser({ role: 'staff', permissions: [] });
    expect(none).toHaveLength(0);
    const staff = visibleNavForUser({ role: 'staff', permissions: ['orders.view'] }).flatMap(g => g.items.map(i => i.id));
    expect(staff).toEqual(['orders']);
    expect(hasNavPermission({ role: 'staff', permissions: ['a'] }, ['b', 'a'])).toBe(true);
  });

  it('plan gate hides an item only when the feature is explicitly off', () => {
    const gated = allItems.find(i => i.requiredEntitlement);
    expect(gated).toBeDefined();
    const key = gated!.requiredEntitlement!;
    const off = { [key]: { allowed: false } } as never;
    const on = { [key]: { allowed: true } } as never;
    const has = (e: never | null) => visibleNavForUser({ role: 'seller' }, e).flatMap(g => g.items).some(i => i.id === gated!.id);
    expect(has(null)).toBe(true);
    expect(has(on)).toBe(true);
    expect(has(off)).toBe(false);
  });

  it('hides payment proofs until the store uses them', () => {
    expect(hiddenNavIds({}).has('payment-proofs')).toBe(true);
    expect(hiddenNavIds({ 'payment-proofs-shown': 1 }).has('payment-proofs')).toBe(false);
  });
});
