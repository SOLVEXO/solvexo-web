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
  headerStyle: 'standard' | 'centered' | 'split' | 'inline';
  navAlignment: 'left' | 'center' | 'right';
  /** Where the logo sits and whether the menu shares its row or gets its own row below. */
  logoPosition: 'left' | 'center' | 'right';
  menuPosition: 'beside' | 'below';
  bgColor: string | null;
  textColor: string | null;
  /** px added to the theme's own header padding (compact < 0). */
  paddingDelta: number;
  showDivider: boolean;
  stickyMode: 'off' | 'always' | 'scroll-up';
  transparentOnHome: boolean;
  transparentTextColor: string;
  navFontSize: 'sm' | 'md' | 'lg';
  navUppercase: boolean;
  navHoverStyle: 'none' | 'underline' | 'pill';
  searchStyle: 'icon' | 'bar';
  /** Theme-defined slug (default 'icons'); each theme interprets the ones it offers. */
  searchPosition: string;
  cta: { label: string; link: string } | null;
  topBar: { text: string | null; phone: string | null; email: string | null; bg: string | null; color: string | null } | null;
}

const SAFE_LINK = /^(https?:\/\/\S+|\/(?!\/)\S*)$/i;
const NAV_FONT_PX = { sm: 13, md: 14, lg: 16 } as const;

/** Scoped CSS for the retailer's menu typography + hover effect (inline theme styles need !important). */
export function headerNavCss(scope: string, o: Pick<HeaderOptions, 'navFontSize' | 'navUppercase' | 'navHoverStyle'>): string {
  const rules: string[] = [];
  if (o.navFontSize !== 'md') rules.push(`[data-sx-header="${scope}"] nav a{font-size:${NAV_FONT_PX[o.navFontSize]}px!important}`);
  if (o.navUppercase) rules.push(`[data-sx-header="${scope}"] nav a{text-transform:uppercase;letter-spacing:.06em}`);
  if (o.navHoverStyle === 'underline') {
    rules.push(`[data-sx-header="${scope}"] nav a{background-image:linear-gradient(currentColor,currentColor);background-size:0 1.5px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .25s ease;padding-bottom:2px}`);
    rules.push(`[data-sx-header="${scope}"] nav a:hover,[data-sx-header="${scope}"] nav a:focus-visible{background-size:100% 1.5px}`);
  }
  if (o.navHoverStyle === 'pill') {
    rules.push(`[data-sx-header="${scope}"] nav a{padding:6px 12px;border-radius:999px;transition:background-color .2s ease}`);
    rules.push(`[data-sx-header="${scope}"] nav a:hover,[data-sx-header="${scope}"] nav a:focus-visible{background-color:color-mix(in srgb,currentColor 10%,transparent)}`);
  }
  return rules.join('');
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
  const legacy = h.headerStyle === 'centered' || h.headerStyle === 'split' || h.headerStyle === 'inline' ? h.headerStyle : 'standard';
  const explicit = h.logoPosition != null || h.menuPosition != null;
  const rawAlign = h.navAlignment === 'center' || h.navAlignment === 'right' ? h.navAlignment : 'left';
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
    headerStyle: h.headerStyle === 'centered' || h.headerStyle === 'split' || h.headerStyle === 'inline' ? h.headerStyle : 'standard',
    navAlignment: explicit || legacy === 'centered' ? rawAlign : legacy === 'inline' ? 'center' : 'left',
    logoPosition: h.logoPosition === 'left' || h.logoPosition === 'center' || h.logoPosition === 'right' ? h.logoPosition : legacy === 'centered' || legacy === 'split' ? 'center' : 'left',
    menuPosition: h.menuPosition === 'beside' || h.menuPosition === 'below' ? h.menuPosition : legacy === 'centered' ? 'below' : 'beside',
    bgColor: hex(h.bgColor),
    textColor: hex(h.textColor),
    paddingDelta: HEADER_PADDING[h.paddingY === 'compact' || h.paddingY === 'spacious' ? h.paddingY : 'normal'],
    showDivider: h.showDivider !== false,
    stickyMode: h.stickyMode === 'off' || h.stickyMode === 'always' || h.stickyMode === 'scroll-up' ? h.stickyMode : h.sticky === true ? 'always' : 'off',
    transparentOnHome: h.transparentOnHome === true,
    transparentTextColor: hex(h.transparentTextColor) ?? '#ffffff',
    navFontSize: h.navFontSize === 'sm' || h.navFontSize === 'lg' ? h.navFontSize : 'md',
    navUppercase: h.navUppercase === true,
    navHoverStyle: h.navHoverStyle === 'underline' || h.navHoverStyle === 'pill' ? h.navHoverStyle : 'none',
    searchStyle: h.searchStyle === 'bar' ? 'bar' : 'icon',
    searchPosition: typeof h.searchPosition === 'string' && /^[a-z][a-z0-9_-]{0,31}$/.test(h.searchPosition) ? h.searchPosition : 'icons',
    cta: typeof h.ctaLabel === 'string' && h.ctaLabel.trim() && typeof h.ctaLink === 'string' && SAFE_LINK.test(h.ctaLink)
      ? { label: h.ctaLabel.trim(), link: h.ctaLink } : null,
    topBar: h.topBarEnabled && (h.topBarText || h.topBarPhone || h.topBarEmail)
      ? { text: h.topBarText?.trim() || null, phone: h.topBarPhone?.trim() || null, email: h.topBarEmail?.trim() || null, bg: hex(h.topBarBg), color: hex(h.topBarTextColor) }
      : null,
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
  /** Top/bottom padding of the column area in px (columns layout / compact layout). */
  padding: { columns: number; compact: number };
  bgImageUrl: string | null;
  bgOverlay: number;
  align: 'left' | 'center';
  headingUppercase: boolean;
  socialStyle: 'plain' | 'circle' | 'square' | null;
  /** null = the theme's own colour. */
  socialColor: 'brand' | 'custom' | null;
  socialCustomColor: string | null;
  socialFilled: boolean;
  /** Width and height of one social icon button in px; null = the theme's own size. */
  socialSize: number | null;
  newsletterTop: boolean;
  mobileAccordion: boolean;
  showPolicyLinks: boolean;
  showCurrency: boolean;
  showBackToTop: boolean;
}

const FOOTER_PADDING = { compact: { columns: 32, compact: 22 }, normal: { columns: 56, compact: 32 }, spacious: { columns: 80, compact: 48 } } as const;

/** Flex sizing for a footer column block's `width` setting (auto = share the row). */
export function footerColumnFlex(width: unknown): string {
  switch (width) {
    case 'quarter': return '0 0 calc(25% - 30px)';
    case 'third': return '0 0 calc(33.333% - 27px)';
    case 'half': return '0 0 calc(50% - 20px)';
    case 'full': return '0 0 100%';
    default: return '1 1 180px';
  }
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
    padding: FOOTER_PADDING[f.paddingY === 'compact' || f.paddingY === 'spacious' ? f.paddingY : 'normal'],
    bgImageUrl: typeof f.bgImageUrl === 'string' && /^https:\/\//i.test(f.bgImageUrl) ? f.bgImageUrl : null,
    bgOverlay: typeof f.bgOverlay === 'number' && Number.isFinite(f.bgOverlay) ? Math.min(85, Math.max(0, f.bgOverlay)) : 50,
    align: f.align === 'center' ? 'center' : 'left',
    headingUppercase: f.headingUppercase !== false,
    socialStyle: f.socialStyle === 'plain' || f.socialStyle === 'circle' || f.socialStyle === 'square' ? f.socialStyle : null,
    socialColor: f.socialColor === 'brand' || f.socialColor === 'custom' ? f.socialColor : null,
    socialCustomColor: hex(f.socialCustomColor),
    socialFilled: f.socialFilled === true,
    socialSize: width(f.socialSize, 24, 72),
    newsletterTop: f.newsletterTop === true,
    mobileAccordion: f.mobileAccordion !== false,
    showPolicyLinks: f.showPolicyLinks !== false,
    showCurrency: f.showCurrency === true,
    showBackToTop: f.showBackToTop === true,
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

/** Footer blocks that are visible on the storefront, in the retailer's order. */
export function visibleFooterBlocks(footer: Partial<StorefrontFooter> | null | undefined): Block[] {
  return footerLayoutBlocks(footer).filter(b => b.enabled !== false);
}

/** `{year}` in the copyright text becomes the current year. */
export function expandCopyright(textValue: string, now = new Date()): string {
  return textValue.replace(/\{year\}/gi, String(now.getFullYear()));
}
