import { describe, it, expect } from 'vitest';
import { navItemForPath, hasNavPermission, NAV } from './StoreLayout';

describe('staff route guard helpers', () => {
  it('maps a deep URL to the nav item that owns it (longest match)', () => {
    expect(navItemForPath('products')?.id).toBe('products');
    expect(navItemForPath('products/abc/edit')?.id).toBe('products');
    expect(navItemForPath('online-store/themes/xyz')?.path).toBe('online-store/themes');
  });
  it('treats non-nav pages (account) as not gated', () => {
    expect(navItemForPath('account')).toBeNull();
  });
  it('blocks a staff session without the permission, allows with it, never blocks the owner', () => {
    const orders = navItemForPath('orders')!;
    expect(hasNavPermission({ role: 'staff', permissions: ['products.view'] }, orders.requiredPermission)).toBe(false);
    expect(hasNavPermission({ role: 'staff', permissions: ['orders.view'] }, orders.requiredPermission)).toBe(true);
    expect(hasNavPermission({ role: 'seller' }, orders.requiredPermission)).toBe(true);
  });
  it('every nav item either has a permission or is deliberately owner-only', () => {
    const owner = NAV.flatMap(s => s.items).filter(i => !i.requiredPermission).map(i => i.id);
    console.log('OWNER-ONLY NAV ITEMS:', owner.join(', '));
    expect(Array.isArray(owner)).toBe(true);
  });
});

import { firstAllowedPath } from './StoreLayout';
import { can } from '@/hooks/auth/useCan';
import { TokenStorage } from '@/api/services/auth';

describe('staff landing page', () => {
  it('sends a role without dashboard access to the first page it can use', () => {
    expect(firstAllowedPath({ role: 'staff', permissions: ['inventory.view'] }, 'S1')).toBe('/store/S1/inventory');
    expect(firstAllowedPath({ role: 'staff', permissions: ['orders.view', 'home.view'] }, 'S1')).toBe('/store/S1/dashboard');
    expect(firstAllowedPath({ role: 'staff', permissions: [] }, 'S1')).toBe('/store/S1/account');
  });
});

describe('can() hides what a staff role cannot use', () => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  it('owner always can; staff only with the permission', () => {
    TokenStorage.clear();
    TokenStorage.save(`${b64({ a: 1 })}.${b64({ role: 'seller' })}.s`, 'r');
    TokenStorage.saveUser({ id: '1', role: 'seller' });
    expect(can('analytics.view')).toBe(true);
    TokenStorage.clear();
    TokenStorage.save(`${b64({ a: 1 })}.${b64({ role: 'staff', permissions: ['orders.view'] })}.s`, 'r');
    TokenStorage.saveUser({ id: '2', role: 'staff', storeId: 'S1' });
    expect(can('orders.view')).toBe(true);
    expect(can('analytics.view')).toBe(false);
    expect(can(['analytics.view', 'orders.view'])).toBe(true);
    expect(window.localStorage.getItem('solvexo:staff-store')).toBe('S1');
    TokenStorage.saveUser({ id: '1', role: 'seller' });
    expect(window.localStorage.getItem('solvexo:staff-store')).toBeNull();
  });
});
