import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { BadgeColor } from '@/types';
import type { ConsentSource, ConsentStatus, LeadBrevoSync, LeadStage, MarketingConsent } from '@/api/services/salesOps';

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


export const CONSENT_COLORS: Record<ConsentStatus, BadgeColor> = { none: 'gray', asked: 'yellow', granted: 'green', withdrawn: 'red' };

/** "24 Nov 2026" */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const AGREED_ON: Record<ConsentSource, string> = {
  demo_form: 'Agreed on the Book a demo form', contact_form: 'Agreed on the Contact Us form', manual: 'Agreed (recorded by the sales team)',
  email_confirm: 'Agreed by email', brevo: 'Agreed in Brevo',
};

/** Marketing-email permission in plain words: "Agreed on the Book a demo form, 24 Nov 2026". */
export function consentSentence(c: MarketingConsent | null | undefined): string {
  const status = c?.status ?? 'none';
  const when = (iso: string | null | undefined) => (iso ? `, ${longDate(iso)}` : '');
  if (status === 'granted') return `${c?.source ? AGREED_ON[c.source] : 'Agreed'}${when(c?.at)}`;
  if (status === 'withdrawn') return `Unsubscribed${c?.source === 'brevo' ? ' in Brevo' : ''}${when(c?.at)}`;
  if (status === 'asked') return `Asked by email${when(c?.askedAt ?? c?.at)}. No answer yet`;
  return 'Not asked yet';
}

/** Where an agreed lead stands in Brevo, or null when there is nothing to say. */
export function brevoLine(b: LeadBrevoSync | null | undefined): { text: string; tone: 'ok' | 'wait' | 'error' } | null {
  if (!b) return null;
  if (b.error) return { text: `Sync failed: ${b.error}`, tone: 'error' };
  if (b.pending) return { text: 'Waiting to sync', tone: 'wait' };
  if (b.syncedAt) return { text: `In Brevo since ${longDate(b.syncedAt)}`, tone: 'ok' };
  return null;
}
