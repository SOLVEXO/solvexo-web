/**
 * Lets non-React code (the axios client) raise a toast through the ToastProvider.
 * `lastManualToastAt` is when a page last showed its OWN toast: the client waits a moment after a request
 * and stays quiet when the page already told the user, so one action never produces two toasts.
 */
type Variant = 'success' | 'error' | 'info';
type Show = (variant: Variant, message: string) => void;

let impl: Show | null = null;
let lastManualToastAt = 0;

export function registerToastBridge(show: Show): () => void {
  impl = show;
  return () => { if (impl === show) impl = null; };
}

export function noteManualToast(): void {
  lastManualToastAt = Date.now();
}

export function lastManualToast(): number {
  return lastManualToastAt;
}

export function emitAutoToast(variant: Variant, message: string): void {
  impl?.(variant, message);
}
