import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { BadgeColor } from '@/types';
import type { LeadStage } from '@/api/services/salesOps';

/** useToast() builds a new object every render; this one is stable, so it is safe in effect/callback deps. */
export function useStableToast() {
  const t = useToast();
  const ref = useRef(t);
  useEffect(() => { ref.current = t; });
  const [stable] = useState(() => ({
    success: (m: string) => ref.current.success(m),
    error: (m: string) => ref.current.error(m),
    info: (m: string) => ref.current.info(m),
  }));
  return stable;
}

export const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const STAGE_COLORS: Record<LeadStage, BadgeColor> = {
  new: 'blue', contacted: 'orange', demo: 'yellow', trial: 'yellow', won: 'green', lost: 'red',
};

const DAY = 86_400_000;
/** "Today", "Tomorrow", "3 days ago", "in 5 days" — or a date beyond two weeks. */
export function relDay(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(now)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (Math.abs(diff) <= 14) return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}
export const isOverdue = (iso: string | null | undefined, now = new Date()) => !!iso && new Date(iso).getTime() < now.getTime();

