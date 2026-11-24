import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';

export interface ViewAllLink { label: string; to?: string; href?: string; newTab: boolean }

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

/** The "View all" link of a product section, driven ONLY by the seller's settings (headless, every theme uses it):
 *  `showViewAll` (default on, so older stores look the same), `viewAllLabel` (blank = the theme's word),
 *  `viewAllLink` (blank = the section's own page, e.g. its collection). Returns null when the seller switched it off. */
export function useViewAll(settings: Record<string, unknown> | undefined, defaultLabel: string, defaultTo: string): ViewAllLink | null {
  const { resolveLink } = useStorefront();
  const s = settings ?? {};
  if (s.showViewAll === false) return null;
  const label = str(s.viewAllLabel) || str(s.linkLabel) || defaultLabel;
  const link = s.viewAllLink && typeof s.viewAllLink === 'object' ? (s.viewAllLink as StorefrontLinkSettings) : null;
  const custom = link ? resolveLink(link) : null;
  if (custom && (custom.to || custom.href)) return { label, to: custom.to, href: custom.href, newTab: !!custom.newTab };
  return { label, to: defaultTo, newTab: false };
}
