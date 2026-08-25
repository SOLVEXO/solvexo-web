import type { StorefrontColors, ThemeHeaderStyle, ThemeFooterStyle } from '@/api/services/storeTheme';

export type ThemeCategory = 'fashion' | 'beauty' | 'food' | 'lifestyle' | 'luxury' | 'electronics' | 'general';
export type ThemeBadge    = 'new' | 'popular' | 'trending';

export interface ThemeDefinition {
  id:          string;
  name:        string;
  description: string;
  /** Used for the Filters chip row and the Recommended strip's heuristic. */
  category:    ThemeCategory;
  /** Sparingly assigned — most themes have none. */
  badge?:      ThemeBadge;
  /** Short trait chips shown in the Preview modal header, e.g.
   *  "Split Hero · Editorial Type · Minimal Cards". */
  characteristics: string[];
  /** Every one of the `theme`-level fields, always complete — enforced by
   *  this type (no `Partial<>`), never just a color recolor. */
  colors:      StorefrontColors;
  headerStyle: ThemeHeaderStyle;
  footerStyle: ThemeFooterStyle;
}

export interface DemoProduct {
  name:  string;
  price: number;
  image: string;
  badge?: string;
}

export interface ThemeDemoContent {
  storeName:      string;
  heroHeadline:   string;
  heroSubheading: string;
  heroCta:        string;
  heroImage:      string;
  products:       [DemoProduct, DemoProduct, DemoProduct];
  testimonial: {
    quote:      string;
    authorName: string;
    authorRole: string;
    rating:     number;
  };
  /** Feeds a theme's own `templates.home` sections that need more than the
   *  fields above (editorial/story/craft/spec/countdown sections, FAQ, trust
   *  badges) — every field here is optional since not every theme's home
   *  template uses every kind of extra section. Purely static/presentational
   *  content only (no live commerce data, no user-submitted forms) since
   *  this feeds an isolated demo render with no real backing store. */
  extras?: {
    story?: { heading: string; body: string; imageUrl: string; ctaText?: string };
    faqs?: { question: string; answer: string }[];
    trustBadges?: { icon: string; text: string }[];
    lookbook?: { imageUrl: string; caption: string }[];
    processSteps?: { title: string; body: string }[];
    specs?: { label: string; value: string }[];
    dropDate?: string;
  };
}

/** A theme's own module always exports both halves together — its real
 *  design-system definition (colors/typography/layout) AND its own gallery
 *  demo content — so the two can never drift out of sync the way two
 *  parallel `Record<themeId, …>` maps could. */
/** One entry in a theme's default HOME template composition — real section
 *  types from the shared open registry (`sectionRenderRegistry`), rendered
 *  through the SAME renderer the real storefront uses (see
 *  `ThemeDemoStorefront.tsx`). Scoped to sections that need only static
 *  settings/blocks (no live product/category data, no user-submitted forms)
 *  — a demo has no real backing store to fetch from or submit to. This is
 *  what makes two themes' home pages genuinely structurally different, not
 *  just recolored: the section TYPES and ORDER vary per theme, not only the
 *  tokens applied to a fixed sequence. */
export interface DemoSectionInstance {
  type: string;
  settings?: Record<string, unknown>;
  blocks?: { type: string; settings: Record<string, unknown> }[];
}

export interface ThemeTemplates {
  /** Rendered AFTER the fixed Hero + product grid, BEFORE Testimonials/Footer — see `ThemeDemoStorefront`. Empty is valid (a spare, minimal theme). */
  home: DemoSectionInstance[];
  /** Seeded onto a store's Collection Template (`resourceType:'collection'`, `templateKey:'default'`) draft when a seller opts into "apply starter content" on Theme Library activation — see `ThemeLibraryPage.tsx`/`themeTemplateToSections.ts`. Rendered AFTER the required `collection_product_grid` anchor section, never in place of it (that section is structural, not part of a theme's own template data). Optional — a theme with none simply seeds the grid alone, same as the pre-existing default starter. */
  collection?: DemoSectionInstance[];
  /** Seeded onto a store's Product Template (`resourceType:'product'`, `templateKey:'default'`) draft the same way — surrounding content only (the commerce-critical gallery/variant/add-to-cart core is fixed chrome outside this system, see `StorefrontProductPage`). Optional — a theme with none seeds an empty product template, unchanged from today's default. */
  product?: DemoSectionInstance[];
}

/** A theme's own module always exports its real design-system definition
 *  (colors/typography/layout), its own gallery demo content, AND its own
 *  default home template composition together, so all three can never drift
 *  out of sync the way parallel `Record<themeId, …>` maps could. */
export interface ThemeModule {
  definition:  ThemeDefinition;
  demoContent: ThemeDemoContent;
  templates:   ThemeTemplates;
}

/** Static, local demo content for the Theme Gallery — deliberately NOT
 *  fetched from any backend API (the gallery renders up to 12+ cards at
 *  once, and each would otherwise need its own real product/store query).
 *  Images are served from Lorem Picsum's stable id-based CDN — chosen
 *  because no product-photo search/generation tool is available in this
 *  environment. Each theme reserves its own block of 4 ids (hero + 3
 *  products) so nothing repeats within one card. */
export function img(id: number, w = 900, h = 900) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}
