import type { StoreThemeData } from '@/api/services/storeTheme';

/**
 * Headless helper for each theme's own boot skeleton: the seller's real page colours (so the skeleton is already in the
 * store's palette, not a grey placeholder) with the theme's own defaults when the seller never changed them.
 */
export interface BootPalette { bg: string; ink: string; accent: string; /** Soft block colour that reads on `bg`. */ block: string; line: string }

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const pick = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : fallback);

export function bootPalette(theme: StoreThemeData | null | undefined, defaults: { bg: string; ink: string; accent: string }): BootPalette {
  const bg = pick(theme?.theme?.bgColor, defaults.bg);
  const ink = pick(theme?.theme?.textColor, defaults.ink);
  const accent = pick(theme?.theme?.primaryColor, defaults.accent);
  return {
    bg,
    ink,
    accent,
    block: `color-mix(in srgb, ${ink} 8%, ${bg})`,
    line: `color-mix(in srgb, ${ink} 12%, ${bg})`,
  };
}

/** Props every theme's `BootSkeleton` receives. `theme` is null on a first visit that has no cached snapshot. */
export interface BootSkeletonProps { theme: StoreThemeData | null }
