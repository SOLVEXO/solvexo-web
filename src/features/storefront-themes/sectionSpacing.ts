import type { CSSProperties } from 'react';

/** Shared section-wrapper behaviour for every theme (Shopify's per-section
 *  "Section settings" that every section gets):
 *  - Space above/below REPLACES the section's own top/bottom padding (the
 *    wrapper gets the seller's value; these rules zero the section's outer
 *    padding on that side, also through the editor's block hit-target).
 *  - Show on: all / desktop only / mobile only (749px breakpoint, like Shopify).
 *  - Full width: lifts the section's centred content box to the full width.
 *  - Background image (+ dark overlay) behind the section.
 *  - Anchor id, so a link to `#id` scrolls to it.
 *  - Custom CSS scoped to this one section (native CSS nesting).
 *  Every option is optional; unset = the theme's own look. */
export const SECTION_SPACING_CSS =
  // (a section's own <style> may come first, so also match the element after it)
  '.sx-sp-t>:first-child,.sx-sp-t>style:first-child+*,.sx-sp-t>[data-editor-block-id]:first-child>:first-child,.sx-sp-t>style:first-child+[data-editor-block-id]>:first-child{padding-top:0!important}' +
  '.sx-sp-b>:last-child,.sx-sp-b>[data-editor-block-id]:last-child>:last-child{padding-bottom:0!important}' +
  '.sx-full>*>.mx-auto,.sx-full>.mx-auto,.sx-full>[data-editor-block-id]>*>.mx-auto{max-width:none!important}' +
  '@media (max-width:749px){.sx-hide-m{display:none!important}}' +
  '@media (min-width:750px){.sx-hide-d{display:none!important}}';

export function sectionSpacing(settings: Record<string, unknown> | undefined): { className: string; style: CSSProperties } {
  const top = typeof settings?.spacingTop === 'number' ? settings.spacingTop : undefined;
  const bottom = typeof settings?.spacingBottom === 'number' ? settings.spacingBottom : undefined;
  const visibility = settings?.visibility;
  const bgImage = typeof settings?.backgroundImageUrl === 'string' && /^https:\/\//i.test(settings.backgroundImageUrl)
    ? settings.backgroundImageUrl.replace(/["\\\n\r()]/g, '')
    : null;
  const overlay = typeof settings?.backgroundOverlay === 'number' ? Math.min(80, Math.max(0, settings.backgroundOverlay)) / 100 : 0;
  return {
    className: [
      top !== undefined ? 'sx-sp-t' : '',
      bottom !== undefined ? 'sx-sp-b' : '',
      settings?.fullWidth === true ? 'sx-full' : '',
      visibility === 'desktop' ? 'sx-hide-m' : visibility === 'mobile' ? 'sx-hide-d' : '',
    ].filter(Boolean).join(' '),
    style: {
      paddingTop: top,
      paddingBottom: bottom,
      ...(bgImage ? {
        backgroundImage: `${overlay > 0 ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),` : ''}url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}),
    },
  };
}

/** `id` for the wrapper: the seller's anchor (letters, numbers, - and _). */
export function sectionAnchorId(settings: Record<string, unknown> | undefined): string | undefined {
  const raw = typeof settings?.anchorId === 'string' ? settings.anchorId.trim() : '';
  const clean = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  return clean || undefined;
}

/** The section's own CSS, scoped to it with native CSS nesting. Plain
 *  declarations style the section itself; nested rules (`h2 { … }`) its content. */
export function sectionScopedCss(settings: Record<string, unknown> | undefined, scopeKey: string): string | null {
  const css = typeof settings?.customCss === 'string' ? settings.customCss.trim() : '';
  if (!css) return null;
  // `<` can never be valid here and is the only way out of a <style> tag.
  const safe = css.replace(/</g, '');
  return `[data-sx="${scopeKey.replace(/[^A-Za-z0-9_-]/g, '')}"]{${safe}}`;
}
