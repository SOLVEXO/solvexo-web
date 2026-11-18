import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newTabProps } from './linkTarget';
import { CtaButton } from './sharedSections';
import { CollectionTileCard, tileOptions } from './collectionTiles';
import { LinkButton as FashionLinkButton } from './theme-03-fashion/sections/SectionShell';
import { LinkButton as TechLinkButton } from './theme-04-tech/sections/SectionShell';
import { LinkButton as LedupLinkButton } from './theme-05-ledup/sections/SectionShell';

// A tick on "Open in a new tab" must be honoured for in-store links (a category, a product ...) in every theme.
let newTab = true;
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return {
    ...actual,
    useStorefront: () => ({ store: { storeId: 's1' }, theme: null, cfg: {}, resolveLink: () => ({ to: '/category/c1', ...(newTab ? { newTab: true } : {}) }) }),
  };
});

afterEach(cleanup);
const link = { linkType: 'category', categoryId: 'c1' } as never;
const cases: [string, (text: string) => ReactElement][] = [
  ['Fashion LinkButton', t => <FashionLinkButton text={t} link={link} />],
  ['Tech LinkButton', t => <TechLinkButton text={t} link={link} />],
  ['LedUp LinkButton', t => <LedupLinkButton text={t} link={link} />],
];

describe('newTabProps', () => {
  it('is empty unless the seller asked for a new tab', () => {
    expect(newTabProps(undefined)).toEqual({});
    expect(newTabProps({})).toEqual({});
    expect(newTabProps({ newTab: false })).toEqual({});
    expect(newTabProps({ newTab: true })).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });
});

describe.each(cases)('%s', (_name, make) => {
  it('opens a category link in a new tab when ticked', () => {
    newTab = true;
    render(<MemoryRouter>{make('Go')}</MemoryRouter>);
    const a = screen.getByRole('link', { name: /Go/ });
    expect(a.getAttribute('href')).toBe('/category/c1');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('stays in the same tab when not ticked', () => {
    newTab = false;
    render(<MemoryRouter>{make('Go')}</MemoryRouter>);
    expect(screen.getByRole('link', { name: /Go/ }).getAttribute('target')).toBeNull();
  });
});

describe('other places that draw a seller link', () => {
  it('the shared call-to-action button', () => {
    newTab = true;
    const Btn = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;
    render(<MemoryRouter><CtaButton text="Learn more" link={link} theme={{ Button: Btn } as never} /></MemoryRouter>);
    expect(screen.getByRole('link').getAttribute('target')).toBe('_blank');
  });

  it('the Collection List tile button', () => {
    newTab = true;
    const tile = { key: 'k', name: 'Pre-Primary', description: '', image: '', icon: '', to: '/collections/x', ctaText: 'Shop', ctaLink: link };
    render(<MemoryRouter><CollectionTileCard tile={tile} colors={{ ink: '#000', inkMuted: '#666', bg: '#fff', bgAlt: '#eee', border: '#ddd', accent: '#236' }} fonts={{ display: 'serif', body: 'sans-serif' }} imageRadius={8} buttonRadius={8} opts={tileOptions({})} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Shop' }).getAttribute('target')).toBe('_blank');
  });
});
