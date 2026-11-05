import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

vi.hoisted(() => { vi.stubEnv('VITE_API_URL', 'http://api.test'); });

/** Requests to the client go through this fake adapter; the refresh call goes through plain axios (mocked below). */
const refreshPost = vi.hoisted(() => vi.fn());
vi.mock('axios', async (orig) => {
  const real = (await orig<{ default: typeof import('axios').default }>()).default;
  const wrapped = Object.assign(Object.create(real), real, { post: refreshPost, create: real.create.bind(real) });
  return { default: wrapped };
});

import client from './client';

function cookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function signIn() {
  document.cookie = `accessToken=old-access; path=/`;
  document.cookie = `refreshToken=old-refresh; path=/`;
  document.cookie = `user=${encodeURIComponent(JSON.stringify({ role: 'seller' }))}; path=/`;
}

const seen: string[] = [];
function adapter(config: InternalAxiosRequestConfig) {
  const auth = String(config.headers?.Authorization ?? '');
  seen.push(auth);
  if (auth === 'Bearer old-access') {
    return Promise.reject(Object.assign(new Error('401'), { config, response: { status: 401, data: { message: 'Session expired, please login again' }, headers: {}, config } }));
  }
  return Promise.resolve({ data: { success: true, data: { ok: true } }, status: 200, statusText: 'OK', headers: {}, config });
}

const assign = vi.fn();
beforeEach(() => {
  seen.length = 0;
  client.defaults.adapter = adapter as never;
  signIn();
  window.history.pushState({}, '', '/store/abc123/analytics');
  Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, pathname: '/store/abc123/analytics', search: '', assign } });
});
afterEach(() => { vi.clearAllMocks(); });

describe('API client: expired session', () => {
  it('gets a new access token with the refresh token and retries the request once', async () => {
    refreshPost.mockResolvedValue({ data: { success: true, data: { token: { accessToken: 'new-access', refreshToken: 'new-refresh' } } } });
    const res = await client.get('/api/analytics/seller/overview');
    expect(res).toEqual({ success: true, data: { ok: true } });
    expect(refreshPost).toHaveBeenCalledWith('http://api.test/api/auth/refresh', { refreshToken: 'old-refresh' }, expect.anything());
    expect(seen).toEqual(['Bearer old-access', 'Bearer new-access']);
    expect(cookie('accessToken')).toBe('new-access');
    expect(cookie('refreshToken')).toBe('new-refresh');
    expect(assign).not.toHaveBeenCalled();
  });

  it('shares one refresh between requests that fail together', async () => {
    refreshPost.mockResolvedValue({ data: { success: true, data: { token: { accessToken: 'new-access' } } } });
    await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(refreshPost).toHaveBeenCalledTimes(1);
  });

  it('when the refresh fails too, signs out and sends a dashboard user to the sign-in page', async () => {
    refreshPost.mockRejectedValue(new Error('401'));
    await expect(client.get('/api/analytics/seller/overview')).rejects.toThrow('Session expired, please login again');
    expect(cookie('accessToken')).toBeNull();
    expect(cookie('user')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login?redirect=%2Fstore%2Fabc123%2Fanalytics&expired=1');
  });
});
