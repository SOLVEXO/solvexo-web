import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import {
  addDays, addMonths, clampYmd, compareYmd, defaultLocale, monthCells, monthName, sameYmd, startOfWeek,
  todayYmd, weekStartFor, weekdayLabels, type Ymd,
} from './dateUtils';

/*
 * The month grid used by every date picker. Fully keyboard driven (arrows, Home/End, PageUp/PageDown, Enter),
 * can highlight a range, and refuses days outside min / max.
 */

export interface CalendarProps {
  /** Selected day (single mode). */
  value?: Ymd | null;
  onSelect: (d: Ymd) => void;
  /** Range mode: highlight from..to. A day hovered while only `from` is chosen previews the range. */
  range?: { from: Ymd | null; to: Ymd | null };
  min?: Ymd | null;
  max?: Ymd | null;
  /** Month shown first; defaults to the selected day, else today. */
  initialView?: Ymd | null;
  locale?: string;
  weekStart?: 0 | 1;
  /** Extra per-day rule (e.g. block weekends). */
  isDisabled?: (d: Ymd) => boolean;
  autoFocusDay?: boolean;
}

export function Calendar({ value, onSelect, range, min = null, max = null, initialView, locale, weekStart, isDisabled, autoFocusDay }: CalendarProps) {
  const loc = locale ?? defaultLocale();
  const ws = weekStart ?? weekStartFor(loc);
  const today = useMemo(() => todayYmd(), []);
  const start = initialView ?? value ?? range?.from ?? today;

  const [view, setView] = useState({ y: start.y, m: start.m });
  const [focusDay, setFocusDay] = useState<Ymd>(clampYmd(value ?? (start.y === today.y && start.m === today.m ? today : { y: start.y, m: start.m, d: 1 }), min, max));
  const [hover, setHover] = useState<Ymd | null>(null);
  const grid = useRef<HTMLDivElement | null>(null);
  const pendingFocus = useRef(!!autoFocusDay);

  const cells = monthCells(view.y, view.m, ws);
  const heads = useMemo(() => weekdayLabels(loc, ws, 'short'), [loc, ws]);

  const blocked = (d: Ymd) => (min && compareYmd(d, min) < 0) || (max && compareYmd(d, max) > 0) || !!isDisabled?.(d);

  const goTo = (d: Ymd) => {
    setFocusDay(d);
    setView({ y: d.y, m: d.m });
    pendingFocus.current = true;
  };

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>('button[data-focus="true"]')?.focus();
  }, [focusDay, view]);

  const shiftMonth = (n: number) => {
    const t = addMonths({ y: view.y, m: view.m, d: 1 }, n);
    setView({ y: t.y, m: t.m });
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    let next: Ymd | null = null;
    if (k === 'ArrowLeft') next = addDays(focusDay, -1);
    else if (k === 'ArrowRight') next = addDays(focusDay, 1);
    else if (k === 'ArrowUp') next = addDays(focusDay, -7);
    else if (k === 'ArrowDown') next = addDays(focusDay, 7);
    else if (k === 'Home') next = startOfWeek(focusDay, ws);
    else if (k === 'End') next = addDays(startOfWeek(focusDay, ws), 6);
    else if (k === 'PageUp') next = addMonths(focusDay, e.shiftKey ? -12 : -1);
    else if (k === 'PageDown') next = addMonths(focusDay, e.shiftKey ? 12 : 1);
    if (!next) return;
    e.preventDefault();
    goTo(next);
  };

  const rangeEnd = range?.to ?? (range?.from && hover && compareYmd(hover, range.from) >= 0 ? hover : null);
  const inRange = (d: Ymd) => !!range?.from && !!rangeEnd && compareYmd(d, range.from) >= 0 && compareYmd(d, rangeEnd) <= 0;

  const prevOff = !!min && compareYmd(addMonths({ y: view.y, m: view.m, d: 1 }, -1), { y: min.y, m: min.m, d: 1 }) < 0;
  const nextOff = !!max && compareYmd(addMonths({ y: view.y, m: view.m, d: 1 }, 1), { y: max.y, m: max.m, d: 1 }) > 0;

  const navBtn = 'flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-slate transition-colors hover:bg-cream hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="px-3 pb-2 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className={navBtn} onClick={() => shiftMonth(-1)} disabled={prevOff} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <MonthYearTitle view={view} loc={loc} min={min} max={max} onPick={(y, m) => { setView({ y, m }); }} />
        <button type="button" className={navBtn} onClick={() => shiftMonth(1)} disabled={nextOff} aria-label="Next month"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7">
        {heads.map((h, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate">{h}</div>
        ))}
      </div>

      <div ref={grid} role="grid" tabIndex={-1} onKeyDown={onKey} aria-label={`${monthName(loc, view.m)} ${view.y}`} className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-9 pointer-coarse:h-11" />;
          const d: Ymd = { y: view.y, m: view.m, d: day };
          const off = blocked(d);
          const selected = sameYmd(d, value ?? null) || sameYmd(d, range?.from ?? null) || sameYmd(d, range?.to ?? null);
          const isToday = sameYmd(d, today);
          const between = inRange(d) && !selected;
          const isFocus = sameYmd(d, focusDay);
          return (
            <div key={i} className={clsx('flex h-9 pointer-coarse:h-11 items-center justify-center', between && 'bg-brand-pale-orange')}>
              <button
                type="button"
                role="gridcell"
                data-focus={isFocus}
                data-day={`${d.y}-${d.m + 1}-${d.d}`}
                tabIndex={isFocus ? 0 : -1}
                disabled={off}
                aria-selected={selected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={new Date(d.y, d.m, d.d).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                onClick={() => { if (!off) { setFocusDay(d); onSelect(d); } }}
                onMouseEnter={() => setHover(d)}
                className={clsx(
                  'flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 cursor-pointer items-center justify-center rounded-full border text-[12px] pointer-coarse:text-[14px] transition-colors',
                  selected ? 'border-brand-orange bg-brand-orange font-semibold text-white'
                    : off ? 'cursor-not-allowed border-transparent bg-transparent text-[#C5C3BB]'
                    : isToday ? 'border-brand-orange bg-transparent font-semibold text-charcoal hover:bg-brand-pale-orange'
                    : 'border-transparent bg-transparent text-carbon hover:bg-cream',
                )}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "November 2026": click to jump to another month / year without paging through the arrows. */
function MonthYearTitle({ view, loc, min, max, onPick }: { view: { y: number; m: number }; loc: string | undefined; min: Ymd | null; max: Ymd | null; onPick: (y: number, m: number) => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(view.y);
  const yMin = min?.y ?? 1900, yMax = max?.y ?? 2100;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setYear(view.y); setOpen(o => !o); }}
        aria-expanded={open}
        aria-haspopup="true"
        className="cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-1 text-[13px] font-semibold text-charcoal transition-colors hover:bg-cream pointer-coarse:min-h-11"
      >
        {monthName(loc, view.m)} {view.y}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-10 mt-1 w-[236px] -translate-x-1/2 rounded-xl border border-bone bg-white p-2" style={{ boxShadow: '0 12px 30px -10px rgba(20,20,19,.25)' }}>
          <div className="mb-1 flex items-center justify-between">
            <button type="button" className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent text-slate hover:bg-cream disabled:opacity-40" disabled={year <= yMin} onClick={() => setYear(y => y - 1)} aria-label="Previous year"><ChevronLeft size={14} className="mx-auto" /></button>
            <span className="text-[13px] font-semibold text-charcoal">{year}</span>
            <button type="button" className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent text-slate hover:bg-cream disabled:opacity-40" disabled={year >= yMax} onClick={() => setYear(y => y + 1)} aria-label="Next year"><ChevronRight size={14} className="mx-auto" /></button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, m) => {
              const off = (min && (year < min.y || (year === min.y && m < min.m))) || (max && (year > max.y || (year === max.y && m > max.m)));
              const cur = year === view.y && m === view.m;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!!off}
                  onClick={() => { onPick(year, m); setOpen(false); }}
                  className={clsx(
                    'h-9 cursor-pointer rounded-lg border-0 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    cur ? 'bg-brand-orange font-semibold text-white' : 'bg-transparent text-carbon hover:bg-cream',
                  )}
                >
                  {monthName(loc, m, 'short')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
