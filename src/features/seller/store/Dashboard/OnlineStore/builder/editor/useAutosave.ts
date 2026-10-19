import { useEffect, useRef } from 'react';

/**
 * Autosaves a draft shortly after the merchant stops editing. `active` is true only while there is an unsaved edit and
 * nothing is saving/publishing; `version` changes on every edit, so the timer restarts while they are still typing.
 * Autosave only ever writes the DRAFT (never publishes), and a failed save is not retried until the next edit.
 */
export function useAutosave({ active, version, save, delayMs = 3000 }: { active: boolean; version: unknown; save: () => void; delayMs?: number }) {
  const latest = useRef(save);
  useEffect(() => { latest.current = save; });
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => latest.current(), delayMs);
    return () => window.clearTimeout(id);
  }, [active, version, delayMs]);
}
