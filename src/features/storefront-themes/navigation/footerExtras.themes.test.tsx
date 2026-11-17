import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const state: { loggedIn: boolean; editing: boolean } = { loggedIn: false, editing: false };
const links = [
  { label: 'Shipping', linkType: 'home' },
  { label: 'Sale', linkType: 'home', badge: 'Hot', badgeColor: '#ff3300' },
  { label: 'My orders', linkType: 'home', showTo: 'customers' },
  { label: 'Join us', linkType: 'home', showTo: 'guests' },
];
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return {
    ...actual,
    useStorefront: () => ({
      store: { storeId: 'S1', name: 'Shop', logo: null, slug: 'shop' },
      theme: { footer: { blocks: [{ _id: 'c1', type: 'footer_column', enabled: true, settings: { heading: 'Help', links } }] }, theme: {} },
      resolveLink: actual.resolveStorefrontLink,
    }),
  };
});
vi.mock('@/api/services/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/api/services/auth')>();
  return { ...actual, TokenStorage: { ...actual.TokenStorage, isLoggedIn: () => state.loggedIn, getUser: () => null }, isGuestUser: () => false };
});
vi.mock('../inlineEdit', async importOriginal => ({ ...(await importOriginal<typeof import('../inlineEdit')>()), useInlineEditActive: () => state.editing }));

import { FooterColumns as Fashion } from '../theme-03-fashion/components/nav/FooterColumns';
import { FooterColumns as Tech } from '../theme-04-tech/components/nav/FooterColumns';
import { FooterColumns as Ledup } from '../theme-05-ledup/components/nav/FooterColumns';

afterEach(() => { cleanup(); state.loggedIn = false; state.editing = false; });
const tokens = {
  fontBody: 'sans-serif', fontDisplay: 'serif', fg: '#ffffff', muted: '#aaaaaa', heading: { color: '#ffffff' }, linkSize: '14px', brandWeight: 600,
  input: {}, button: {}, doneColor: '#0f0', errorColor: '#f00', idPrefix: 'x', newsletterHeading: 'News', blogLabel: 'Blog',
};

describe.each([['Maison', Fashion], ['Tech', Tech], ['Ledup', Ledup]] as const)('%s footer links: badges and show-when rules', (_n, Footer) => {
  const show = () => render(<MemoryRouter><Footer tokens={tokens} /></MemoryRouter>);
  it('a badge appears next to its link', () => {
    const { container } = show();
    expect(container.querySelector('[data-nav-badge]')?.textContent).toBe('Hot');
    expect(screen.getByText('Shipping')).toBeTruthy();
  });
  it('a visitor who is not signed in sees guest links, not customer links', () => {
    show();
    expect(screen.queryByText('My orders')).toBeNull();
    expect(screen.getByText('Join us')).toBeTruthy();
  });
  it('a signed-in customer sees the opposite', () => {
    state.loggedIn = true;
    show();
    expect(screen.getByText('My orders')).toBeTruthy();
    expect(screen.queryByText('Join us')).toBeNull();
  });
  it('the editor shows every link so the seller can still edit it', () => {
    state.editing = true;
    show();
    expect(screen.getByText('My orders')).toBeTruthy();
    expect(screen.getByText('Join us')).toBeTruthy();
  });
});
