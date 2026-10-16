import { useState } from 'react';

/** State for a "confirm, then run an async action" dialog: pick a target, confirm, error stays in the dialog. */
export function useConfirmAction<T>(run: (target: T) => Promise<void>, onDone: () => void) {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = (t: T) => { setError(''); setTarget(t); };
  const close = () => { if (!busy) setTarget(null); };
  const confirm = async () => {
    if (!target) return;
    setBusy(true); setError('');
    try { await run(target); setTarget(null); onDone(); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); } finally { setBusy(false); }
  };
  return { target, busy, error, open, close, confirm };
}
