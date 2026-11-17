import type { CSSProperties } from 'react';
import { resolveOptionStyle, type OptionValueInfo } from './variantOptions';

/** One option of a product (Size, Colour ...) as the shopper picks it: buttons, a dropdown, colour swatches or picture tiles.
 *  Headless behaviour in `variantOptions.ts`; the look comes from the theme's own colours and corner radius (`tokens`). */
export interface PickerTokens {
  ink: string; inkMuted: string; border: string;
  /** Colour of the chosen button / the ring around a chosen swatch. */
  selected: string;
  /** Text on a chosen filled button. */
  selectedInk: string;
  /** Page colour (the gap between a swatch and its ring). */
  bg: string;
  /** Corner radius of buttons and the dropdown ("9999px" = pill). */
  radius: string | number;
  /** `filled`: the chosen button is filled with `selected`; `outlined`: it only gets a `selected` border and text. */
  buttonLook: 'filled' | 'outlined';
  /** Border of the buttons (default 1). */
  borderWidth?: number;
  /** Weight of the option name above the values (default 500). */
  legendWeight?: number;
}

const SWATCH_PX = { sm: 28, md: 36, lg: 44 } as const;
const TILE_PX = { sm: 48, md: 60, lg: 76 } as const;

export function VariantOptionPicker({ name, current, values, style: requested, tokens: t, onPick, soldOutLabel, shape = 'circle', size = 'md', gap = 8 }: {
  name: string;
  current: string | undefined;
  values: OptionValueInfo[];
  /** What the seller asked for; an option it does not suit falls back to buttons. */
  style: unknown;
  tokens: PickerTokens;
  onPick: (value: string) => void;
  soldOutLabel: string;
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
  gap?: number;
}) {
  const style = resolveOptionStyle(requested, name, values);

  if (style === 'dropdown') {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium">
        {name}
        <select value={current ?? ''} onChange={e => onPick(e.target.value)} className="cursor-pointer bg-transparent px-4 py-3 text-sm font-normal"
          style={{ borderRadius: t.radius, border: `1px solid ${t.border}`, color: t.ink }}>
          {values.map(v => <option key={v.value} value={v.value}>{v.value}{v.available ? '' : ` — ${soldOutLabel}`}</option>)}
        </select>
      </label>
    );
  }

  const radius = shape === 'square' ? 6 : 9999;
  const ring = (on: boolean): CSSProperties => (on ? { outline: `2px solid ${t.selected}`, outlineOffset: 2 } : {});
  const soldOut = (ok: boolean): CSSProperties => (ok ? {} : { opacity: 0.45 });

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 p-0 text-sm" style={{ fontWeight: t.legendWeight ?? 500 }}>{name}: <span style={{ color: t.inkMuted }}>{current}</span></legend>
      <div className="flex flex-wrap items-center" style={{ gap }}>
        {values.map(v => {
          const on = current === v.value;
          const label = `${name}: ${v.value}${v.available ? '' : ` (${soldOutLabel})`}`;
          if (style === 'swatches' && v.color) {
            const px = SWATCH_PX[size];
            return (
              <button key={v.value} type="button" aria-pressed={on} aria-label={label} title={v.value} onClick={() => onPick(v.value)} data-swatch
                className="relative cursor-pointer overflow-hidden p-0"
                style={{ width: px, height: px, borderRadius: radius, background: v.color, border: `1px solid ${t.border}`, ...ring(on), ...soldOut(v.available) }}>
                {!v.available && <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to top right, transparent calc(50% - 1px), ${t.ink} calc(50% - 1px), ${t.ink} calc(50% + 1px), transparent calc(50% + 1px))` }} />}
              </button>
            );
          }
          if (style === 'images' && v.image) {
            const px = TILE_PX[size];
            return (
              <button key={v.value} type="button" aria-pressed={on} aria-label={label} title={v.value} onClick={() => onPick(v.value)} data-image-tile
                className="relative cursor-pointer overflow-hidden p-0"
                style={{ width: px, height: px, borderRadius: shape === 'circle' ? 9999 : 10, border: `1px solid ${t.border}`, background: t.bg, ...ring(on), ...soldOut(v.available) }}>
                <img src={v.image} alt="" loading="lazy" className="size-full object-cover" />
                {!v.available && <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to top right, transparent calc(50% - 1px), ${t.ink} calc(50% - 1px), ${t.ink} calc(50% + 1px), transparent calc(50% + 1px))` }} />}
              </button>
            );
          }
          // buttons (also the fallback for a swatch / tile value we have nothing to draw for)
          const filled = t.buttonLook === 'filled';
          return (
            <button key={v.value} type="button" aria-pressed={on} onClick={() => onPick(v.value)} className="min-w-12 cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderRadius: t.radius, border: `${t.borderWidth ?? 1}px solid ${on ? t.selected : t.border}`,
                background: filled ? (on ? t.selected : 'transparent') : t.bg,
                color: filled ? (on ? t.selectedInk : t.ink) : (on ? t.selected : t.ink),
                opacity: v.available ? 1 : 0.45, textDecoration: v.available ? undefined : 'line-through',
              }}>{v.value}</button>
          );
        })}
      </div>
    </fieldset>
  );
}
