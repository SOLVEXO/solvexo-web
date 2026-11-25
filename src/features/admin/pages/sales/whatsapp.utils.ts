import { useEffect, useState } from 'react';
import { longDate, relDay } from './sales.utils';

const MIN = 60_000;
const HOUR = 60 * MIN;

/** "3:05 PM" */
export const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** The list's time: the clock time today, otherwise "Yesterday", "3 days ago" or a date. */
export const rowTime = (iso: string | null | undefined, now = new Date()) => {
  if (!iso) return '';
  const label = relDay(iso, now);
  return label === 'Today' ? clock(iso) : label;
};

/** Date separators in a chat: Today, Yesterday, then the date. */
export const dayLabel = (iso: string, now = new Date()) => {
  const label = relDay(iso, now);
  return label === 'Today' || label === 'Yesterday' ? label : longDate(iso);
};
export const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

/** Minutes left until `iso`, never below 0. */
const minutesLeft = (iso: string | null | undefined, now: number) => (iso ? Math.max(0, Math.floor((new Date(iso).getTime() - now) / MIN)) : 0);

/** "18h 20m" — or "45m" in the last hour. */
export function timeLeft(iso: string | null | undefined, now = Date.now()) {
  const m = minutesLeft(iso, now);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
/** "18h left" for the list's tag — or "45m left" in the last hour. */
export function shortLeft(iso: string | null | undefined, now = Date.now()) {
  const m = minutesLeft(iso, now);
  return m >= 60 ? `${Math.floor(m / 60)}h left` : `${m}m left`;
}
export const isOpenAt = (iso: string | null | undefined, now = Date.now()) => !!iso && new Date(iso).getTime() > now;
/** Inside the last 4 hours of the reply window (the server's "Closing soon"). */
export const isClosing = (iso: string | null | undefined, now = Date.now()) => isOpenAt(iso, now) && new Date(iso as string).getTime() - now <= 4 * HOUR;

/** The current time, refreshed every `everyMs` (minute precision is enough for the 24-hour window). */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), everyMs); return () => clearInterval(t); }, [everyMs]);
  return now;
}

/** Snooze presets: in 1 hour, tomorrow at 9:00, next Monday at 9:00. */
export function snoozeAt(preset: 'hour' | 'tomorrow' | 'week', from = new Date()): Date {
  const d = new Date(from);
  if (preset === 'hour') return new Date(d.getTime() + HOUR);
  d.setHours(9, 0, 0, 0);
  if (preset === 'tomorrow') d.setDate(d.getDate() + 1);
  else d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return d;
}

/** Per-browser conveniences (panel open/closed, sound muted). Storage can be blocked: never let it break the page. */
export function readPref(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export function writePref(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* storage blocked: the setting lasts until reload */ }
}

let audio: AudioContext | null = null;
/** A short two-note chime, made with the Web Audio API (no sound file). Silently does nothing where audio is blocked. */
export function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    const ctx = audio;
    if (ctx.state === 'suspended') void ctx.resume();
    [880, 1320].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch { /* no audio here */ }
}

/** First name for template previews ({{1}}), or "there". */
export const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || 'there';
