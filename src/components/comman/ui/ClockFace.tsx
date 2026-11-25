import { useState, type KeyboardEvent } from 'react';
import { clsx } from 'clsx';

/*
 * The round hour / minute picker (one tap on the hour, then one on the minute) plus the HH : MM display and AM/PM.
 * Extracted from the old DateTimePickerModal so the date-time dialog and the time field share it.
 * It works on a 12 hour clock; callers convert with `to12h` / `to24h` from dateUtils.
 */

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const CX = 110, CY = 110, R_BG = 100, R_ITEM = 78;

function polar(val: number, outOf: number, r: number) {
  const a = ((val / outOf) * 360 - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

export interface ClockFaceProps {
  hour: number;               // 1-12
  minute: number;             // 0-59
  ampm: 'AM' | 'PM';
  onChange: (next: { hour: number; minute: number; ampm: 'AM' | 'PM' }) => void;
}

export function ClockFace({ hour, minute, ampm, onChange }: ClockFaceProps) {
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const handPos = mode === 'hour' ? polar(hour === 12 ? 0 : hour, 12, R_ITEM) : polar(minute, 60, R_ITEM);
  // A minute that is not a multiple of 5 (typed, or loaded from a saved value) has no number on the face: the hand
  // still points at it, and the display shows it exactly.
  const minuteOnFace = MINS.includes(minute);

  const key = (fn: () => void) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const bump = (field: 'hour' | 'minute', dir: 1 | -1) => {
    if (field === 'hour') onChange({ hour: ((hour - 1 + dir + 12) % 12) + 1, minute, ampm });
    else onChange({ hour, minute: (minute + dir + 60) % 60, ampm });
  };
  const onDigitKey = (field: 'hour' | 'minute') => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); bump(field, 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); bump(field, -1); }
  };

  const digit = 'flex h-[48px] w-[60px] cursor-pointer select-none items-center justify-center rounded-[10px] border-0 text-[26px] font-bold transition-colors duration-150';

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-2">
        <button type="button" onClick={() => setMode('hour')} onKeyDown={onDigitKey('hour')} aria-label={`Hour ${hh}`} aria-pressed={mode === 'hour'}
          className={clsx(digit, mode === 'hour' ? 'bg-brand-orange text-white' : 'bg-cream text-carbon')}>{hh}</button>
        <span className="select-none text-[26px] font-bold leading-none text-[#c8c4bb]">:</span>
        <button type="button" onClick={() => setMode('minute')} onKeyDown={onDigitKey('minute')} aria-label={`Minute ${mm}`} aria-pressed={mode === 'minute'}
          className={clsx(digit, mode === 'minute' ? 'bg-brand-orange text-white' : 'bg-cream text-carbon')}>{mm}</button>
        <div className="ml-1 flex flex-col gap-1.5">
          {(['AM', 'PM'] as const).map(p => (
            <button key={p} type="button" onClick={() => onChange({ hour, minute, ampm: p })} aria-pressed={ampm === p}
              className={clsx(
                'flex h-[22px] w-[40px] pointer-coarse:min-h-11 cursor-pointer items-center justify-center rounded-md border-0 text-[11px] pointer-coarse:text-[13px] font-bold transition-colors duration-150',
                ampm === p ? 'bg-brand-orange text-white' : 'bg-bone text-slate',
              )}>{p}</button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ display: 'block' }} role="group" aria-label={mode === 'hour' ? 'Choose the hour' : 'Choose the minute'}>
          <circle cx={CX} cy={CY} r={R_BG} fill="#F5F4EF" stroke="#E8E6DC" strokeWidth="1.5" />
          <line x1={CX} y1={CY} x2={handPos.x} y2={handPos.y} stroke="#D97757" strokeWidth="2" strokeLinecap="round" />
          <circle cx={handPos.x} cy={handPos.y} r="15" fill="#D97757" />
          <circle cx={CX} cy={CY} r="3.5" fill="#D97757" />
          {mode === 'hour'
            ? HOURS.map(h => {
                const pos = polar(h === 12 ? 0 : h, 12, R_ITEM);
                const active = h === hour;
                const pick = () => { onChange({ hour: h, minute, ampm }); setMode('minute'); };
                return (
                  <g key={h} role="button" tabIndex={0} aria-label={`${h} o'clock`} aria-pressed={active} style={{ cursor: 'pointer' }} onClick={pick} onKeyDown={key(pick)}>
                    <circle cx={pos.x} cy={pos.y} r="16" fill="transparent" />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fill={active ? '#fff' : '#141413'} style={{ fontWeight: active ? 700 : 500, userSelect: 'none', pointerEvents: 'none' }}>{h}</text>
                  </g>
                );
              })
            : MINS.map(m => {
                const pos = polar(m, 60, R_ITEM);
                const active = m === minute && minuteOnFace;
                const pick = () => onChange({ hour, minute: m, ampm });
                return (
                  <g key={m} role="button" tabIndex={0} aria-label={`${m} minutes`} aria-pressed={active} style={{ cursor: 'pointer' }} onClick={pick} onKeyDown={key(pick)}>
                    <circle cx={pos.x} cy={pos.y} r="16" fill="transparent" />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill={active ? '#fff' : '#141413'} style={{ fontWeight: active ? 700 : 500, userSelect: 'none', pointerEvents: 'none' }}>{String(m).padStart(2, '0')}</text>
                  </g>
                );
              })}
        </svg>
      </div>

      <p className="mt-1.5 text-center text-[11px] text-slate">
        {mode === 'hour' ? 'Tap an hour, then set the minutes' : 'Tap a minute · or use ↑ ↓ on the numbers above'}
      </p>
    </div>
  );
}
