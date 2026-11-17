import type { CSSProperties } from 'react';
import { ts } from '@/utils/tStatic';

/** What the small line above a product's name shows. 'vendor' is the original behaviour (kept as the default). */
export type CardInfoLine = 'vendor' | 'category' | 'subcategory' | 'subcategory_category' | 'category_subcategory';
export type CardBadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const CARD_INFO_LINES: readonly CardInfoLine[] = ['vendor', 'category', 'subcategory', 'subcategory_category', 'category_subcategory'];
export const CARD_BADGE_POSITIONS: readonly CardBadgePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export const asCardInfoLine = (v: unknown): CardInfoLine => (CARD_INFO_LINES as readonly string[]).includes(v as string) ? (v as CardInfoLine) : 'vendor';
export const asCardBadgePosition = (v: unknown): CardBadgePosition => (CARD_BADGE_POSITIONS as readonly string[]).includes(v as string) ? (v as CardBadgePosition) : 'top-left';

interface CardProduct {
  createdAt?: string | Date; purchaseCount?: number;
  vendor?: string; categoryName?: string; subCategoryName?: string; cardBadgeText?: string; cardBadgeColor?: string;
}

/** The text of the card's info line for a product, or '' when there is nothing to show. */
export function cardInfoText(p: CardProduct, mode: CardInfoLine): string {
  const cat = (p.categoryName ?? '').trim();
  const sub = (p.subCategoryName ?? '').trim();
  switch (mode) {
    case 'category': return cat;
    case 'subcategory': return sub;
    case 'subcategory_category': return [sub, cat].filter(Boolean).join(' · ');
    case 'category_subcategory': return [cat, sub].filter(Boolean).join(' · ');
    default: return (p.vendor ?? '').trim();
  }
}

const PRESETS: Record<string, { bg: string; ink: string }> = {
  dark: { bg: '#111827', ink: '#FFFFFF' },
  green: { bg: '#15803D', ink: '#FFFFFF' },
  red: { bg: '#DC2626', ink: '#FFFFFF' },
  blue: { bg: '#2563EB', ink: '#FFFFFF' },
  amber: { bg: '#F59E0B', ink: '#111111' },
};

function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] < 0.5 ? '#FFFFFF' : '#111111';
}

/** The seller's own badge for this product, with colours resolved (a preset name, a #RRGGBB, or the theme accent). Null = no badge. */
/** The store's automatic card badges ("New" for fresh products, "Best seller" for popular ones). 0 = off. Set from the theme settings. */
const auto = { newDays: 0, bestMin: 0 };
export function setAutoCardBadges(c: Record<string, unknown> | null | undefined): void {
  const days = Number(c?.autoBadgeNew); const min = Number(c?.autoBadgeBest);
  auto.newDays = Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 0;
  auto.bestMin = Number.isFinite(min) && min > 0 ? min : 0;
}
function autoBadgeText(p: CardProduct): { text: string; preset: string } | null {
  if (auto.newDays > 0 && p.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (Number.isFinite(t) && Date.now() - t >= 0 && Date.now() - t <= auto.newDays * 86_400_000) return { text: ts('card.badgeNew', 'New'), preset: 'green' };
  }
  if (auto.bestMin > 0 && typeof p.purchaseCount === 'number' && p.purchaseCount >= auto.bestMin) return { text: ts('card.badgeBest', 'Best seller'), preset: 'amber' };
  return null;
}

export function cardBadgeOf(p: CardProduct, accent: { bg: string; ink: string }): { text: string; bg: string; ink: string } | null {
  const text = (p.cardBadgeText ?? '').trim();
  if (!text) {
    const a = autoBadgeText(p);
    return a ? { text: a.text, ...PRESETS[a.preset] } : null;
  }
  const c = (p.cardBadgeColor ?? '').trim();
  if (PRESETS[c]) return { text, ...PRESETS[c] };
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return { text, bg: c, ink: inkOn(c) };
  return { text, ...accent };
}

/** Absolute-position style for the custom badge. `topExtra` pushes a top badge down past other badges / the wishlist heart. */
export function cardBadgeBox(pos: CardBadgePosition, inset: number, topExtra = 0): CSSProperties {
  const top = pos.startsWith('top');
  const left = pos.endsWith('left');
  return { position: 'absolute', zIndex: 2, pointerEvents: 'none', [top ? 'top' : 'bottom']: inset + (top ? topExtra : 0), [left ? 'left' : 'right']: inset };
}
