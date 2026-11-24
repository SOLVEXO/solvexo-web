import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let user: { role?: string; storeId?: string | null } | null = { role: 'seller' };
const getStores = vi.fn();
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => user } }));
vi.mock('@/api/services/store', () => ({ apiGetMyStores: () => getStores() }));

import OAuthAuthorizePage from './OAuthAuthorizePage';

const Where = () => { const l = useLocation(); return <p data-testid="where">{l.pathname + l.search}</p>; };
const Q = '?client_id=app_1&redirect_uri=https%3A%2F%2Fzapier.com%2Fcb&scope=read_orders&state=s1';
const renderAt = () => render(
  <MemoryRouter initialEntries={[`/oauth/authorize${Q}`]}>
    <Routes>
      <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);
const store = (id: string, extra: object = {}) => ({ _id: id, name: `Store ${id}`, slug: `store-${id}`, isDelete: false, ...extra });

beforeEach(() => { user = { role: 'seller' }; getStores.mockReset(); });
afterEach(cleanup);

describe('OAuth authorize (store picker)', () => {
  it('signed out: goes to sign in and comes back to the same address', () => {
    user = null;
    renderAt();
    expect(screen.getByTestId('where').textContent).toBe(`/login?redirect=${encodeURIComponent(`/oauth/authorize${Q}`)}`);
  });

  it('one store: straight to its consent screen with the query untouched', async () => {
    getStores.mockResolvedValue({ data: [store('s1')] });
    renderAt();
    expect((await screen.findByTestId('where')).textContent).toBe(`/store/s1/app-platform/authorize${Q}`);
  });

  it('several stores: pick one (a development store is marked); deleted ones are left out', async () => {
    getStores.mockResolvedValue({ data: [store('s1'), store('s2', { planStatus: 'development' }), store('s3', { isDelete: true })] });
    renderAt();
    expect(await screen.findByText('Which store do you want to connect?')).toBeTruthy();
    expect(screen.queryByText('Store s3')).toBeNull();
    expect(screen.getByText('Development store')).toBeTruthy();
    fireEvent.click(screen.getByText('Store s2'));
    expect((await screen.findByTestId('where')).textContent).toBe(`/store/s2/app-platform/authorize${Q}`);
  });

  it('staff go to their own store; a shopper account is told to use a store account', () => {
    user = { role: 'staff', storeId: 's9' };
    renderAt();
    expect(screen.getByTestId('where').textContent).toBe(`/store/s9/app-platform/authorize${Q}`);
    cleanup();
    user = { role: 'user' };
    renderAt();
    expect(screen.getByText('Sign in with a store account')).toBeTruthy();
    expect(getStores).not.toHaveBeenCalled();
  });

  it('no store yet: offers to create one', async () => {
    getStores.mockResolvedValue({ data: [] });
    renderAt();
    expect(await screen.findByText("You don't have a store yet")).toBeTruthy();
  });
});
