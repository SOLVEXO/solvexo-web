import type { ComponentType } from 'react';
import type { Section, SectionType } from '@/api/services/storefrontTypes';
import type { StorefrontColors } from '@/api/services/storeTheme';

/**
 * The Theme Preview Components contract — closes a real gap found during
 * Theme B (Nova)'s build: `AtelierLivePreview.tsx` (the live preview panel
 * shared by the Customize page and the Header & Footer page) imported
 * Atelier's `AtelierSectionRenderer`/`AtelierNavbar`/`AtelierFooter`/
 * `theme.config` directly, by name. That means BEFORE this file existed, a
 * store running Nova (or any second theme) would still see an ATELIER-
 * rendered preview while editing — the one place a merchant checks "does my
 * change look right" would have silently lied to them the moment a second
 * theme existed. This is the same shape of bug the reusability requirement
 * exists to catch, just in a surface Phase 4/5 didn't touch (those covered
 * Customize/Theme-Settings/Edit-Code's own chrome, not the live-preview
 * panel embedded inside them).
 *
 * Same pattern as `themeManifest.ts`/`themeDevFiles.ts`: each theme
 * registers its own real components once (see `theme-01-atelier/theme.preview.ts`,
 * `theme-02-nova/theme.preview.ts`), and the ONE preview component (still
 * named/exported as `AtelierLivePreview` — see that file for why the name
 * stayed) resolves the active store's real theme against this registry
 * instead of importing one theme's pieces directly.
 */
export interface ThemePreviewComponents {
  /** Matches this theme's `NEW_THEME_REGISTRY` key. */
  id: string;
  /** The theme's own section renderer — same `{ sections, selectable?,
   *  selectedSectionId?, onSelectSection? }` contract every theme's section
   *  renderer already shares (`AtelierSectionRenderer`/`NovaSectionRenderer`). */
  SectionRenderer: ComponentType<{
    sections: Section[];
    selectable?: boolean;
    selectedSectionId?: string | null;
    onSelectSection?: (sectionId: string) => void;
  }>;
  Navbar: ComponentType;
  Footer: ComponentType;
  /** The theme's own mutable theme singleton (`atelierTheme`/`novaTheme`) —
   *  only the two fields the preview wrapper itself needs to style around
   *  the embedded chrome are typed here; each theme's real object has more
   *  fields than this, which is fine, this is a structural (not exact)
   *  match. */
  theme: { colors: { bg: string }; fonts: { body: string } };
  /** The theme's own `applyMerchantThemeOverrides` — mutates `theme` above
   *  in place from a real, published-or-draft `StorefrontColors` subset,
   *  exactly like the real storefront layout calls it before rendering. */
  applyMerchantThemeOverrides: (colors: Partial<StorefrontColors> | null | undefined) => void;
  /**
   * Every section `type` this theme's own `SectionRenderer` actually has a
   * render function registered for (`Array.from(registry.keys())` inside
   * `atelierSectionRenderer.tsx`/`novaSectionRenderer.tsx`) — closes a real
   * gap found the same day this was written: `AddSectionModal` listed EVERY
   * type in the shared, theme-agnostic `SECTION_META` catalogue (Hero, Video,
   * Drop Countdown, …) with no regard for which theme was actually active.
   * A Nova store could "successfully" add a Video or Drop Countdown section
   * — types Nova's own renderer has never registered — and it would render
   * as nothing at all, silently, both in the live preview and on the real
   * published storefront, with no error anywhere. `AddSectionModal` now
   * filters its picker against this list (see that file), so a merchant is
   * only ever offered section types their theme can actually render.
   * Optional so a theme that hasn't registered this yet degrades to "show
   * every catalogue type" rather than hiding all of them. */
  supportedSectionTypes?: SectionType[];
}

export const THEME_PREVIEW_COMPONENTS: Record<string, ThemePreviewComponents> = {};

export function registerThemePreviewComponents(components: ThemePreviewComponents) {
  THEME_PREVIEW_COMPONENTS[components.id] = components;
}

export function getThemePreviewComponents(themeDefinitionId: string | null | undefined, fallbackId: string): ThemePreviewComponents {
  return (themeDefinitionId && THEME_PREVIEW_COMPONENTS[themeDefinitionId]) || THEME_PREVIEW_COMPONENTS[fallbackId];
}
