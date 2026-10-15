import { describe, expect, it, vi, beforeEach } from 'vitest';

const post = vi.fn(() => Promise.resolve({}));
vi.mock('../client', () => ({ default: { post: (...a: unknown[]) => post(...(a as [])), get: vi.fn(), delete: vi.fn(), put: vi.fn() } }));

import { apiCreateCheckout } from './checkout';
import { setStorefrontLocaleInfo } from '@/utils/currentStorefront';

describe('apiCreateCheckout market fields', () => {
  beforeEach(() => { post.mockClear(); localStorage.clear(); });
  it('sends the resolved country and the active locale', async () => {
    setStorefrontLocaleInfo({ country: 'PK', locale: 'ur' });
    await apiCreateCheckout({ storeId: 's1' });
    const body = (post.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(body.country).toBe('PK');
    expect(body.locale).toBe('ur');
    expect(body.storeId).toBe('s1');
  });
  it('omits country when unknown but still sends locale', async () => {
    setStorefrontLocaleInfo({ country: null, locale: 'en' });
    await apiCreateCheckout({ storeId: 's1' });
    const body = (post.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect('country' in body).toBe(false);
    expect(body.locale).toBe('en');
  });
});
