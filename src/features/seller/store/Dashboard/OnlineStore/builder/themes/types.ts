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
}

/** A theme's own module always exports both halves together — its real
 *  design-system definition (colors/typography/layout) AND its own gallery
 *  demo content — so the two can never drift out of sync the way two
 *  parallel `Record<themeId, …>` maps could. */
export interface ThemeModule {
  definition:  ThemeDefinition;
  demoContent: ThemeDemoContent;
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
