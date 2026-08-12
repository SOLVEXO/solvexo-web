import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastEntry {
  id:      number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  toasts: ToastEntry[];
  show:   (variant: ToastVariant, message: string) => void;
  dismiss: (id: number) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 2800;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((variant: ToastVariant, message: string) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, variant, message }].slice(-MAX_VISIBLE));
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toasts, show, dismiss }}>
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
    success: (message: string) => ctx.show('success', message),
    error:   (message: string) => ctx.show('error', message),
    info:    (message: string) => ctx.show('info', message),
  };
}

export function useToastList() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToastList must be used inside ToastProvider');
  return ctx;
}
