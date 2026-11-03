import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from 'react';
import { noteManualToast, registerToastBridge } from '@/utils/toastBridge';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastEntry {
  id:      number;
  variant: ToastVariant;
  message: string;
  /** Optional click action (e.g. jump to the thing the message is about). */
  onClick?: () => void;
  leaving: boolean;
  paused:  boolean;
}

interface ToastContextValue {
  toasts:  ToastEntry[];
  show:    (variant: ToastVariant, message: string, onClick?: () => void) => void;
  dismiss: (id: number) => void;
  pause:   (id: number) => void;
  resume:  (id: number) => void;
  /** How many themes/pages currently draw their own toast UI (the default ToastContainer stays hidden while > 0). */
  customHosts: number;
  /** A theme that renders its own toasts calls this on mount; call the returned function on unmount. */
  claimHost: () => () => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export const TOAST_DURATION_MS = 3200;
const EXIT_MS = 220;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const [customHosts, setCustomHosts] = useState(0);
  const claimHost = useCallback(() => {
    setCustomHosts(n => n + 1);
    return () => setCustomHosts(n => Math.max(0, n - 1));
  }, []);
  // Per-toast auto-dismiss bookkeeping, kept out of state since it's just
  // timer plumbing — `remaining` lets hovering a toast genuinely pause its
  // countdown instead of merely freezing the progress bar's paint.
  const timers = useRef(new Map<number, { timer: ReturnType<typeof setTimeout>; expiresAt: number; remaining: number }>());

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback((id: number) => {
    const entry = timers.current.get(id);
    if (entry) clearTimeout(entry.timer);
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => remove(id), EXIT_MS);
  }, [remove]);

  const schedule = useCallback((id: number, ms: number) => {
    const timer = setTimeout(() => dismiss(id), ms);
    timers.current.set(id, { timer, expiresAt: Date.now() + ms, remaining: ms });
  }, [dismiss]);

  const pause = useCallback((id: number) => {
    const entry = timers.current.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    entry.remaining = Math.max(entry.expiresAt - Date.now(), 0);
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, paused: true } : t)));
  }, []);

  const resume = useCallback((id: number) => {
    const entry = timers.current.get(id);
    if (!entry) return;
    schedule(id, entry.remaining);
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, paused: false } : t)));
  }, [schedule]);

  const push = useCallback((variant: ToastVariant, message: string, onClick?: () => void) => {
    const id = nextId.current++;
    // A double click / double-fired handler must not stack two identical toasts.
    setToasts(prev => prev.some(t => !t.leaving && t.variant === variant && t.message === message)
      ? prev
      : [...prev, { id, variant, message, onClick, leaving: false, paused: false }].slice(-MAX_VISIBLE));
    schedule(id, TOAST_DURATION_MS);
  }, [schedule]);

  // A page's own toast: remembered, so the API client stays quiet for that action.
  const show = useCallback((variant: ToastVariant, message: string, onClick?: () => void) => {
    noteManualToast();
    push(variant, message, onClick);
  }, [push]);

  // Automatic toasts from the API client (api/client.ts) go through here without marking themselves as "manual".
  useEffect(() => registerToastBridge(push), [push]);

  return (
    <ToastCtx.Provider value={{ toasts, show, dismiss, pause, resume, customHosts, claimHost }}>
      {children}
    </ToastCtx.Provider>
  );
}

/** `toast.success('Added to cart')` / `toast.error(...)` / `toast.info(...)` —
 *  a quick, consistent confirmation for actions that otherwise give no
 *  feedback (remove from cart, clear cart, wishlist, etc.), instead of each
 *  place inventing its own inline banner or none at all. */
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return {
    success: (message: string, onClick?: () => void) => ctx.show('success', message, onClick),
    error:   (message: string, onClick?: () => void) => ctx.show('error', message, onClick),
    info:    (message: string, onClick?: () => void) => ctx.show('info', message, onClick),
  };
}

export function useToastList() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToastList must be used inside ToastProvider');
  return ctx;
}
