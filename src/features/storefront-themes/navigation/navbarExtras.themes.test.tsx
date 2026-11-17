import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

// ── what the navbars read from the storefront ──
const state: { blocks: unknown[]; loggedIn: boolean; country: string | null; editing: boolean } = { blocks: [], loggedIn: false, country: 'PK', editing: false };

vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return {
    ...actual,
    useStorefront: () => ({
      store: { storeId: 'S1', name: 'Test Shop', logo: null, slug: 'test' },
      theme: { header: { blocks: state.blocks, menuId: null }, theme: {} },
      resolveLink: actual.resolveStorefrontLink,
    }),
  };
});
vi.mock('@/features/storefront/storefrontMarket', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/storefrontMarket')>();
  return { ...actual, useStorefrontMarketOptional: () => ({ country: state.country, language: 'en', languages: ['en'], defaultLanguage: 'en', countries: [], markets: [], loaded: true, market: null, setCountry() {}, setLanguage() {} }) };
});
vi.mock('@/api/services/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/api/services/auth')>();
  return { ...actual, TokenStorage: { ...actual.TokenStorage, isLoggedIn: () => state.loggedIn, getUser: () => null }, isGuestUser: () => false };
});
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ cartCount: 0 }) }));
vi.mock('@/contexts/WishlistContext', () => ({ useWishlistContext: () => ({ wishlistCount: 0 }) }));
vi.mock('../cartDrawerContext', () => ({ useCartDrawer: () => ({ openDrawer() {}, mounted: false }) }));
vi.mock('@/api/services/collections', () => ({ apiGetPublicCollections: () => Promise.resolve({ data: [] }) }));
vi.mock('@/api/services/storePages', () => ({ apiListPublicStorePages: () => Promise.resolve({ data: [] }) }));
vi.mock('../inlineEdit', async importOriginal => {
  const actual = await importOriginal<typeof import('../inlineEdit')>();
  return { ...actual, useInlineEditActive: () => state.editing };
});
// parts of the header that are not under test and need their own providers
vi.mock('../theme-03-fashion/components/browse/FashionPredictiveSearch', () => ({ FashionPredictiveSearch: () => null }));
vi.mock('../theme-03-fashion/components/FashionLocaleControls', () => ({ FashionLocaleControls: () => null }));
vi.mock('../theme-04-tech/components/TechPredictiveSearch', () => ({ TechPredictiveSearch: () => null }));
vi.mock('../theme-05-ledup/components/LedupSearchPanel', () => ({ LedupSearchPanel: () => null }));
vi.mock('../theme-05-ledup/components/LedupAuthPopover', () => ({ LedupAuthPopover: () => null }));

import { FashionNavbar } from '../theme-03-fashion/components/FashionNavbar';
import { TechNavbar } from '../theme-04-tech/components/TechNavbar';
import { LedupNavbar } from '../theme-05-ledup/components/LedupNavbar';

const block = (settings: Record<string, unknown>) => ({ _id: String(settings.label), type: 'nav_link', enabled: true, settings });
const promo = { imageUrl: 'https://cdn.example.com/p.jpg', title: 'Summer sale', text: 'Up to 50% off', buttonLabel: 'Shop now', link: { linkType: 'page', pageSlug: 'sale' } };

const header = () => [
  block({ label: 'Home', linkType: 'home' }),
  block({ label: 'Deals', linkType: 'page', pageSlug: 'deals', badge: 'Hot', badgeColor: '#ff3300' }),
  block({
    label: 'Shop', linkType: 'home', menuStyle: 'mega', megaColumns: 2, megaPromos: [promo],
    children: [
      { label: 'Men', linkType: 'home', badge: 'New', children: [{ label: 'Shirts', linkType: 'home' }, { label: 'Shoes', linkType: 'home' }] },
      { label: 'Women', linkType: 'home', children: [{ label: 'Dresses', linkType: 'home' }] },
    ],
  }),
  block({ label: 'Members only', linkType: 'home', showTo: 'customers' }),
  block({ label: 'Pakistan only', linkType: 'home', showCountries: 'PK' }),
  block({ label: 'Not in Pakistan', linkType: 'home', hideCountries: 'PK' }),
];

beforeEach(() => {
  state.blocks = header();
  state.loggedIn = false;
  state.country = 'PK';
  state.editing = false;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const bars: [string, () => ReactElement][] = [
  ['Maison', () => <FashionNavbar />],
  ['Tech', () => <TechNavbar />],
  ['Ledup', () => <LedupNavbar />],
];

describe.each(bars)('%s navbar: badges, promos, show-when rules', (_name, bar) => {
  const show = () => render(<MemoryRouter>{bar()}</MemoryRouter>);
  const nav = () => within(screen.getAllByRole('navigation', { name: /main/i })[0]);

  it('draws a badge next to the label, in the seller\'s colour', () => {
    show();
    const deals = nav().getByText('Deals');
    const badge = deals.parentElement!.querySelector('[data-nav-badge]') as HTMLElement | null ?? deals.querySelector('[data-nav-badge]') as HTMLElement;
    expect(badge?.textContent).toBe('Hot');
    expect(badge.style.background).toBe('rgb(255, 51, 0)');
  });

  it('hides items whose show-when rules say no, for this visitor (a guest in Pakistan)', () => {
    show();
    const labels = Array.from(document.querySelectorAll('nav a, nav button, nav span')).map(e => e.textContent ?? '');
    expect(labels.some(l => l.startsWith('Members only'))).toBe(false);
    expect(labels.some(l => l.startsWith('Not in Pakistan'))).toBe(false);
    expect(labels.some(l => l.startsWith('Pakistan only'))).toBe(true);
    expect(labels.some(l => l.startsWith('Deals'))).toBe(true);
  });

  it('a signed-in customer abroad sees the other items', () => {
    state.loggedIn = true;
    state.country = 'GB';
    show();
    const labels = Array.from(document.querySelectorAll('nav a, nav button, nav span')).map(e => e.textContent ?? '');
    expect(labels.some(l => l.startsWith('Members only'))).toBe(true);
    expect(labels.some(l => l.startsWith('Not in Pakistan'))).toBe(true);
    expect(labels.some(l => l.startsWith('Pakistan only'))).toBe(false);
  });

  it('the editor always shows every item, so the seller can edit them', () => {
    state.editing = true;
    show();
    const labels = Array.from(document.querySelectorAll('nav a, nav button, nav span')).map(e => e.textContent ?? '');
    for (const l of ['Members only', 'Not in Pakistan', 'Pakistan only']) expect(labels.some(x => x.startsWith(l))).toBe(true);
  });
});

describe('promo cards in the mega panel', () => {
  // every theme keeps its mega panel mounted (hidden until hovered), so the card is in the page at rest
  it.each([['Maison', () => <FashionNavbar />], ['Tech', () => <TechNavbar />], ['Ledup', () => <LedupNavbar />]] as [string, () => ReactElement][])('%s: the card is drawn with its picture, title, text, button and link', (_n, bar) => {
    render(<MemoryRouter>{bar()}</MemoryRouter>);
    const cards = document.querySelector('[data-mega-promos]') as HTMLElement;
    expect(cards).not.toBeNull();
    expect(within(cards).getByText('Summer sale')).toBeTruthy();
    expect(within(cards).getByText('Up to 50% off')).toBeTruthy();
    expect(within(cards).getByText('Shop now')).toBeTruthy();
    expect(cards.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/p.jpg');
    expect(cards.querySelector('a')?.getAttribute('href')).toBe('/sale');
  });

  it('a menu without promos draws none', () => {
    state.blocks = [block({ label: 'Shop', linkType: 'home', menuStyle: 'mega', children: [{ label: 'Men', linkType: 'home', children: [{ label: 'Shirts', linkType: 'home' }] }] })];
    render(<MemoryRouter><FashionNavbar /></MemoryRouter>);
    expect(document.querySelector('[data-mega-promos]')).toBeNull();
  });
});
