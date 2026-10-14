import type { CSSProperties } from 'react';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';
import type { Block } from '@/api/services/storefrontTypes';

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
  bgColor: string | null;
  textColor: string | null;
  /** px added to the theme's own header padding (compact < 0). */
  paddingDelta: number;
  showDivider: boolean;
}

const text = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
const HEADER_PADDING = { compact: -6, normal: 0, spacious: 10 } as const;

/** Muted shade of a retailer text colour, for secondary text on the same background. */
export function mutedOf(color: string, percent = 68): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
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
    bgColor: hex(h.bgColor),
    textColor: hex(h.textColor),
    paddingDelta: HEADER_PADDING[h.paddingY === 'compact' || h.paddingY === 'spacious' ? h.paddingY : 'normal'],
    showDivider: h.showDivider !== false,
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
  bgColor: string | null;
  textColor: string | null;
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
    bgColor: hex(f.bgColor),
    textColor: hex(f.textColor),
  };
}

/** Footer block types that each render as their own column, in the retailer's order. */
export const FOOTER_COLUMN_TYPES = ['footer_brand', 'footer_column', 'footer_text', 'footer_contact', 'footer_newsletter', 'footer_image'];

/**
 * The footer's blocks in display order. A footer saved before brand/newsletter became blocks is converted on
 * the fly to the exact look it always had (brand column with the about text, columns, contact, newsletter), so
 * the editor and both themes read one list and the first edit saves it in the new shape.
 */
export function footerLayoutBlocks(footer: Partial<StorefrontFooter> | null | undefined): Block[] {
  const blocks = footer?.blocks ?? [];
  if (footer?.blockLayout) return blocks;
  const about = blocks.find(b => b.type === 'footer_text' && b.enabled !== false);
  const rest = blocks.filter(b => b.type !== 'footer_text');
  const columns = rest.filter(b => b.type === 'footer_column');
  const others = rest.filter(b => b.type !== 'footer_column');
  return [
    { type: 'footer_brand', settings: { text: about?.settings.text ?? '', showTagline: true, showSocial: true } },
    ...columns,
    ...others,
    ...(footer?.showNewsletter === false ? [] : [{ type: 'footer_newsletter', settings: { heading: footer?.newsletterHeading ?? '', text: footer?.newsletterText ?? '' } }]),
  ];
}

/** `{year}` in the copyright text becomes the current year. */
export function expandCopyright(textValue: string, now = new Date()): string {
  return textValue.replace(/\{year\}/gi, String(now.getFullYear()));
}
