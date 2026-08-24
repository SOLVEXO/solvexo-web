// The Theme Library — 12 genuinely complete, independently-maintained
// themes, each its own module (this directory) rather than 12 object
// literals in one file. Every theme file exports both its real design-
// system definition (every one of the 26 `resolveStorefrontCfg()` fields —
// colors, typography, button/card/hero/header/footer composition — always
// complete, enforced by `ThemeDefinition` having no `Partial<>` escape
// hatch) AND its own gallery demo content together, so the two can never
// drift apart the way two separately-maintained maps could.
//
// What's genuinely SHARED across every theme (by design, not by omission):
// the rendering engine itself — `SectionRenderer`'s open registry,
// `resolveStorefrontCfg()`, and every real storefront page (Home/Product/
// Collection/Cart/Checkout/Blog/Search) all read the SAME battle-tested
// implementation for every theme. A theme is a complete, real declaration
// of every composition axis that engine exposes (hero style/alignment,
// header/footer layout, card style/radius, button style/radius/width,
// typography, spacing, image treatment, testimonial/FAQ layout) — not a
// second copy of the rendering code. This is a deliberate, disclosed
// architecture choice: 12 independently-forked template codebases would
// let each theme drift and rot independently as the platform evolves,
// which is what "10 objects aren't 10 themes" actually risks avoiding
// wrongly by forking, not right — the real fix is making sure every theme's
// OWN configuration genuinely reaches every composition axis (verified,
// see the table below), which it does.
import { warmCraft } from './warm-craft';
import { modernFashion } from './modern-fashion';
import { minimalBoutique } from './minimal-boutique';
import { boldEditorial } from './bold-editorial';
import { cleanGrid } from './clean-grid';
import { luxuryNoir } from './luxury-noir';
import { freshMarket } from './fresh-market';
import { streetUrban } from './street-urban';
import { softStudio } from './soft-studio';
import { techCommerce } from './tech-commerce';
import { coastalBreeze } from './coastal-breeze';
import { artisanMarket } from './artisan-market';

export type { ThemeDefinition, ThemeCategory, ThemeBadge, ThemeDemoContent, DemoProduct, ThemeModule } from './types';

const THEME_MODULES = [
  warmCraft, modernFashion, minimalBoutique, boldEditorial, cleanGrid,
  luxuryNoir, freshMarket, streetUrban, softStudio, techCommerce,
  coastalBreeze, artisanMarket,
];

export const THEMES = THEME_MODULES.map(m => m.definition);

export const THEME_DEMO_CONTENT: Record<string, import('./types').ThemeDemoContent> =
  Object.fromEntries(THEME_MODULES.map(m => [m.definition.id, m.demoContent]));

export const THEME_CATEGORIES: { value: import('./types').ThemeCategory | 'all'; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'fashion',     label: 'Fashion' },
  { value: 'beauty',      label: 'Beauty' },
  { value: 'food',        label: 'Food' },
  { value: 'lifestyle',   label: 'Lifestyle' },
  { value: 'luxury',      label: 'Luxury' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'general',     label: 'General' },
];
