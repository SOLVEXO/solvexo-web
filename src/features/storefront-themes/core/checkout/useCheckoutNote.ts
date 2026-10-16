import { useRef, useState } from 'react';
import { apiSetCheckoutNote } from '@/api/services/checkout';

export const CHECKOUT_NOTE_MAX = 500;

/** The buyer's note to the seller (Shopify cart note): local text, saved to the open checkout when the field loses focus. Key the caller by checkout id so a new checkout starts fresh. */
export function useCheckoutNote(checkoutId: string | undefined, initial: string | undefined) {
  const [note, setNote] = useState(initial ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastSaved = useRef(initial ?? '');

  async function save() {
    const next = note.trim();
    if (!checkoutId || next === lastSaved.current) return;
    setState('saving');
    try { await apiSetCheckoutNote(checkoutId, next); lastSaved.current = next; setState('saved'); }
    catch { setState('error'); }
  }
  return { note, setNote: (v: string) => { setNote(v.slice(0, CHECKOUT_NOTE_MAX)); setState('idle'); }, save, state };
}
