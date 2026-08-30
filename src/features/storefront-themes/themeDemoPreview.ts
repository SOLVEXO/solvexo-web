import type { ComponentType } from 'react';
import type { Section } from '@/api/services/storefrontTypes';

/**
 * Generic "Theme Library preview" registry — mirrors the exact same
 * self-registration pattern as `themeManifest.ts`/`themeDevFiles.ts`/
 * `themePreviewComponents.ts`, scoped to one more concern: a fully static,
 * genuinely complete-looking demo of a theme, usable for a theme that isn't
 * installed yet (or is installed but not active) — no real store/product
 * data required at all.
 *
 * WHY THIS EXISTS (the bug it fixes): before this, the only way to preview
 * a candidate (installed-but-inactive) theme was to render the STORE'S REAL
 * saved Home sections through the candidate theme's own `SectionRenderer`
 * (see `AtelierLivePreview`'s `themeIdOverride`). That looks fine only when
 * the two themes happen to implement the exact same section types — but
 * every theme discloses its own real, honest subset of the shared section
 * vocabulary (see e.g. `theme-02-nova/sections/index.ts`'s own "DISCLOSED
 * SCOPE" comment), and an unregistered section type is silently skipped, not
 * rendered as a placeholder. So a store whose real, active theme uses a
 * section type a candidate theme hasn't implemented would render a
 * genuinely INCOMPLETE-looking preview for that candidate — sections would
 * just be missing, not a screenshot-accurate "here's what this theme really
 * looks like". That's a real, reported "ajeeb"/broken-looking preview, not
 * a cosmetic nitpick.
 *
 * The fix: every theme supplies its OWN static demo content, built only
 * from section types that theme itself actually renders (see each theme's
 * own `demo/*DemoData.ts`) — so a preview always looks like a complete,
 * finished theme, regardless of which theme is being compared against which,
 * and regardless of whether the seller has installed or configured
 * anything yet. This is what Shopify's own theme-preview does too: a
 * not-yet-published theme previews with its own default/demo content, not a
 * reinterpretation of another theme's saved configuration.
 */

export interface ThemeVisualConfig {
  colors: { bg: string; ink: string; border: string };
  fonts: { display: string; body: string };
  layout: { maxWidth: string; containerPadX: string };
  buttonRadiusPx: string;
}

export interface ThemeDemoPreviewData {
  id: string;
  name: string;
  demoStore: { name: string; tagline: string; description: string };
  demoSections: Section[];
  SectionRenderer: ComponentType<{ sections: Section[] }>;
  /** A theme's own `theme.config.ts` export satisfies this generically —
   *  every theme deliberately mirrors the same shape (see
   *  `theme-02-nova/theme.config.ts`'s own doc comment on why) — so this is
   *  never hand-picked per theme, just passed straight through. */
  theme: ThemeVisualConfig;
}

export const THEME_DEMO_PREVIEWS: Record<string, ThemeDemoPreviewData> = {};

export function registerThemeDemoPreview(data: ThemeDemoPreviewData) {
  THEME_DEMO_PREVIEWS[data.id] = data;
}

export function getThemeDemoPreview(themeId: string): ThemeDemoPreviewData | undefined {
  return THEME_DEMO_PREVIEWS[themeId];
}
