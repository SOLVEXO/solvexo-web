import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetPaymentStatus, type PaymentStatus, type PlacedOrder } from '@/api/services/payment';

interface Options {
  /** Start polling on mount (return page) instead of waiting for `start()` (after Stripe confirms). */
  autoStart: boolean;
  intervalMs: number;
  /** After this the screen may say "taking longer than expected"; polling keeps going, slower. */
  timeoutMs: number;
  /** Called once per run when the payment is confirmed server-side. */
  onCompleted?: (orders: PlacedOrder[]) => void;
}

interface Result { run: number; status: PaymentStatus; orders: PlacedOrder[]; timedOut: boolean }

/**
 * Polls `GET payment/status` (which re-checks the gateway and finalizes the order if the webhook has not landed yet).
 * Nothing from the URL is ever trusted as proof of payment. Results are tagged with the run that produced them, so
 * `start()` / `reset()` never show stale data.
 */
export function usePaymentStatus(checkoutId: string | undefined, { autoStart, intervalMs, timeoutMs, onCompleted }: Options) {
  const [run, setRun] = useState(autoStart ? 1 : 0);
  const [result, setResult] = useState<Result | null>(null);
  const doneRef = useRef(onCompleted);
  useEffect(() => { doneRef.current = onCompleted; });

  useEffect(() => {
    if (!checkoutId || run === 0) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await apiGetPaymentStatus(checkoutId);
        if (stopped) return;
        const { status, orders } = res.data;
        if (status === 'completed') {
          doneRef.current?.(orders ?? []);
          setResult({ run, status, orders: orders ?? [], timedOut: false });
          return;
        }
        if (status === 'failed') { setResult({ run, status, orders: [], timedOut: false }); return; }
      } catch { /* transient - keep polling */ }
      if (!stopped) timer = setTimeout(poll, Date.now() - startedAt > timeoutMs ? Math.max(intervalMs * 3, 5000) : intervalMs);
    };
    void poll();

    const slow = setTimeout(() => {
      if (!stopped) setResult(prev => (prev && prev.run === run && prev.status !== 'pending' ? prev : { run, status: 'pending', orders: [], timedOut: true }));
    }, timeoutMs);

    return () => { stopped = true; if (timer) clearTimeout(timer); clearTimeout(slow); };
  }, [checkoutId, run, intervalMs, timeoutMs]);

  const current = result && result.run === run ? result : null;
  const status: PaymentStatus = current?.status ?? 'pending';
  return {
    status,
    orders: current?.orders ?? [],
    timedOut: !!current?.timedOut && status === 'pending',
    polling: run > 0 && status === 'pending',
    start: useCallback(() => setRun(n => n + 1), []),
    reset: useCallback(() => setRun(0), []),
  };
}
