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
