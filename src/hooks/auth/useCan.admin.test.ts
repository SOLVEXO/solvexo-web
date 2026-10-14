import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStorage } from '@/api/services/auth';
import { can, isTeamAdminSession, isReadOnlyAdmin } from './useCan';

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fakeJwt = (payload: object) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.sig`;

describe('can() — platform admin team', () => {
  beforeEach(() => { TokenStorage.clear(); });

  it('the owner / Super Admin (no teamAdmin claim) can do everything', () => {
    TokenStorage.save(fakeJwt({ role: 'admin' }), 'r');
    TokenStorage.saveUser({ id: '1', role: 'admin', isSuperAdmin: true });
    expect(isTeamAdminSession()).toBe(false);
    expect(can('finance.payouts')).toBe(true);
  });

  it('a team admin only holds the permissions in its token', () => {
    TokenStorage.save(fakeJwt({ role: 'admin', teamAdmin: true, permissions: ['clients.view'], readOnly: false }), 'r');
    TokenStorage.saveUser({ id: '2', role: 'admin' });
    expect(isTeamAdminSession()).toBe(true);
    expect(can('clients.view')).toBe(true);
    expect(can('finance.payouts')).toBe(false);
    expect(can(['finance.payouts', 'clients.view'])).toBe(true);
  });

  it('knows a read-only role', () => {
    TokenStorage.save(fakeJwt({ role: 'admin', teamAdmin: true, permissions: ['clients.view'], readOnly: true }), 'r');
    TokenStorage.saveUser({ id: '3', role: 'admin' });
    expect(isReadOnlyAdmin()).toBe(true);
  });

  it('a malformed token does not turn the owner into a team admin', () => {
    TokenStorage.save('not-a-jwt', 'r');
    TokenStorage.saveUser({ id: '1', role: 'admin' });
    expect(isTeamAdminSession()).toBe(false);
  });
});
