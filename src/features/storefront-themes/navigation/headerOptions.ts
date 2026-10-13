import type { CSSProperties } from 'react';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';

/**
 * The retailer-controlled header settings, with every missing value read as "today's look" — a store saved
 * before these settings existed (or a public payload that omits them) renders exactly as it always did.
 */
export interface HeaderOptions {
  logoWidth: number | null;
  mobileLogoWidth: number | null;
  sticky: boolean;
  showSearch: boolean;
  showAccount: boolean;
  showWishlist: boolean;
  showShopMenu: boolean;
  shopLabel: string;
  includePagesInNav: boolean;
  showDefaultBlogLink: boolean;
  blogLabel: string;
  headerStyle: 'standard' | 'centered';
  navAlignment: 'left' | 'center' | 'right';
}

const text = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const width = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null;

/** @param defaultBlogLabel the theme's own label for the empty-nav fallback link ("Journal" / "Stories"). */
export function readHeaderOptions(header: Partial<StorefrontHeader> | null | undefined, defaultBlogLabel: string): HeaderOptions {
  const h = header ?? {};
  return {
    logoWidth: width(h.logoWidth, 40, 400),
    mobileLogoWidth: width(h.mobileLogoWidth, 24, 240),
    sticky: h.sticky === true,
    showSearch: h.showSearch !== false,
    showAccount: h.showAccount !== false,
    showWishlist: h.showWishlist !== false,
    showShopMenu: h.showShopMenu !== false,
    shopLabel: text(h.shopMenuLabel, 'Shop'),
    includePagesInNav: h.includePagesInNav !== false,
    showDefaultBlogLink: h.showDefaultBlogLink !== false,
    blogLabel: text(h.blogLinkLabel, defaultBlogLabel),
    headerStyle: h.headerStyle === 'centered' ? 'centered' : 'standard',
    navAlignment: h.navAlignment === 'center' || h.navAlignment === 'right' ? h.navAlignment : 'left',
  };
}

/** Class + style for a logo `<img>`: the legacy 40px-high cap until the retailer sets a width, then their width
 *  (separate on mobile), never wider than its container and never distorted. */
export function logoImageProps(opts: Pick<HeaderOptions, 'logoWidth' | 'mobileLogoWidth'>): { className: string; style?: CSSProperties } {
  if (opts.logoWidth === null && opts.mobileLogoWidth === null) {
    return { className: 'max-h-10 max-w-[180px] object-contain' };
  }
  const desktop = opts.logoWidth ?? 180;
  const mobile = opts.mobileLogoWidth ?? Math.min(desktop, 180);
  return {
    className: 'h-auto max-w-full object-contain w-[var(--logo-w-m)] lg:w-[var(--logo-w)]',
    style: { '--logo-w': `${desktop}px`, '--logo-w-m': `${mobile}px` } as CSSProperties,
  };
}

export interface FooterOptions {
  logoSource: 'none' | 'store' | 'custom';
  logoUrl: string | null;
  logoWidth: number;
  showNewsletter: boolean;
  newsletterHeading: string | null;
  newsletterText: string | null;
  showDefaultColumns: boolean;
  shopColumnHeading: string;
  accountColumnHeading: string;
  blogLabel: string;
}

export function readFooterOptions(footer: Partial<StorefrontFooter> | null | undefined, defaultBlogLabel: string): FooterOptions {
  const f = footer ?? {};
  const optional = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    logoSource: f.logoSource === 'store' || f.logoSource === 'custom' ? f.logoSource : 'none',
    logoUrl: optional(f.logoUrl),
    logoWidth: width(f.logoWidth, 40, 400) ?? 140,
    showNewsletter: f.showNewsletter !== false,
    newsletterHeading: optional(f.newsletterHeading),
    newsletterText: optional(f.newsletterText),
    showDefaultColumns: f.showDefaultColumns !== false,
    shopColumnHeading: text(f.shopColumnHeading, 'Shop'),
    accountColumnHeading: text(f.accountColumnHeading, 'Account'),
    blogLabel: text(f.blogLinkLabel, defaultBlogLabel),
  };
}

/** `{year}` in the copyright text becomes the current year. */
export function expandCopyright(textValue: string, now = new Date()): string {
  return textValue.replace(/\{year\}/gi, String(now.getFullYear()));
}
