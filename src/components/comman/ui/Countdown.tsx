/* eslint-disable react-refresh/only-export-components -- a countdown hook and its digit component belong together */
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

/** Time left until `endDate`, ticking every second. */
export function useCountdown(endDate: string) {
  const [remaining, setRemaining] = useState(() => new Date(endDate).getTime() - Date.now());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(new Date(endDate).getTime() - Date.now());
    const id = setInterval(() => setRemaining(new Date(endDate).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const clamped = Math.max(0, remaining);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    expired: clamped <= 0,
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function CountdownUnit({ value, label, size = 'md' }: { value: number; label: string; size?: 'md' | 'sm' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex flex-col items-center gap-[4px]">
      <div
        className={clsx(
          'flex items-center justify-center rounded-[10px] border border-white/15 bg-white font-bold tabular-nums leading-none text-brand-deep-orange',
          isSm ? 'w-[38px] h-[40px] text-[15px]' : 'w-[50px] h-[52px] text-[21px]',
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className={clsx('font-semibold uppercase tracking-[0.06em] text-white/70', isSm ? 'text-[7px]' : 'text-[8.5px]')}>{label}</span>
    </div>
  );
}
