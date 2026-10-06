/** Short status text for a returned line (buyer wording, both themes). */
export function buyerReturnText(status: string | undefined | null): string {
  switch (status) {
    case 'requested': return 'Return requested';
    case 'approved': return 'Return approved';
    case 'received': return 'Return received';
    case 'refunded': return 'Refunded';
    case 'exchanged': return 'Exchanged';
    case 'closed': return 'Return closed';
    case 'rejected': return 'Return declined';
    default: return 'Requested';
  }
}

/** One-line "what happens next" hint for the buyer. */
export function returnNextStepHint(status: string | undefined | null): string | null {
  if (status === 'requested') return 'The store is reviewing your request.';
  if (status === 'approved') return 'Send the item back to the store. Your refund is issued once they receive it.';
  if (status === 'received') return 'The store received your item and is processing your refund or exchange.';
  return null;
}
