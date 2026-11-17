import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { resolveStorefrontLink, type StorefrontNavItemSettings } from '@/features/storefront/StorefrontContext';
import { navHasSchedule, normalizeNavItems } from './megaNav';
import { NavBadge } from './NavBadge';
import { MegaPromoCards, type PromoTokens } from './MegaPromoCards';
import type { SectionRuleContext } from '../sectionRules';

afterEach(cleanup);

const visitor = (over: Partial<SectionRuleContext> = {}): SectionRuleContext => ({ loggedIn: false, country: 'PK', language: 'en', now: Date.parse('2026-06-15T12:00:00Z'), ...over });
const norm = (items: StorefrontNavItemSettings[], rules?: SectionRuleContext) => normalizeNavItems(items, resolveStorefrontLink, undefined, 'nav', 'en', rules);

describe('normalizeNavItems: badge, columns, promos', () => {
  it('carries a badge with its colour; a bad colour falls back to the theme accent; long text is cut', () => {
    const [a, b, c, d] = norm([
      { label: 'A', linkType: 'home', badge: 'New', badgeColor: '#ff0000' },
      { label: 'B', linkType: 'home', badge: ' Sale ', badgeColor: 'red' },
      { label: 'C', linkType: 'home', badge: 'x'.repeat(30) },
      { label: 'D', linkType: 'home', badge: '   ' },
    ]);
    expect(a.badge).toEqual({ text: 'New', color: '#ff0000' });
    expect(b.badge).toEqual({ text: 'Sale', color: null });
    expect(c.badge?.text).toHaveLength(12);
    expect(d.badge).toBeNull();
  });

  it('badges also work on sub-items', () => {
    const [top] = norm([{ label: 'Shop', linkType: 'home', children: [{ label: 'Kids', linkType: 'home', badge: 'Hot' }] }]);
    expect(top.children[0].badge?.text).toBe('Hot');
  });

  it('mega columns: 2 to 6 only (0 = the theme\'s own setting)', () => {
    const cols = (n: number | null | undefined) => norm([{ label: 'A', linkType: 'home', megaColumns: n }])[0].megaColumns;
    expect(cols(4)).toBe(4);
    expect([cols(0), cols(1), cols(7), cols(null), cols(undefined)]).toEqual([0, 0, 0, 0, 0]);
  });

  it('promo cards: resolved links, https images only, at most two, empty ones dropped', () => {
    const [top] = norm([{
      label: 'Shop', linkType: 'home', menuStyle: 'mega',
      megaPromos: [
        { imageUrl: 'https://cdn.x/a.jpg', title: ' Summer ', text: 'Up to 50%', buttonLabel: 'Shop', link: { linkType: 'page', pageSlug: 'sale' } },
        { imageUrl: 'javascript:alert(1)', title: 'No image shown' },
        { text: 'no picture and no title' },
        { title: 'third is cut' },
      ],
    }]);
    expect(top.promos).toHaveLength(2);
    expect(top.promos![0]).toEqual({ imageUrl: 'https://cdn.x/a.jpg', title: 'Summer', text: 'Up to 50%', buttonLabel: 'Shop', link: { to: '/sale' } });
    expect(top.promos![1].imageUrl).toBeNull();
  });
});

describe('normalizeNavItems: show-when rules', () => {
  const items: StorefrontNavItemSettings[] = [
    { label: 'Everyone', linkType: 'home' },
    { label: 'Members', linkType: 'home', showTo: 'customers' },
    { label: 'Guests', linkType: 'home', showTo: 'guests' },
    { label: 'Pakistan', linkType: 'home', showCountries: 'PK' },
    { label: 'Not US', linkType: 'home', hideCountries: 'US' },
    { label: 'Sale', linkType: 'home', showFrom: '2026-06-01T00:00:00.000Z', showUntil: '2026-06-30T00:00:00.000Z' },
    { label: 'Urdu', linkType: 'home', showLanguages: 'ur' },
  ];
  const labels = (rules?: SectionRuleContext) => norm(items, rules).map(i => i.label);

  it('without a visitor (the editor) everything shows', () => {
    expect(labels()).toHaveLength(7);
  });

  it('a guest in Pakistan during the sale, reading English', () => {
    expect(labels(visitor())).toEqual(['Everyone', 'Guests', 'Pakistan', 'Not US', 'Sale']);
  });

  it('a signed-in customer in the US, Urdu, after the sale ended', () => {
    expect(labels(visitor({ loggedIn: true, country: 'US', language: 'ur', now: Date.parse('2026-07-02T00:00:00Z') }))).toEqual(['Everyone', 'Members', 'Urdu']);
  });

  it('a hidden item takes its sub-items with it, and rules apply inside menus', () => {
    const tree: StorefrontNavItemSettings[] = [
      { label: 'Members area', linkType: 'home', showTo: 'customers', children: [{ label: 'Orders', linkType: 'home' }] },
      { label: 'Shop', linkType: 'home', children: [{ label: 'Public', linkType: 'home' }, { label: 'Private', linkType: 'home', showTo: 'customers' }] },
    ];
    const out = norm(tree, visitor());
    expect(out.map(i => i.label)).toEqual(['Shop']);
    expect(out[0].children.map(c => c.label)).toEqual(['Public']);
  });

  it('knows whether any item has a schedule (so the navbar only ticks when it must)', () => {
    expect(navHasSchedule([{ label: 'A', linkType: 'home' }])).toBe(false);
    expect(navHasSchedule([{ label: 'A', linkType: 'home', children: [{ label: 'B', linkType: 'home', showUntil: '2026-06-30T00:00:00.000Z' }] }])).toBe(true);
  });
});

describe('NavBadge', () => {
  it('shows the text in the seller\'s colour with a readable ink; the theme accent when none', () => {
    const { container, rerender } = render(<NavBadge badge={{ text: 'New', color: '#ffee00' }} fallbackBg="#111111" fallbackInk="#ffffff" />);
    const el = container.querySelector('[data-nav-badge]') as HTMLElement;
    expect(el.textContent).toBe('New');
    expect(el.style.background).toBe('rgb(255, 238, 0)');
    expect(el.style.color).toBe('rgb(17, 17, 17)'); // dark ink on a light yellow
    rerender(<NavBadge badge={{ text: 'Sale', color: '#800000' }} fallbackBg="#111111" fallbackInk="#ffffff" />);
    expect((container.querySelector('[data-nav-badge]') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    rerender(<NavBadge badge={{ text: 'Hot', color: null }} fallbackBg="#0156ff" fallbackInk="#ffffff" />);
    expect((container.querySelector('[data-nav-badge]') as HTMLElement).style.background).toBe('rgb(1, 86, 255)');
  });
  it('draws nothing without a badge', () => {
    const { container } = render(<NavBadge badge={null} fallbackBg="#000" fallbackInk="#fff" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('MegaPromoCards', () => {
  const tokens: PromoTokens = { ink: '#111', inkMuted: '#666', border: '#ddd', bg: '#fff', bgAlt: '#f4f4f4', accent: '#0156ff', accentInk: '#fff', radius: 16 };
  const promos = [
    { imageUrl: 'https://cdn.x/a.jpg', title: 'Summer sale', text: 'Up to 50% off', buttonLabel: 'Shop now', link: { to: '/collections/sale' } },
    { imageUrl: null, title: 'No link card', text: '', buttonLabel: '', link: {} },
  ];

  it('draws each card; a card with a link is one link, a card without is plain', () => {
    const { container } = render(<MemoryRouter><MegaPromoCards promos={promos} tokens={tokens} /></MemoryRouter>);
    expect(screen.getByText('Summer sale')).toBeTruthy();
    expect(screen.getByText('Shop now')).toBeTruthy();
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/collections/sale');
    expect(link.textContent).toContain('Up to 50% off');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.x/a.jpg');
  });

  it('draws nothing without promos', () => {
    const { container } = render(<MemoryRouter><MegaPromoCards promos={[]} tokens={tokens} /></MemoryRouter>);
    expect(container.firstChild).toBeNull();
  });
});
