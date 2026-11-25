import { useCallback, useId, useRef, useState } from 'react';
import { CalendarRange, X } from 'lucide-react';
import { clsx } from 'clsx';
import { CONTROL_BASE } from './controlStyles';
import { Popover } from './Popover';
import { Calendar } from './Calendar';
import {
  compareYmd, defaultLocale, defaultRangePresets, formatDate, parseDateString, sameYmd, toDateString, type RangePreset, type Ymd,
} from './dateUtils';

/*
 * One field for "from - to": ready-made periods (Today, Last 7 days, This month...) plus a calendar where you tap the
 * first day then the last. Values are plain "YYYY-MM-DD" strings, "" = open end.
 */

export interface DateRangeValue { from: string; to: string }

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  label?: string;
  error?: string;
  id?: string;
  className?: string;
  placeholder?: string;
  presets?: RangePreset[] | false;
  /** Earliest / latest day that can be picked, "YYYY-MM-DD". Default max: today (reports never look ahead). */
  min?: string;
  max?: string;
  /** Allow future days (default false: the default `max` is today). */
  allowFuture?: boolean;
  disabled?: boolean;
  /** Show an X that empties both ends. Default true. */
  clearable?: boolean;
  locale?: string;
  'aria-label'?: string;
}

function summary(v: DateRangeValue, loc: string | undefined): string {
  const f = parseDateString(v.from), t = parseDateString(v.to);
  if (!f && !t) return '';
  if (f && t && sameYmd(f, t)) return formatDate(f, loc);
  if (f && t && f.y === t.y) return `${formatDate(f, loc, { day: 'numeric', month: 'short' })} – ${formatDate(t, loc)}`;
  return `${f ? formatDate(f, loc) : '…'} – ${t ? formatDate(t, loc) : '…'}`;
}

export function DateRangePicker(props: DateRangePickerProps) {
  const { value, onChange, label, error, className, placeholder = 'Select dates', disabled, min, max, allowFuture, locale } = props;
  const loc = locale ?? defaultLocale();
  const auto = useId();
  const fid = props.id ?? auto;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const text = summary(value, loc);
  const clearable = props.clearable ?? true;

  return (
    <div className="w-full">
      {label && <label htmlFor={fid} className="mb-1.5 block text-[12px] font-medium text-charcoal">{label}</label>}
      <div className="relative">
        <button
          ref={anchor}
          id={fid}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={props['aria-label']}
          className={clsx(CONTROL_BASE, 'flex cursor-pointer items-center gap-2 text-start', clearable && text && 'pe-9', error && 'border-error! focus:ring-error/10!', className)}
        >
          <CalendarRange size={15} aria-hidden className="shrink-0 text-slate" />
          <span className={clsx('min-w-0 flex-1 truncate', !text && 'text-slate')}>{text || placeholder}</span>
        </button>
        {clearable && text && !disabled && (
          <button type="button" onClick={() => onChange({ from: '', to: '' })} aria-label="Clear dates"
            className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-slate hover:bg-cream hover:text-charcoal pointer-coarse:h-9 pointer-coarse:w-9">
            <X size={13} />
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>}

      <Popover open={open} onClose={close} anchorRef={anchor} width={324} estimatedHeight={520} sheetTitle={label ?? 'Select dates'}>
        <RangePanel
          value={value}
          presets={props.presets === false ? [] : (props.presets ?? defaultRangePresets())}
          min={parseDateString(min)}
          max={parseDateString(max) ?? (allowFuture ? null : undefined)}
          allowFuture={!!allowFuture}
          locale={loc}
          onCancel={close}
          onApply={next => { onChange(next); close(); anchor.current?.focus(); }}
        />
      </Popover>
    </div>
  );
}

function RangePanel({ value, presets, min, max, allowFuture, locale, onCancel, onApply }: {
  value: DateRangeValue; presets: RangePreset[]; min: Ymd | null; max: Ymd | null | undefined; allowFuture: boolean;
  locale: string | undefined; onCancel: () => void; onApply: (v: DateRangeValue) => void;
}) {
  const [from, setFrom] = useState<Ymd | null>(parseDateString(value.from));
  const [to, setTo] = useState<Ymd | null>(parseDateString(value.to));
  const today = new Date();
  const todayY: Ymd = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  const maxDay: Ymd | null = max === undefined ? (allowFuture ? null : todayY) : max;

  const pickDay = (d: Ymd) => {
    // First tap (or a tap after a finished range) starts a new range; the second one closes it, in either order.
    if (!from || to) { setFrom(d); setTo(null); return; }
    if (compareYmd(d, from) < 0) { setTo(from); setFrom(d); } else setTo(d);
  };

  const applyPreset = (p: RangePreset) => {
    const r = p.range();
    const f = min && compareYmd(r.from, min) < 0 ? min : r.from;
    const t = maxDay && compareYmd(r.to, maxDay) > 0 ? maxDay : r.to;
    onApply({ from: toDateString(f), to: toDateString(t) });
  };

  const activePreset = presets.find(p => {
    const r = p.range();
    return from && to && sameYmd(r.from, from) && sameYmd(r.to, to);
  })?.id;

  const complete = !!from && !!to;
  const line = from ? `${formatDate(from, locale)}${to ? ` – ${formatDate(to, locale)}` : ' – pick the last day'}` : 'Pick the first day';

  return (
    <div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-bone px-3 pb-2.5 pt-3" role="group" aria-label="Quick periods">
          {presets.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={activePreset === p.id}
              className={clsx(
                'h-7 pointer-coarse:h-11 cursor-pointer rounded-full border px-3 text-[12px] font-medium transition-colors',
                activePreset === p.id ? 'border-brand-orange bg-brand-pale-orange text-brand-orange' : 'border-bone bg-white text-carbon hover:bg-cream',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <Calendar
        range={{ from, to }}
        onSelect={pickDay}
        min={min}
        max={maxDay}
        initialView={to ?? from}
        locale={locale}
        autoFocusDay
      />
      <div className="flex items-center justify-between gap-2 border-t border-bone px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[12px] text-slate" aria-live="polite">{line}</p>
        <button type="button" onClick={onCancel} className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border border-bone bg-white px-3 text-[12px] font-semibold text-slate hover:bg-cream">Cancel</button>
        <button
          type="button"
          disabled={!complete}
          onClick={() => from && to && onApply({ from: toDateString(from), to: toDateString(to) })}
          className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 bg-brand-orange px-3 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-bone disabled:text-slate"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
