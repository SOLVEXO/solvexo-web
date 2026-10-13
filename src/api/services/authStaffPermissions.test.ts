import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStorage } from './auth';

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fakeJwt = (payload: object) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.sig`;

describe('TokenStorage.getUser — staff permissions', () => {
  beforeEach(() => { TokenStorage.clear(); });

  it('fills a staff session\'s permissions from its token when the cookie lacks them', () => {
    TokenStorage.save(fakeJwt({ role: 'staff', permissions: ['orders.view', 'products.view'] }), 'r');
    TokenStorage.saveUser({ id: '1', role: 'staff', storeId: 's1' });
    expect(TokenStorage.getUser<{ permissions?: string[] }>()?.permissions).toEqual(['orders.view', 'products.view']);
  });

  it('leaves seller sessions untouched', () => {
    TokenStorage.save(fakeJwt({ role: 'seller', permissions: ['x'] }), 'r');
    TokenStorage.saveUser({ id: '1', role: 'seller' });
    expect(TokenStorage.getUser<{ permissions?: string[] }>()?.permissions).toBeUndefined();
  });

  it('survives a malformed token', () => {
    TokenStorage.save('not-a-jwt', 'r');
    TokenStorage.saveUser({ id: '1', role: 'staff' });
    expect(TokenStorage.getUser<{ permissions?: string[] }>()?.permissions).toBeUndefined();
  });
});
