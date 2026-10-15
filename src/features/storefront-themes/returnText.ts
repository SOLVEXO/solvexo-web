import { tt } from '@/utils/tStatic';
/** Short status text for a returned line (buyer wording, both themes). */
export function buyerReturnText(status: string | undefined | null): string {
  switch (status) {
    case 'requested': return tt('returns.requested', "Return requested");
    case 'approved': return tt('returns.approved', "Return approved");
    case 'received': return tt('returns.received', "Return received");
    case 'refunded': return tt('order.refunded', "Refunded");
    case 'exchanged': return tt('returns.exchanged', "Exchanged");
    case 'closed': return tt('returns.closed', "Return closed");
    case 'rejected': return tt('returns.declined', "Return declined");
    default: return tt('returns.requestedShort', "Requested");
  }
}

/** One-line "what happens next" hint for the buyer. */
export function returnNextStepHint(status: string | undefined | null): string | null {
  if (status === 'requested') return tt('returns.hint.requested', "The store is reviewing your request.");
  if (status === 'approved') return tt('returns.hint.approved', "Send the item back to the store. Your refund is issued once they receive it.");
  if (status === 'received') return tt('returns.hint.received', "The store received your item and is processing your refund or exchange.");
  return null;
}
