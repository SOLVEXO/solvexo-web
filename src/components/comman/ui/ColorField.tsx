import { useCallback, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Pipette, X } from 'lucide-react';
import { clsx } from 'clsx';
import { CONTROL_BASE } from './controlStyles';
import { Popover } from './Popover';
import {
  DEFAULT_SWATCHES, contrastRatio, hexToHsv, hexToRgb, hsvToHex, normalizeHex, readRecentColors, rememberColor,
  type Hsv,
} from './colorUtils';

/*
 * The one colour field. A swatch + a hex box (type or paste "#d97757", "d97757" or "#d75"), and a panel with a
 * shade area, a hue slider, the store's brand colours, recently used colours and an eye-dropper (Chrome / Edge).
 * Drop-in for `<input type="color">`: `value` is "#rrggbb", `onChange(e)` gives `e.target.value`, `onValueChange(v)` is
 * the shorter form, `name` / `required` work inside a <form>.
 * Empty ("") means "not set / automatic" when `allowEmpty` is on.
 */

export interface ColorFieldProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Let the person clear the colour ("" = automatic). */
  allowEmpty?: boolean;
  /** What "" means, shown in the box ("Automatic", "Theme colour"...). */
  emptyLabel?: string;
  /** The store's brand colours, shown first in the panel. */
  swatches?: string[];
  /** Warn when this colour is hard to read against a background (e.g. the button text colour on a button colour). */
  contrastAgainst?: string;
  /** Only the swatch button, no hex box (tight toolbars). */
  compact?: boolean;
  /** Colour the panel opens on while the field is still empty (e.g. the theme's own colour). */
  pickerStart?: string;
  'aria-label'?: string;
}

type ChangeEmit = Pick<ColorFieldProps, 'onChange' | 'onValueChange' | 'name' | 'id'>;
function emit(p: ChangeEmit, value: string) {
  p.onValueChange?.(value);
  if (p.onChange) {
    const target = { value, name: p.name ?? '', id: p.id ?? '' };
    p.onChange({ target, currentTarget: target } as unknown as ChangeEvent<HTMLInputElement>);
  }
}

const CHECKER = 'repeating-conic-gradient(#e8e6dc 0% 25%, #fff 0% 50%) 50% / 10px 10px';

export function ColorField(props: ColorFieldProps) {
  const { value = '', label, error, hint, name, disabled, required, className, allowEmpty = false, emptyLabel = 'Automatic', swatches, contrastAgainst, compact, pickerStart } = props;
  const auto = useId();
  const fid = props.id ?? auto;
  const hex = normalizeHex(value);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(hex ?? '');
  const [bad, setBad] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);

  // Follow the value when it changes from outside (reset, brand colour, another field).
  const [seenHex, setSeenHex] = useState(hex);
  if (hex !== seenHex) { setSeenHex(hex); setText(hex ?? ''); setBad(false); }

  const set = (v: string) => emit({ onChange: props.onChange, onValueChange: props.onValueChange, name, id: fid }, v);

  const commitText = () => {
    if (!text.trim()) {
      if (allowEmpty) { set(''); setBad(false); } else { setText(hex ?? ''); }
      return;
    }
    const n = normalizeHex(text);
    if (!n) { setBad(true); return; }
    setBad(false);
    setText(n);
    if (n !== hex) { set(n); rememberColor(n); }
  };

  const warn = hex && contrastAgainst && normalizeHex(contrastAgainst) && contrastRatio(hex, normalizeHex(contrastAgainst)!) < 3
    ? `Hard to read on ${normalizeHex(contrastAgainst)} (contrast ${contrastRatio(hex, normalizeHex(contrastAgainst)!).toFixed(1)}:1, aim for 3:1 or more).`
    : null;

  const swatch = (
    <button
      ref={anchor}
      id={compact ? fid : undefined}
      type="button"
      disabled={disabled}
      onClick={() => setOpen(o => !o)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={props['aria-label'] ?? (label ? `${label}: pick a colour` : 'Pick a colour')}
      className={clsx(
        'relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-bone p-0 outline-none transition-shadow',
        'focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/20 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-11',
      )}
      style={{ background: hex ?? CHECKER }}
    >
      {!hex && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate">—</span>}
    </button>
  );

  return (
    <div className={clsx('w-full', className)}>
      {label && <label htmlFor={compact ? fid : `${fid}-hex`} className="mb-1.5 block text-[12px] font-medium text-charcoal">{label}</label>}
      <div ref={wrap} className="flex items-center gap-2">
        {swatch}
        {!compact && (
          <div className="relative min-w-0 flex-1">
            <input
              id={`${fid}-hex`}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={7}
              value={text}
              disabled={disabled}
              placeholder={allowEmpty ? emptyLabel : '#000000'}
              aria-invalid={!!error || bad}
              aria-describedby={bad ? `${fid}-bad` : undefined}
              onChange={e => { setText(e.target.value); setBad(false); }}
              onBlur={commitText}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); commitText(); } }}
              className={clsx(CONTROL_BASE, 'font-mono uppercase placeholder:font-sans placeholder:normal-case', allowEmpty && hex && 'pe-9', (error || bad) && 'border-error! focus:ring-error/10!')}
            />
            {allowEmpty && hex && !disabled && (
              <button type="button" onClick={() => { set(''); setText(''); }} aria-label={`Reset to ${emptyLabel.toLowerCase()}`}
                className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-slate hover:bg-cream hover:text-charcoal pointer-coarse:h-9 pointer-coarse:w-9">
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      {bad && <p id={`${fid}-bad`} role="alert" className="mt-1 text-[11px] text-error">Use a colour like #D97757.</p>}
      {warn && !bad && <p className="mt-1 text-[11px] text-[#B45309]">{warn}</p>}
      {hint && !error && !bad && !warn && <p className="mt-1 text-[11px] text-slate">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>}
      {(name || required) && <input type="text" name={name} required={required} value={hex ?? ''} onChange={() => {}} tabIndex={-1} aria-hidden className="pointer-events-none absolute h-0 w-0 opacity-0" />}

      <Popover open={open} onClose={close} anchorRef={anchor} width={272} estimatedHeight={440} sheetTitle={label ?? 'Pick a colour'} label={label ?? 'Colour picker'}>
        <PickerPanel
          hex={hex}
          start={normalizeHex(pickerStart) ?? undefined}
          swatches={swatches}
          allowEmpty={allowEmpty}
          emptyLabel={emptyLabel}
          onCommit={v => { set(v); if (v) rememberColor(v); }}
          onClose={close}
        />
      </Popover>
    </div>
  );
}

function PickerPanel({ hex, start, swatches, allowEmpty, emptyLabel, onCommit, onClose }: {
  hex: string | null; start?: string; swatches?: string[]; allowEmpty: boolean; emptyLabel: string; onCommit: (v: string) => void; onClose: () => void;
}) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(hex ?? start ?? '#d97757'));
  const [hexText, setHexText] = useState(hex ?? start ?? '#d97757');
  const [recent, setRecent] = useState<string[]>(() => readRecentColors());
  const area = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const current = hsvToHex(hsv);
  const rgb = hexToRgb(current);
  const eyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const apply = (next: Hsv, commit: boolean) => {
    setHsv(next);
    const h = hsvToHex(next);
    setHexText(h);
    if (commit) { onCommit(h); setRecent(readRecentColors()); }
  };

  const fromPointer = (e: ReactPointerEvent<HTMLDivElement>): Hsv => {
    const r = area.current!.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { ...hsv, s, v };
  };

  const onAreaKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    let { s, v } = hsv;
    if (e.key === 'ArrowLeft') s -= step; else if (e.key === 'ArrowRight') s += step;
    else if (e.key === 'ArrowUp') v += step; else if (e.key === 'ArrowDown') v -= step; else return;
    e.preventDefault();
    apply({ ...hsv, s: Math.min(1, Math.max(0, s)), v: Math.min(1, Math.max(0, v)) }, true);
  };

  const pickSwatch = (c: string) => { setHsv(hexToHsv(c)); setHexText(c); onCommit(c); setRecent(readRecentColors()); };

  const commitHexText = () => {
    const n = normalizeHex(hexText);
    if (!n) { setHexText(current); return; }
    setHsv(hexToHsv(n)); setHexText(n); onCommit(n); setRecent(readRecentColors());
  };

  const dropper = async () => {
    try {
      const Ctor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const res = await new Ctor().open();
      const n = normalizeHex(res.sRGBHex);
      if (n) pickSwatch(n);
    } catch { /* the person pressed Escape */ }
  };

  const brand = (swatches ?? []).map(normalizeHex).filter((c, i, a): c is string => !!c && a.indexOf(c) === i);
  const defaults = DEFAULT_SWATCHES.filter(c => !brand.includes(c));

  const dot = (c: string) => (
    <button
      key={c}
      type="button"
      onClick={() => pickSwatch(c)}
      aria-label={c}
      title={c}
      className={clsx('h-6 w-6 pointer-coarse:h-9 pointer-coarse:w-9 cursor-pointer rounded-md border p-0 transition-transform hover:scale-110', c === current ? 'border-charcoal ring-2 ring-brand-orange/30' : 'border-bone')}
      style={{ background: c }}
    />
  );

  return (
    <div className="p-3">
      <div
        ref={area}
        role="slider"
        tabIndex={0}
        aria-label="Shade: saturation and brightness"
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)} percent, brightness ${Math.round(hsv.v * 100)} percent`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v * 100)}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
        onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); apply(fromPointer(e), false); }}
        onPointerMove={e => { if (dragging.current) apply(fromPointer(e), false); }}
        onPointerUp={e => { if (!dragging.current) return; dragging.current = false; apply(fromPointer(e), true); }}
        onKeyDown={onAreaKey}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current, boxShadow: '0 0 0 1px rgba(0,0,0,.35)' }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsv.h)}
          aria-label="Hue"
          onChange={e => apply({ ...hsv, h: Number(e.target.value) }, false)}
          onPointerUp={() => apply(hsv, true)}
          onKeyUp={() => apply(hsv, true)}
          className="h-3 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#888] [&::-webkit-slider-thumb]:shadow"
          style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        />
        {eyeDropper && (
          <button type="button" onClick={dropper} aria-label="Pick a colour from the screen" title="Pick from screen"
            className="flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-bone bg-white text-slate hover:bg-cream hover:text-charcoal">
            <Pipette size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-8 w-8 shrink-0 rounded-lg border border-bone" style={{ background: current }} aria-hidden />
        <input
          type="text"
          spellCheck={false}
          maxLength={7}
          aria-label="Hex colour"
          value={hexText}
          onChange={e => setHexText(e.target.value)}
          onBlur={commitHexText}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitHexText(); } }}
          className="h-8 pointer-coarse:h-11 min-w-0 flex-1 rounded-lg border border-bone bg-white px-2 font-mono text-[12px] uppercase text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
        />
        <span className="shrink-0 text-[11px] tabular-nums text-slate" aria-label="RGB">{rgb.r}, {rgb.g}, {rgb.b}</span>
      </div>

      {brand.length > 0 && <SwatchRow title="Your brand">{brand.map(dot)}</SwatchRow>}
      {recent.length > 0 && <SwatchRow title="Recent">{recent.map(dot)}</SwatchRow>}
      <SwatchRow title="Palette">{defaults.map(dot)}</SwatchRow>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-bone pt-2.5">
        {allowEmpty ? (
          <button type="button" onClick={() => { onCommit(''); onClose(); }} className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-[12px] font-medium text-slate hover:bg-cream">Use {emptyLabel.toLowerCase()}</button>
        ) : <span />}
        <button type="button" onClick={onClose} className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 bg-brand-orange px-4 text-[12px] font-semibold text-white">Done</button>
      </div>
    </div>
  );
}

function SwatchRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
