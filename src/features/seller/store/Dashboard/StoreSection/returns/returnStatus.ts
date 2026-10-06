/** Shopify-style return lifecycle labels/colours shared by the Returns list and the order's Returns card. */
export const RETURN_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  requested:         { bg: '#FFF4DC', color: '#B36200', label: 'Requested' },
  partial_requested: { bg: '#FFF4DC', color: '#B36200', label: 'Requested' },
  approved:          { bg: '#E6EFFB', color: '#1F5FB4', label: 'Approved - awaiting items' },
  partial_approved:  { bg: '#E6EFFB', color: '#1F5FB4', label: 'Approved - awaiting items' },
  received:          { bg: '#EFE8FB', color: '#6B3FB4', label: 'Received' },
  partial_received:  { bg: '#EFE8FB', color: '#6B3FB4', label: 'Received' },
  refunded:          { bg: '#E3F4EA', color: '#1E7A3C', label: 'Refunded' },
  exchanged:         { bg: '#E3F4EA', color: '#1E7A3C', label: 'Exchanged' },
  resolved:          { bg: '#E3F4EA', color: '#1E7A3C', label: 'Resolved' },
  closed:            { bg: '#F0EEE6', color: '#5A5852', label: 'Closed' },
  rejected:          { bg: '#FDECEA', color: '#C0392B', label: 'Declined' },
};

export function returnStatusLabel(status: string): string {
  return RETURN_STATUS_STYLE[status]?.label ?? status.replace(/_/g, ' ');
}

/** Statuses that still need the seller (request to review, goods to receive, received line to refund/exchange). */
export const OPEN_RETURN_STATUSES = ['requested', 'approved', 'received'];

export type ReturnWorkflowMode = 'review' | 'receive' | 'refund' | 'close';

/** Primary seller action for a line in a given status (exchange is offered separately from the order page). */
export function primaryReturnMode(status: string): ReturnWorkflowMode | null {
  if (status === 'requested') return 'review';
  if (status === 'approved') return 'receive';
  if (status === 'received') return 'refund';
  return null;
}

export const PRIMARY_RETURN_LABEL: Record<ReturnWorkflowMode, string> = {
  review: 'Review',
  receive: 'Mark as received',
  refund: 'Refund',
  close: 'Close return',
};
