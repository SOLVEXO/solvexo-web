import { useId, useMemo, useState } from 'react';
import { X, CalendarClock, CalendarDays, Clock } from 'lucide-react';
import { DialogShell } from './DialogShell';
import { Calendar } from './Calendar';
import { ClockFace } from './ClockFace';
import {
  defaultLocale, formatDate, parseDateString, parseTimeString, to12h, to24h, todayYmd, toDateString, toDateTimeString,
  toTimeString, type Ymd,
} from './dateUtils';

export interface DateTimePickerModalProps {
  /** "YYYY-MM-DDTHH:mm" (datetime), "YYYY-MM-DD" (date) or "HH:mm" (time). Empty = nothing chosen yet. */
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  /** Defaults to the original "Schedule Go-Live" copy (product scheduling): override for other callers. */
  title?: string;
  /** What is picked. Default `datetime`. */
  mode?: 'datetime' | 'date' | 'time';
  /** Allow days (and, for today, times) that already passed. Default false: scheduling dialogs only look forward. */
  allowPast?: boolean;
  /** Earliest / latest allowed day, "YYYY-MM-DD" (a datetime string works too). */
  min?: string;
  max?: string;
  /** Show a "Clear" button that calls `onChange('')`. */
  clearable?: boolean;
  confirmLabel?: string;
  /** Small line under the title. */
  subtitle?: string;
  /** Heading of the preview strip once something is chosen ("Going live on"). */
  previewLabel?: string;
  locale?: string;
}

const DEFAULT_TITLE = 'Schedule Go-Live';

export function DateTimePickerModal({
  value, onChange, onClose, title = DEFAULT_TITLE, mode = 'datetime', allowPast = false, min, max, clearable = false,
  confirmLabel, subtitle, previewLabel, locale,
}: DateTimePickerModalProps) {
  const titleId = useId();
  const loc = locale ?? defaultLocale();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => todayYmd(now), [now]);

  const withDate = mode !== 'time';
  const withTime = mode !== 'date';

  const initDate = parseDateString(value);
  const initTime = parseTimeString(value);
  const [sel, setSel] = useState<Ymd | null>(initDate);
  const start12 = to12h(initTime?.h24 ?? 10);
  const [clock, setClock] = useState({ hour: start12.hour, minute: initTime?.minute ?? 0, ampm: start12.ampm });

  const minDay = useMemo(() => {
    const m = parseDateString(min);
    if (m) return m;
    return allowPast ? null : today;
  }, [min, allowPast, today]);
  const maxDay = useMemo(() => parseDateString(max), [max]);

  const h24 = to24h(clock.hour, clock.ampm);
  const ready = withDate ? !!sel : true;

  // Choosing today with a time that is already behind us is allowed (it can be deliberate), but say so.
  const inThePast = !allowPast && withDate && withTime && !!sel
    && toDateTimeString(sel, h24, clock.minute) < toDateTimeString(today, now.getHours(), now.getMinutes());

  const confirm = () => {
    if (!ready) return;
    if (mode === 'date' && sel) onChange(toDateString(sel));
    else if (mode === 'time') onChange(toTimeString(h24, clock.minute));
    else if (sel) onChange(toDateTimeString(sel, h24, clock.minute));
    onClose();
  };

  const timeLabel = new Date(2023, 0, 1, h24, clock.minute).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
  const dateLabel = sel ? formatDate(sel, loc, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const preview = mode === 'time' ? timeLabel : mode === 'date' ? dateLabel : dateLabel ? `${dateLabel}  ·  ${timeLabel}` : null;

  const HeaderIcon = mode === 'time' ? Clock : mode === 'date' ? CalendarDays : CalendarClock;
  const sub = subtitle ?? (mode === 'time' ? 'Choose a time' : mode === 'date' ? 'Choose a date' : 'Choose date & time');
  const idleText = mode === 'time' ? 'Set the time above' : 'Select a date from the calendar above';
  const live = previewLabel ?? (title === DEFAULT_TITLE ? 'Going live on' : 'Selected');
  const okText = confirmLabel ?? (title === DEFAULT_TITLE ? 'Confirm Schedule' : 'Confirm');

  return (
    <DialogShell onClose={onClose} ariaLabelledBy={titleId} className="max-w-[360px] max-h-[92vh]">
      <div className="flex shrink-0 items-center justify-between border-b border-bone px-5 py-[14px]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-pale-orange">
            <HeaderIcon size={15} className="text-brand-orange" />
          </div>
          <div>
            <p id={titleId} className="text-[14px] font-bold leading-tight text-charcoal">{title}</p>
            <p className="mt-[1px] text-[11px] text-slate">{sub}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="flex h-7 w-7 pointer-coarse:h-11 pointer-coarse:w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-bone text-slate transition-colors hover:bg-[#e0ded6] hover:text-charcoal"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {withDate && (
          <div className="px-2 pt-1">
            <Calendar value={sel} onSelect={setSel} min={minDay} max={maxDay} locale={loc} autoFocusDay={false} />
            <div className="mx-3 flex flex-wrap gap-1.5 pb-2">
              <QuickChip onClick={() => { if (!minDay || toDateString(today) >= toDateString(minDay)) setSel(today); }} disabled={!!minDay && toDateString(today) < toDateString(minDay)}>Today</QuickChip>
              {sel && clearable && <QuickChip onClick={() => setSel(null)}>No date</QuickChip>}
            </div>
          </div>
        )}

        {withDate && withTime && <div className="mx-5 h-px bg-bone" />}

        {withTime && (
          <div className="px-5 pb-3 pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-slate">Time</p>
            <ClockFace hour={clock.hour} minute={clock.minute} ampm={clock.ampm} onChange={setClock} />
          </div>
        )}

        <div
          className="mx-5 mb-4 rounded-[10px] border px-4 py-3 transition-colors duration-200"
          style={{ background: preview && ready ? '#FBECE4' : '#F5F4EF', borderColor: preview && ready ? 'rgba(217,119,87,0.3)' : '#E8E6DC' }}
          aria-live="polite"
        >
          <p className="mb-[3px] text-[10px] font-bold uppercase tracking-[0.07em]" style={{ color: preview && ready ? '#D97757' : '#8C8A82' }}>
            {preview && ready ? live : 'Nothing selected'}
          </p>
          <p className="text-[13px] font-semibold text-charcoal">{preview && ready ? preview : idleText}</p>
          {inThePast && <p className="mt-1 text-[11px] text-[#B45309]">That time has already passed today.</p>}
        </div>
      </div>

      <div className="flex shrink-0 gap-2.5 border-t border-bone px-5 py-4">
        {clearable && value ? (
          <button
            type="button"
            onClick={() => { onChange(''); onClose(); }}
            className="h-[42px] cursor-pointer rounded-[10px] border border-bone bg-white px-4 text-[13px] font-semibold text-slate transition-colors hover:bg-cream"
          >
            Clear
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="h-[42px] flex-1 cursor-pointer rounded-[10px] border border-bone bg-white text-[13px] font-semibold text-slate transition-colors hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!ready}
          className="h-[42px] flex-1 rounded-[10px] border-none text-[13px] font-semibold transition-colors duration-150"
          style={{ background: ready ? '#D97757' : '#E8E6DC', color: ready ? '#fff' : '#B5B3AC', cursor: ready ? 'pointer' : 'not-allowed' }}
        >
          {okText}
        </button>
      </div>
    </DialogShell>
  );
}

function QuickChip({ children, onClick, disabled }: { children: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-7 pointer-coarse:h-11 cursor-pointer rounded-full border border-bone bg-white px-3 text-[12px] font-medium text-carbon transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
