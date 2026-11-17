const HEX = /^#[0-9a-fA-F]{6}$/;

/** A valid #RRGGBB from a theme setting, else null (= "use the theme's own accent"). */
export function badgeThemeColor(v: unknown): string | null {
  return typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : null;
}

function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] < 0.5 ? '#FFFFFF' : '#111111';
}

/** The colours a product's badge gets when the seller did not pick one on the product: the theme's "Product badge colour"
 *  setting (any colour, with a readable text colour), else the theme's accent. */
export function badgeAccent(themeColor: string | null | undefined, accent: { bg: string; ink: string }): { bg: string; ink: string } {
  const c = badgeThemeColor(themeColor);
  return c ? { bg: c, ink: inkOn(c) } : accent;
}
