import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Handbag, Heart, Search, ShoppingBag, ShoppingBasket, ShoppingCart, User, UserRound, CircleUser, type LucideIcon } from 'lucide-react';
import type { HeaderIconSetDef } from '../themeManifest';
import type { HeaderOptions } from './headerOptions';

/**
 * Header icon system shared by every theme (headless logic + one tooltip/label/glyph component).
 * The theme decides WHICH icon sets exist (manifest `headerOptionChoices.iconSets`), what its tooltip looks like (`IconSkin`)
 * and which button class carries the hover/ring; the seller picks a set, size, stroke, labels and tooltips in Customize > Header > Icons.
 */
export type HeaderIconKind = 'search' | 'account' | 'wishlist' | 'cart';

/** A theme's own look for the parts the icon system draws itself (tooltip bubble + container shapes). */
export interface IconSkin {
  tipBg: string;
  tipInk: string;
  tipRadius: number;
  tipFont: string;
  tipShadow?: string;
  /** Corner radius of the tile / box treatments. */
  tileRadius: number;
  /** Glyph colour on a solid (filled) container: normally the page background of the theme. */
  inverse: string;
}

/** What the seller chose, resolved against the active theme's own sets. */
export interface HeaderIconPrefs {
  set: HeaderIconSetDef;
  size: 'sm' | 'md' | 'lg';
  stroke: 'thin' | 'regular' | 'bold';
  tooltips: boolean;
  labels: 'none' | 'below';
}

const GLYPHS: Record<HeaderIconSetDef['family'], Record<HeaderIconKind, LucideIcon>> = {
  bag: { search: Search, account: User, wishlist: Heart, cart: ShoppingBag },
  cart: { search: Search, account: UserRound, wishlist: Heart, cart: ShoppingCart },
  handbag: { search: Search, account: CircleUser, wishlist: Heart, cart: Handbag },
  basket: { search: Search, account: UserRound, wishlist: Heart, cart: ShoppingBasket },
};

const STROKE = { thin: 1.25, regular: 2, bold: 2.75 } as const;
const SIZE_DELTA = { sm: -2, md: 0, lg: 4 } as const;

/** The seller's choice against the theme's sets; an unknown/missing id falls back to the theme's first (default) set. */
export function resolveIconPrefs(o: Pick<HeaderOptions, 'iconSet' | 'iconSize' | 'iconStroke' | 'iconTooltips' | 'iconLabels'>, sets: HeaderIconSetDef[]): HeaderIconPrefs {
  const set = sets.find(s => s.id === o.iconSet) ?? sets[0];
  return { set, size: o.iconSize, stroke: o.iconStroke, tooltips: o.iconTooltips, labels: o.iconLabels };
}

export function HeaderIconGlyph({ kind, prefs, skin, base = 20, glyph }: {
  kind: HeaderIconKind; prefs: HeaderIconPrefs; skin: IconSkin; base?: number; glyph?: ReactNode;
}) {
  const { set } = prefs;
  const px = base + SIZE_DELTA[prefs.size];
  const tr = set.treatment;
  const Icon = GLYPHS[set.family][kind];
  const sw = STROKE[prefs.stroke] + (tr === 'bold' ? 0.75 : 0);
  const canFill = kind !== 'search';
  const svgProps = {
    size: px,
    strokeWidth: tr === 'filled' && canFill ? Math.min(sw, 1.75) : sw,
    fill: canFill && tr === 'filled' ? 'currentColor' : canFill && tr === 'duotone' ? 'color-mix(in srgb, currentColor 22%, transparent)' : 'none',
    strokeLinecap: tr === 'sharp' ? ('square' as const) : ('round' as const),
    strokeLinejoin: tr === 'sharp' ? ('miter' as const) : ('round' as const),
    'aria-hidden': true,
  };
  const inner = glyph ?? <Icon {...svgProps} />;
  if (tr !== 'circle' && tr !== 'solid' && tr !== 'tile' && tr !== 'box') return <>{inner}</>;
  const box = px + 16;
  const style: CSSProperties = { width: box, height: box, display: 'inline-grid', placeItems: 'center', flexShrink: 0 };
  if (tr === 'circle') Object.assign(style, { border: '1.5px solid currentColor', borderRadius: 9999 });
  if (tr === 'solid') Object.assign(style, { background: 'currentColor', borderRadius: 9999 });
  if (tr === 'tile') Object.assign(style, { background: 'color-mix(in srgb, currentColor 10%, transparent)', borderRadius: skin.tileRadius });
  if (tr === 'box') Object.assign(style, { border: '1.5px solid currentColor', borderRadius: skin.tileRadius });
  // On a solid container the glyph takes the inverse colour; the span keeps `currentColor` for its own background.
  return <span style={style}>{tr === 'solid' ? <span style={{ color: skin.inverse, display: 'grid' }}>{inner}</span> : inner}</span>;
}

/** Tooltip + label styles. Zero specificity on the wrapper so a theme's own `hidden sm:flex` class still wins. */
export const HEADER_ICON_CSS = `
:where(.sx-hi){position:relative;display:inline-flex}
.sx-hi-tip{position:absolute;top:calc(100% + 8px);left:50%;transform:translate(-50%,-3px);z-index:80;opacity:0;visibility:hidden;pointer-events:none;white-space:nowrap;
  padding:6px 10px;font-size:12px;line-height:1.2;font-weight:500;letter-spacing:.01em;
  background:var(--tip-bg);color:var(--tip-ink);border-radius:var(--tip-radius);font-family:var(--tip-font);box-shadow:var(--tip-shadow,none);
  transition:opacity .16s ease,transform .16s ease,visibility 0s linear .16s}
.sx-hi-tip::before{content:'';position:absolute;top:-4px;left:50%;margin-left:-4px;width:8px;height:8px;background:var(--tip-bg);transform:rotate(45deg);border-radius:1px}
.sx-hi-tip[data-align=end]{left:auto;inset-inline-end:0;transform:translateY(-3px)}
.sx-hi-tip[data-align=end]::before{left:auto;margin-left:0;inset-inline-end:16px}
.sx-hi-tip[data-align=start]{left:0;transform:translateY(-3px)}
.sx-hi-tip[data-align=start]::before{left:16px}
.sx-hi:hover .sx-hi-tip,.sx-hi:has(:focus-visible) .sx-hi-tip{opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:.25s,.25s,0s}
.sx-hi:hover .sx-hi-tip[data-align=end],.sx-hi:has(:focus-visible) .sx-hi-tip[data-align=end],
.sx-hi:hover .sx-hi-tip[data-align=start],.sx-hi:has(:focus-visible) .sx-hi-tip[data-align=start]{transform:translateY(0)}
@media (hover:none){.sx-hi-tip{display:none}}
@media (prefers-reduced-motion:reduce){.sx-hi-tip{transition:none}}
.sx-hi-col{flex-direction:column!important;gap:2px!important;height:auto!important;width:auto!important;min-width:44px;padding:5px 8px!important;border-radius:12px!important}
.sx-hi-label{font-size:10.5px;line-height:1.1;font-weight:500;white-space:nowrap}
`;

export function HeaderIconStyles() {
  return <style>{HEADER_ICON_CSS}</style>;
}

/**
 * One header icon: the theme passes its own button class/badge, the system supplies glyph, label and tooltip.
 * `wrapClassName` carries responsive visibility (e.g. `hidden sm:inline-flex`) because the tooltip needs a wrapper.
 */
export function HeaderIconButton({
  kind, prefs, skin, label, ariaLabel, to, onClick, expanded, popup, className, wrapClassName, style, badge, align = 'center', base, glyph,
}: {
  kind: HeaderIconKind; prefs: HeaderIconPrefs; skin: IconSkin;
  /** Tooltip / label text (already translated). */
  label: string; ariaLabel?: string;
  to?: string; onClick?: () => void; expanded?: boolean; popup?: boolean;
  className: string; wrapClassName?: string; style?: CSSProperties; badge?: ReactNode;
  align?: 'center' | 'end' | 'start'; base?: number; glyph?: ReactNode;
}) {
  const below = prefs.labels === 'below';
  const content = (
    <>
      <HeaderIconGlyph kind={kind} prefs={prefs} skin={skin} base={base} glyph={glyph} />
      {badge}
      {below && <span className="sx-hi-label">{label}</span>}
    </>
  );
  const cls = `${className}${below ? ' sx-hi-col' : ''}`;
  const aria = ariaLabel ?? label;
  const tipStyle = {
    '--tip-bg': skin.tipBg, '--tip-ink': skin.tipInk, '--tip-radius': `${skin.tipRadius}px`, '--tip-font': skin.tipFont, '--tip-shadow': skin.tipShadow ?? 'none',
  } as CSSProperties;
  return (
    <span className={`sx-hi ${wrapClassName ?? ''}`}>
      {to
        ? <Link to={to} className={cls} aria-label={aria} style={style}>{content}</Link>
        : <button type="button" className={cls} aria-label={aria} aria-expanded={expanded} aria-haspopup={popup ? 'true' : undefined} onClick={onClick} style={style}>{content}</button>}
      {prefs.tooltips && !below && <span className="sx-hi-tip" data-align={align === 'center' ? undefined : align} aria-hidden="true" style={tipStyle}>{label}</span>}
    </span>
  );
}
