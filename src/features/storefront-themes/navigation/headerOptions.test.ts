import { describe, it, expect } from 'vitest';
import { readHeaderOptions, logoImageProps, readFooterOptions, expandCopyright, footerLayoutBlocks } from './headerOptions';
import { resolveStorefrontLink } from '@/features/storefront/StorefrontContext';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';

describe('readHeaderOptions', () => {
  it('reads a header saved before these settings existed as exactly the old look', () => {
    expect(readHeaderOptions(undefined, 'Journal')).toEqual({
      logoWidth: null, mobileLogoWidth: null, sticky: false, showSearch: true, showAccount: true, showWishlist: true,
      showShopMenu: true, shopLabel: 'Shop', includePagesInNav: true, showDefaultBlogLink: true, blogLabel: 'Journal',
      headerStyle: 'standard', navAlignment: 'left', bgColor: null, textColor: null, paddingDelta: 0, showDivider: true,
    });
    // a stored doc that only has the old fields behaves the same
    expect(readHeaderOptions({ logoSource: 'store', blocks: [], menuId: null } as Partial<StorefrontHeader>, 'Stories').sticky).toBe(false);
  });

  it('keeps retailer choices, clamping logo widths and trimming labels', () => {
    const o = readHeaderOptions({
      logoWidth: 9999, mobileLogoWidth: 2, sticky: true, showSearch: false, showAccount: false, showWishlist: false,
      showShopMenu: false, shopMenuLabel: '  Store  ', includePagesInNav: false, showDefaultBlogLink: false, blogLinkLabel: ' News ',
      headerStyle: 'centered', navAlignment: 'right',
    }, 'Journal');
    expect(o).toMatchObject({
      logoWidth: 400, mobileLogoWidth: 24, sticky: true, showSearch: false, showAccount: false, showWishlist: false,
      showShopMenu: false, shopLabel: 'Store', includePagesInNav: false, showDefaultBlogLink: false, blogLabel: 'News',
      headerStyle: 'centered', navAlignment: 'right',
    });
  });

  it('ignores junk values instead of breaking the header', () => {
    const o = readHeaderOptions({ logoWidth: 'wide' as unknown as number, headerStyle: 'weird' as never, navAlignment: 'diagonal' as never, shopMenuLabel: '   ' }, 'Journal');
    expect(o.logoWidth).toBeNull();
    expect(o.headerStyle).toBe('standard');
    expect(o.navAlignment).toBe('left');
    expect(o.shopLabel).toBe('Shop');
  });
});

describe('logoImageProps', () => {
  it('keeps the theme\'s own 40px cap until a width is set', () => {
    expect(logoImageProps({ logoWidth: null, mobileLogoWidth: null })).toEqual({ className: 'max-h-10 max-w-[180px] object-contain' });
  });
  it('uses the retailer width on desktop and a separate (or capped) width on mobile, never distorting', () => {
    const both = logoImageProps({ logoWidth: 220, mobileLogoWidth: 90 });
    expect(both.style).toMatchObject({ '--logo-w': '220px', '--logo-w-m': '90px' });
    expect(both.className).toContain('h-auto');
    expect(logoImageProps({ logoWidth: 300, mobileLogoWidth: null }).style).toMatchObject({ '--logo-w': '300px', '--logo-w-m': '180px' });
    expect(logoImageProps({ logoWidth: 100, mobileLogoWidth: null }).style).toMatchObject({ '--logo-w-m': '100px' });
    expect(logoImageProps({ logoWidth: null, mobileLogoWidth: 80 }).style).toMatchObject({ '--logo-w': '180px', '--logo-w-m': '80px' });
  });
});

describe('readFooterOptions / expandCopyright', () => {
  it('defaults to the footer as it was before the settings existed', () => {
    expect(readFooterOptions(undefined, 'Stories')).toEqual({
      logoSource: 'none', logoUrl: null, logoWidth: 140, showNewsletter: true, newsletterHeading: null, newsletterText: null,
      showDefaultColumns: true, shopColumnHeading: 'Shop', accountColumnHeading: 'Account', blogLabel: 'Stories',
      bgColor: null, textColor: null,
    });
  });
  it('reads retailer choices', () => {
    const o = readFooterOptions({
      logoSource: 'custom', logoUrl: ' https://x/y.png ', logoWidth: 500, showNewsletter: false, newsletterHeading: 'Join us',
      showDefaultColumns: false, shopColumnHeading: 'Browse', accountColumnHeading: 'Me', blogLinkLabel: 'News',
    } as Partial<StorefrontFooter>, 'Journal');
    expect(o).toMatchObject({ logoSource: 'custom', logoUrl: 'https://x/y.png', logoWidth: 400, showNewsletter: false, newsletterHeading: 'Join us', showDefaultColumns: false, shopColumnHeading: 'Browse', accountColumnHeading: 'Me', blogLabel: 'News' });
  });
  it('turns an older footer into the same-looking block list, and keeps a block-layout footer as saved', () => {
    const legacy = footerLayoutBlocks({
      blocks: [
        { type: 'footer_contact', settings: { email: 'a@b.c' } },
        { type: 'footer_text', settings: { text: 'About us' } },
        { type: 'footer_column', settings: { heading: 'Help', links: [] } },
      ],
      newsletterHeading: 'Join',
    } as Partial<StorefrontFooter>);
    expect(legacy.map(b => b.type)).toEqual(['footer_brand', 'footer_column', 'footer_contact', 'footer_newsletter']);
    expect(legacy[0].settings.text).toBe('About us');
    expect(legacy[3].settings.heading).toBe('Join');
    expect(footerLayoutBlocks({ showNewsletter: false, blocks: [] } as Partial<StorefrontFooter>).map(b => b.type)).toEqual(['footer_brand']);
    const saved = [{ type: 'footer_newsletter', settings: {} }, { type: 'footer_column', settings: { heading: 'A', links: [] } }];
    expect(footerLayoutBlocks({ blockLayout: true, blocks: saved } as Partial<StorefrontFooter>)).toBe(saved);
  });
  it('reads header colours and spacing, ignoring junk', () => {
    expect(readHeaderOptions({ bgColor: '#112233', textColor: 'red', paddingY: 'spacious', showDivider: false }, 'Journal'))
      .toMatchObject({ bgColor: '#112233', textColor: null, paddingDelta: 10, showDivider: false });
  });
  it('expands {year} in the copyright text', () => {
    expect(expandCopyright('© {year} Acme. {YEAR}', new Date('2031-05-01'))).toBe('© 2031 Acme. 2031');
    expect(expandCopyright('No token')).toBe('No token');
  });
});

describe('resolveStorefrontLink — new link types', () => {
  it('resolves cart, account, email and phone', () => {
    expect(resolveStorefrontLink({ linkType: 'cart' })).toEqual({ to: '/cart' });
    expect(resolveStorefrontLink({ linkType: 'account' })).toEqual({ to: '/account' });
    expect(resolveStorefrontLink({ linkType: 'email', url: 'hi@shop.com' })).toEqual({ href: 'mailto:hi@shop.com' });
    expect(resolveStorefrontLink({ linkType: 'phone', url: '+92 300-123 4567' })).toEqual({ href: 'tel:+923001234567' });
  });
  it('carries newTab and leaves the old types untouched', () => {
    expect(resolveStorefrontLink({ linkType: 'external', url: 'https://a.b', newTab: true })).toEqual({ href: 'https://a.b', newTab: true });
    expect(resolveStorefrontLink({ linkType: 'page', pageSlug: 'about' })).toEqual({ to: '/about' });
    expect(resolveStorefrontLink({ linkType: 'home' })).toEqual({ to: '/' });
  });
});
