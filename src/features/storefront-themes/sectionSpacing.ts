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
  '.sx-own-bg>*,.sx-own-bg>[data-editor-block-id]>*{background-color:transparent!important}' +
  '.sx-pad-t>:first-child,.sx-pad-t>style:first-child+*,.sx-pad-t>[data-editor-block-id]:first-child>:first-child,.sx-pad-t>style:first-child+[data-editor-block-id]>:first-child{padding-top:var(--sx-pt)!important}' +
  '.sx-pad-b>:last-child,.sx-pad-b>[data-editor-block-id]:last-child>:last-child{padding-bottom:var(--sx-pb)!important}' +
  '.sx-full>*>.mx-auto,.sx-full>.mx-auto,.sx-full>[data-editor-block-id]>*>.mx-auto{max-width:none!important}' +
  '[data-hero-drag]{cursor:grab;user-select:none}[data-hero-drag]:active{cursor:grabbing}' +
  '@media (max-width:749px){.sx-hide-m{display:none!important}}' +
  '@media (min-width:750px){.sx-hide-d{display:none!important}}' +
  // tablet = 750-1023px, wide = 1024px and up ("Show on" options tablet / large screens / mobile and tablet)
  '@media (min-width:750px) and (max-width:1023px){.sx-hide-t{display:none!important}}' +
  '@media (min-width:1024px){.sx-hide-w{display:none!important}}' +
  // ── Design v2: per-phone values, text alignment/style, sticky, video background, scroll animation ──
  '.sx-ta-l,.sx-ta-l *{text-align:left!important}.sx-ta-c,.sx-ta-c *{text-align:center!important}.sx-ta-r,.sx-ta-r *{text-align:right!important}' +
  '.sx-tc :is(p,li,blockquote,td,th,dd,dt,small,figcaption,label),.sx-tc span:not(button *,a *){color:var(--sx-tc)!important}' +
  '.sx-hc :is(h1,h2,h3,h4,h5,h6){color:var(--sx-hc)!important}' +
  '.sx-hw :is(h1,h2,h3,h4,h5,h6){font-weight:var(--sx-hw)!important}' +
  '.sx-hcase :is(h1,h2,h3,h4,h5,h6){text-transform:var(--sx-hcase)!important}' +
  '.sx-vid{position:relative;isolation:isolate}' +
  '.sx-vid-el{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;pointer-events:none}' +
  '.sx-vid-ov{position:absolute;inset:0;z-index:-1;pointer-events:none}' +
  '.sx-anim{transition:opacity var(--sx-ad-dur,.6s) ease var(--sx-ad,0ms),transform var(--sx-ad-dur,.6s) ease var(--sx-ad,0ms)}' +
  '.sx-anim[data-sx-pre]{opacity:0}' +
  '.sx-anim-slide-up[data-sx-pre]{transform:translateY(32px)}' +
  '.sx-anim-slide-left[data-sx-pre]{transform:translateX(-40px)}' +
  '.sx-anim-slide-right[data-sx-pre]{transform:translateX(40px)}' +
  '.sx-anim-zoom[data-sx-pre]{transform:scale(.94)}' +
  '@media (prefers-reduced-motion:reduce){.sx-anim{transition:none}.sx-anim[data-sx-pre]{opacity:1;transform:none}.sx-vid-el{display:none}}' +
  '@media (max-width:749px){' +
  '.sx-pad-tm>:first-child,.sx-pad-tm>style:first-child+*,.sx-pad-tm>[data-editor-block-id]:first-child>:first-child,.sx-pad-tm>style:first-child+[data-editor-block-id]>:first-child{padding-top:var(--sx-ptm)!important}' +
  '.sx-pad-bm>:last-child,.sx-pad-bm>[data-editor-block-id]:last-child>:last-child{padding-bottom:var(--sx-pbm)!important}' +
  '.sx-mt-m{margin-top:var(--sx-mtm)!important}.sx-mb-m{margin-bottom:var(--sx-mbm)!important}' +
  '.sx-tam-l,.sx-tam-l *{text-align:left!important}.sx-tam-c,.sx-tam-c *{text-align:center!important}.sx-tam-r,.sx-tam-r *{text-align:right!important}' +
  '}';

const ALIGN_CODE: Record<string, string> = { left: 'l', center: 'c', right: 'r' };
const HEADING_WEIGHT: Record<string, string> = { normal: '400', medium: '500', semibold: '600', bold: '700', black: '900' };
const ANIMATIONS = ['fade', 'slide-up', 'slide-left', 'slide-right', 'zoom'] as const;
const ANIM_SPEED: Record<string, string> = { fast: '.35s', normal: '.6s', slow: '1s' };

/** "Show on" -> the hide classes: desktop = tablet + large (hide mobile), mobile = mobile only, tablet = tablet only, large = 1024px+ only, mobile-tablet = hide on large screens. */
function visibilityClasses(visibility: unknown): string {
  switch (visibility) {
    case 'desktop': return 'sx-hide-m';
    case 'mobile': return 'sx-hide-d';
    case 'tablet': return 'sx-hide-m sx-hide-w';
    case 'large': return 'sx-hide-m sx-hide-t';
    case 'mobile-tablet': return 'sx-hide-w';
    default: return '';
  }
}

export function sectionSpacing(settings: Record<string, unknown> | undefined): { className: string; style: CSSProperties } {
  const top = typeof settings?.spacingTop === 'number' ? settings.spacingTop : undefined;
  const bottom = typeof settings?.spacingBottom === 'number' ? settings.spacingBottom : undefined;
  const padTop = typeof settings?.paddingTop === 'number' ? settings.paddingTop : undefined;
  const padBottom = typeof settings?.paddingBottom === 'number' ? settings.paddingBottom : undefined;
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
  const num0 = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : undefined);
  // Space above/below is a margin, so it may be negative (pulls the section closer); padding may not.
  const numSigned = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-max, Math.min(v, max)) : undefined);
  const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(v, max) : undefined);
  const ownBg = hex(settings?.sectionBgColor);
  const borderW = num(settings?.borderWidth, 8);
  const borderColor = hex(settings?.borderColor);
  const radius = num(settings?.borderRadius, 80);
  const shadow = ({ soft: '0 2px 10px rgba(0,0,0,.08)', medium: '0 8px 24px rgba(0,0,0,.14)', strong: '0 16px 44px rgba(0,0,0,.25)' } as Record<string, string>)[String(settings?.shadow)];
  const visibility = settings?.visibility;
  const bgImage = typeof settings?.backgroundImageUrl === 'string' && /^https:\/\//i.test(settings.backgroundImageUrl)
    ? settings.backgroundImageUrl.replace(/["\\\n\r()]/g, '')
    : null;
  const overlay = typeof settings?.backgroundOverlay === 'number' ? Math.min(80, Math.max(0, settings.backgroundOverlay)) / 100 : 0;
  // Design v2 (all optional; unset = the theme's own look)
  const padTopM = num0(settings?.paddingTopMobile, 160);
  const padBottomM = num0(settings?.paddingBottomMobile, 160);
  const topM = numSigned(settings?.spacingTopMobile, 160);
  const bottomM = numSigned(settings?.spacingBottomMobile, 160);
  const gradFrom = hex(settings?.gradientFrom);
  const gradTo = hex(settings?.gradientTo);
  const gradAngle = typeof settings?.gradientAngle === 'number' && Number.isFinite(settings.gradientAngle) ? Math.min(360, Math.max(0, Math.round(settings.gradientAngle))) : 180;
  const gradient = gradFrom && gradTo ? `linear-gradient(${gradAngle}deg,${gradFrom},${gradTo})` : null;
  const videoUrl = sectionVideoUrl(settings);
  const alignD = ALIGN_CODE[String(settings?.textAlign)];
  const alignM = ALIGN_CODE[String(settings?.textAlignMobile)];
  const textColor = hex(settings?.textColor);
  const headingColor = hex(settings?.headingColor);
  const headingWeight = HEADING_WEIGHT[String(settings?.headingWeight)];
  const headingCase = settings?.headingCase === 'uppercase' || settings?.headingCase === 'capitalize' || settings?.headingCase === 'none' ? String(settings.headingCase) : undefined;
  const sticky = settings?.sticky === true;
  const stickyOffset = num0(settings?.stickyOffset, 300) ?? 0;
  const anim = ANIMATIONS.find(a => a === settings?.animation);
  const animDelay = num0(settings?.animationDelay, 2000);
  const animSpeed = ANIM_SPEED[String(settings?.animationSpeed)];
  return {
    className: [
      ownBg || gradient || videoUrl ? 'sx-own-bg' : '',
      padTop !== undefined ? 'sx-pad-t' : '',
      padBottom !== undefined ? 'sx-pad-b' : '',
      padTopM !== undefined ? 'sx-pad-tm' : '',
      padBottomM !== undefined ? 'sx-pad-bm' : '',
      topM !== undefined ? 'sx-mt-m' : '',
      bottomM !== undefined ? 'sx-mb-m' : '',
      settings?.fullWidth === true ? 'sx-full' : '',
      alignD ? `sx-ta-${alignD}` : '',
      alignM ? `sx-tam-${alignM}` : '',
      textColor ? 'sx-tc' : '',
      headingColor ? 'sx-hc' : '',
      headingWeight ? 'sx-hw' : '',
      headingCase ? 'sx-hcase' : '',
      videoUrl ? 'sx-vid' : '',
      anim ? `sx-anim sx-anim-${anim}` : '',
      visibilityClasses(visibility),
    ].filter(Boolean).join(' '),
    style: {
      marginTop: top,
      marginBottom: bottom,
      ...(ownBg ? { backgroundColor: ownBg } : {}),
      ...(padTopM !== undefined ? { '--sx-ptm': `${padTopM}px` } : {}),
      ...(padBottomM !== undefined ? { '--sx-pbm': `${padBottomM}px` } : {}),
      ...(topM !== undefined ? { '--sx-mtm': `${topM}px` } : {}),
      ...(bottomM !== undefined ? { '--sx-mbm': `${bottomM}px` } : {}),
      ...(textColor ? { '--sx-tc': textColor, color: textColor } : {}),
      ...(headingColor ? { '--sx-hc': headingColor } : {}),
      ...(headingWeight ? { '--sx-hw': headingWeight } : {}),
      ...(headingCase ? { '--sx-hcase': headingCase } : {}),
      ...(sticky ? { position: 'sticky' as const, top: stickyOffset, zIndex: 20 } : {}),
      ...(anim && animDelay ? { '--sx-ad': `${animDelay}ms` } : {}),
      ...(anim && animSpeed ? { '--sx-ad-dur': animSpeed } : {}),
      ...(gradient && !bgImage ? { backgroundImage: gradient } : {}),
      ...(borderW ? { borderWidth: borderW, borderStyle: 'solid', borderColor: borderColor ?? 'currentColor' } : {}),
      ...(radius ? { borderRadius: radius, overflow: 'hidden' } : {}),
      ...(shadow ? { boxShadow: shadow } : {}),
      ...(padTop !== undefined ? { '--sx-pt': `${padTop}px` } : {}),
      ...(padBottom !== undefined ? { '--sx-pb': `${padBottom}px` } : {}),
      ...(bgImage ? {
        backgroundImage: `${overlay > 0 ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),` : ''}url("${bgImage}")${gradient ? `,${gradient}` : ''}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}),
    },
  };
}

/** The section's background video: https only (mp4/webm), no quotes. */
export function sectionVideoUrl(settings: Record<string, unknown> | undefined): string | null {
  const v = typeof settings?.backgroundVideoUrl === 'string' ? settings.backgroundVideoUrl.trim() : '';
  return /^https:\/\/[^\s"'<>()\\]+$/i.test(v) && v.length <= 2000 ? v : null;
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
