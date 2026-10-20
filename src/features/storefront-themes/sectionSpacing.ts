import type { CSSProperties } from 'react';

/** Shared section-wrapper behaviour for every theme (Shopify's per-section
 *  "Section settings" that every section gets):
 *  - Space above/below (`spacingTop/Bottom`) is EMPTY SPACE OUTSIDE the section, a plain
 *    margin on the wrapper: the section's own padding and background are never touched.
 *  - Inner padding (`paddingTop/Bottom`) REPLACES the section's own top/bottom padding,
 *    inside its background (`.sx-pad-*` rules set the padding on the section's own
 *    element, also through the editor's block hit-target).
 *  - Show on: all / desktop only / mobile only (749px breakpoint, like Shopify).
 *  - Full width: lifts the section's centred content box to the full width.
 *  - Background image (+ dark overlay) behind the section.
 *  - Anchor id, so a link to `#id` scrolls to it.
 *  - Custom CSS scoped to this one section (native CSS nesting).
 *  Every option is optional; unset = the theme's own look. */
export const SECTION_SPACING_CSS =
  // (a section's own <style> may come first, so also match the element after it)
  '.sx-pad-t>:first-child,.sx-pad-t>style:first-child+*,.sx-pad-t>[data-editor-block-id]:first-child>:first-child,.sx-pad-t>style:first-child+[data-editor-block-id]>:first-child{padding-top:var(--sx-pt)!important}' +
  '.sx-pad-b>:last-child,.sx-pad-b>[data-editor-block-id]:last-child>:last-child{padding-bottom:var(--sx-pb)!important}' +
  '.sx-full>*>.mx-auto,.sx-full>.mx-auto,.sx-full>[data-editor-block-id]>*>.mx-auto{max-width:none!important}' +
  '@media (max-width:749px){.sx-hide-m{display:none!important}}' +
  '@media (min-width:750px){.sx-hide-d{display:none!important}}';

export function sectionSpacing(settings: Record<string, unknown> | undefined): { className: string; style: CSSProperties } {
  const top = typeof settings?.spacingTop === 'number' ? settings.spacingTop : undefined;
  const bottom = typeof settings?.spacingBottom === 'number' ? settings.spacingBottom : undefined;
  const padTop = typeof settings?.paddingTop === 'number' ? settings.paddingTop : undefined;
  const padBottom = typeof settings?.paddingBottom === 'number' ? settings.paddingBottom : undefined;
  const visibility = settings?.visibility;
  const bgImage = typeof settings?.backgroundImageUrl === 'string' && /^https:\/\//i.test(settings.backgroundImageUrl)
    ? settings.backgroundImageUrl.replace(/["\\\n\r()]/g, '')
    : null;
  const overlay = typeof settings?.backgroundOverlay === 'number' ? Math.min(80, Math.max(0, settings.backgroundOverlay)) / 100 : 0;
  return {
    className: [
      padTop !== undefined ? 'sx-pad-t' : '',
      padBottom !== undefined ? 'sx-pad-b' : '',
      settings?.fullWidth === true ? 'sx-full' : '',
      visibility === 'desktop' ? 'sx-hide-m' : visibility === 'mobile' ? 'sx-hide-d' : '',
    ].filter(Boolean).join(' '),
    style: {
      marginTop: top,
      marginBottom: bottom,
      ...(padTop !== undefined ? { '--sx-pt': `${padTop}px` } : {}),
      ...(padBottom !== undefined ? { '--sx-pb': `${padBottom}px` } : {}),
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
