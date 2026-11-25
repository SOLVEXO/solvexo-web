import { forwardRef, useCallback, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { CalendarDays, CalendarClock, Clock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { CONTROL_BASE } from './controlStyles';
import { Popover } from './Popover';
import { Calendar } from './Calendar';
import { DateTimePickerModal } from './DateTimePickerModal';
import {
  defaultLocale, formatDate, formatTime, parseDateString, parseTimeString, todayYmd, toDateString, type Ymd,
} from './dateUtils';

/*
 * Form fields for dates. They look like every other input (same height, border, focus ring), open the shared calendar,
 * and are drop-in replacements for `<Input type="date|datetime-local|time">`:
 *   - `value` / `onChange(e)` keep the native shape (`e.target.value` is "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm" / "HH:mm"),
 *   - `onValueChange(value)` is the shorter form,
 *   - `name` / `required` still work inside a <form> (a hidden native input carries them).
 */

interface BaseProps {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  name?: string;
  value?: string;
  /** Native-shaped handler so existing `onChange={e => set(e.target.value)}` code keeps working. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Earliest / latest allowed day, "YYYY-MM-DD". */
  min?: string;
  max?: string;
  /** Show an X that empties the field. Default: yes when the field is not `required`. */
  clearable?: boolean;
  locale?: string;
  'aria-label'?: string;
}

function emit(p: Pick<BaseProps, 'onChange' | 'onValueChange' | 'name' | 'id'>, value: string) {
  p.onValueChange?.(value);
  if (p.onChange) {
    const target = { value, name: p.name ?? '', id: p.id ?? '' };
    p.onChange({ target, currentTarget: target } as unknown as ChangeEvent<HTMLInputElement>);
  }
}

interface TriggerProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  text: string;
  placeholder: string;
  icon: ReactNode;
  disabled?: boolean;
  required?: boolean;
  open: boolean;
  onOpen: () => void;
  onClear?: () => void;
  className?: string;
  name?: string;
  nativeType: 'date' | 'datetime-local' | 'time';
  nativeValue: string;
  ariaLabel?: string;
  children?: ReactNode;
}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(p, ref) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const labelId = `${p.id}-label`;
  return (
    <div className="w-full">
      {p.label && <label id={labelId} htmlFor={p.id} className="mb-1.5 block text-[12px] font-medium text-charcoal">{p.label}</label>}
      <div ref={wrap} className="relative" data-picker-anchor>
        <button
          ref={ref}
          id={p.id}
          type="button"
          disabled={p.disabled}
          onClick={p.onOpen}
          aria-haspopup="dialog"
          aria-expanded={p.open}
          aria-label={p.ariaLabel}
          aria-labelledby={p.label && !p.ariaLabel ? labelId : undefined}
          className={clsx(
            CONTROL_BASE, 'flex cursor-pointer items-center gap-2 text-start',
            p.onClear && p.text && 'pe-9',
            p.error && 'border-error! focus:ring-error/10!',
            p.className,
          )}
        >
          <span className="shrink-0 text-slate">{p.icon}</span>
          <span className={clsx('min-w-0 flex-1 truncate', !p.text && 'text-slate')}>{p.text || p.placeholder}</span>
        </button>
        {p.onClear && p.text && !p.disabled && (
          <button
            type="button"
            onClick={p.onClear}
            aria-label="Clear"
            className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-slate hover:bg-cream hover:text-charcoal pointer-coarse:h-9 pointer-coarse:w-9"
          >
            <X size={13} />
          </button>
        )}
        {(p.name || p.required) && (
          <input
            type={p.nativeType}
            name={p.name}
            required={p.required}
            value={p.nativeValue}
            onChange={() => {}}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        )}
      </div>
      {p.children}
      {p.hint && !p.error && <p className="mt-1 text-[11px] text-slate">{p.hint}</p>}
      {p.error && <p role="alert" className="mt-1 text-[11px] text-error">{p.error}</p>}
    </div>
  );
});

/* ────────────────────────────── DateField ────────────────────────────── */

export function DateField(props: BaseProps) {
  const { label, error, hint, name, value = '', required, disabled, placeholder = 'Select date', className, min, max, locale, id } = props;
  const loc = locale ?? defaultLocale();
  const auto = useId();
  const fid = id ?? auto;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const sel = parseDateString(value);
  const clearable = props.clearable ?? !required;
  const set = (v: string) => emit({ onChange: props.onChange, onValueChange: props.onValueChange, name, id: fid }, v);
  const pick = (d: Ymd) => { set(toDateString(d)); setOpen(false); anchor.current?.focus(); };

  const minD = parseDateString(min), maxD = parseDateString(max);
  const today = todayYmd();
  const todayOk = (!minD || toDateString(today) >= toDateString(minD)) && (!maxD || toDateString(today) <= toDateString(maxD));

  return (
    <>
      <Trigger
        ref={anchor}
        id={fid} label={label} error={error} hint={hint} name={name} required={required} disabled={disabled} className={className}
        text={sel ? formatDate(sel, loc) : ''} placeholder={placeholder}
        icon={<CalendarDays size={15} aria-hidden />} open={open} onOpen={() => setOpen(o => !o)}
        onClear={clearable ? () => set('') : undefined}
        nativeType="date" nativeValue={sel ? toDateString(sel) : ''} ariaLabel={props['aria-label']}
      />
      <Popover open={open} onClose={close} anchorRef={anchor} width={304} estimatedHeight={380} sheetTitle={label ?? placeholder}>
        <Calendar value={sel} onSelect={pick} min={minD} max={maxD} locale={loc} autoFocusDay />
        <div className="flex items-center justify-between gap-2 border-t border-bone px-3 py-2">
          <button type="button" disabled={!todayOk} onClick={() => pick(today)} className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-[12px] font-semibold text-brand-orange hover:bg-brand-pale-orange disabled:cursor-not-allowed disabled:opacity-40">Today</button>
          {clearable && sel && (
            <button type="button" onClick={() => { set(''); setOpen(false); }} className="h-8 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-[12px] font-medium text-slate hover:bg-cream">Clear</button>
          )}
        </div>
      </Popover>
    </>
  );
}

/* ────────────────────────────── DateTimeField ────────────────────────────── */

interface DateTimeFieldProps extends BaseProps {
  /** Allow days and times that already passed (default: false for scheduling, true when `allowPast` is set). */
  allowPast?: boolean;
  /** Title of the dialog. */
  dialogTitle?: string;
  confirmLabel?: string;
  previewLabel?: string;
}

export function DateTimeField(props: DateTimeFieldProps) {
  const { label, error, hint, name, value = '', required, disabled, placeholder = 'Select date & time', className, min, max, locale, id, allowPast = true } = props;
  const loc = locale ?? defaultLocale();
  const auto = useId();
  const fid = id ?? auto;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);

  const d = parseDateString(value);
  const t = parseTimeString(value);
  const clearable = props.clearable ?? !required;
  const set = (v: string) => emit({ onChange: props.onChange, onValueChange: props.onValueChange, name, id: fid }, v);
  const text = d && t ? `${formatDate(d, loc)}, ${formatTime(t.h24, t.minute, loc)}` : '';

  return (
    <>
      <Trigger
        ref={anchor}
        id={fid} label={label} error={error} hint={hint} name={name} required={required} disabled={disabled} className={className}
        text={text} placeholder={placeholder}
        icon={<CalendarClock size={15} aria-hidden />} open={open} onOpen={() => setOpen(true)}
        onClear={clearable ? () => set('') : undefined}
        nativeType="datetime-local" nativeValue={d && t ? value.slice(0, 16) : ''} ariaLabel={props['aria-label']}
      />
      {open && (
        <DateTimePickerModal
          value={value}
          onChange={set}
          onClose={() => { setOpen(false); anchor.current?.focus(); }}
          mode="datetime"
          allowPast={allowPast}
          min={min}
          max={max}
          locale={loc}
          title={props.dialogTitle ?? label ?? 'Choose date & time'}
          confirmLabel={props.confirmLabel ?? 'Confirm'}
          previewLabel={props.previewLabel ?? 'Selected'}
          clearable={clearable}
        />
      )}
    </>
  );
}

/* ────────────────────────────── TimeField ────────────────────────────── */

export function TimeField(props: Omit<BaseProps, 'min' | 'max'> & { dialogTitle?: string }) {
  const { label, error, hint, name, value = '', required, disabled, placeholder = 'Select time', className, locale, id } = props;
  const loc = locale ?? defaultLocale();
  const auto = useId();
  const fid = id ?? auto;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);

  const t = parseTimeString(value);
  const clearable = props.clearable ?? !required;
  const set = (v: string) => emit({ onChange: props.onChange, onValueChange: props.onValueChange, name, id: fid }, v);

  return (
    <>
      <Trigger
        ref={anchor}
        id={fid} label={label} error={error} hint={hint} name={name} required={required} disabled={disabled} className={className}
        text={t ? formatTime(t.h24, t.minute, loc) : ''} placeholder={placeholder}
        icon={<Clock size={15} aria-hidden />} open={open} onOpen={() => setOpen(true)}
        onClear={clearable ? () => set('') : undefined}
        nativeType="time" nativeValue={t ? value.slice(-5) : ''} ariaLabel={props['aria-label']}
      />
      {open && (
        <DateTimePickerModal
          value={value}
          onChange={set}
          onClose={() => { setOpen(false); anchor.current?.focus(); }}
          mode="time"
          locale={loc}
          title={props.dialogTitle ?? label ?? 'Choose a time'}
          confirmLabel="Confirm"
          previewLabel="Selected"
          clearable={clearable}
        />
      )}
    </>
  );
}

/* ────────────────────────────── MonthField ────────────────────────────── */

/** Pick a month ("YYYY-MM"): replaces `<Input type="month">`. */
export function MonthField(props: BaseProps) {
  const { label, error, hint, name, value = '', required, disabled, placeholder = 'Select month', className, min, max, locale, id } = props;
  const loc = locale ?? defaultLocale();
  const auto = useId();
  const fid = id ?? auto;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const parse = (v?: string) => { const m = /^(\d{4})-(\d{2})/.exec(v ?? ''); return m ? { y: Number(m[1]), m: Number(m[2]) - 1 } : null; };
  const sel = parse(value);
  const minM = parse(min), maxM = parse(max);
  const [year, setYear] = useState(sel?.y ?? new Date().getFullYear());
  const clearable = props.clearable ?? !required;
  const set = (v: string) => emit({ onChange: props.onChange, onValueChange: props.onValueChange, name, id: fid }, v);
  const label12 = (m: number) => new Intl.DateTimeFormat(loc, { month: 'short' }).format(new Date(2023, m, 1));
  const text = sel ? new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(new Date(sel.y, sel.m, 1)) : '';
  const cmp = (a: { y: number; m: number }, b: { y: number; m: number }) => a.y - b.y || a.m - b.m;

  return (
    <>
      <Trigger
        ref={anchor}
        id={fid} label={label} error={error} hint={hint} name={name} required={required} disabled={disabled} className={className}
        text={text} placeholder={placeholder}
        icon={<CalendarDays size={15} aria-hidden />} open={open}
        onOpen={() => { setYear(sel?.y ?? new Date().getFullYear()); setOpen(o => !o); }}
        onClear={clearable ? () => set('') : undefined}
        nativeType="date" nativeValue={sel ? `${sel.y}-${String(sel.m + 1).padStart(2, '0')}-01` : ''} ariaLabel={props['aria-label']}
      />
      <Popover open={open} onClose={close} anchorRef={anchor} width={264} estimatedHeight={250} sheetTitle={label ?? placeholder}>
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous year" onClick={() => setYear(y => y - 1)} disabled={!!minM && year <= minM.y} className="h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 cursor-pointer rounded-lg border-0 bg-transparent text-slate hover:bg-cream disabled:opacity-40">‹</button>
            <span className="text-[13px] font-semibold text-charcoal">{year}</span>
            <button type="button" aria-label="Next year" onClick={() => setYear(y => y + 1)} disabled={!!maxM && year >= maxM.y} className="h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 cursor-pointer rounded-lg border-0 bg-transparent text-slate hover:bg-cream disabled:opacity-40">›</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, m) => {
              const off = (minM && cmp({ y: year, m }, minM) < 0) || (maxM && cmp({ y: year, m }, maxM) > 0);
              const cur = !!sel && sel.y === year && sel.m === m;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!!off}
                  onClick={() => { set(`${year}-${String(m + 1).padStart(2, '0')}`); setOpen(false); anchor.current?.focus(); }}
                  className={clsx(
                    'h-10 pointer-coarse:h-11 cursor-pointer rounded-lg border-0 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    cur ? 'bg-brand-orange font-semibold text-white' : 'bg-transparent text-carbon hover:bg-cream',
                  )}
                >
                  {label12(m)}
                </button>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
}
