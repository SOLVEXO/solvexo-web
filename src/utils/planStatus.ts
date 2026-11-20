/** What the seller reads instead of the raw subscription status ("past_due" was showing as "Past_due"). */
export interface PlanStatusLabel { label: string; tone: 'success' | 'warning' | 'error' | 'info' }

export function planStatusLabel(status: string | null | undefined, opts: { cancelPending?: boolean; complimentary?: boolean } = {}): PlanStatusLabel {
  if (opts.complimentary && status === 'active') return { label: 'Provided by Solvexo support', tone: 'info' };
  if (opts.cancelPending) return { label: 'Canceling', tone: 'warning' };
  switch (status) {
    case 'active': return { label: 'Active', tone: 'success' };
    case 'trialing': return { label: 'Free trial', tone: 'info' };
    case 'trial_ended': return { label: 'Choose a plan', tone: 'error' };
    case 'past_due': return { label: 'Payment due', tone: 'error' };
    case 'locked': return { label: 'Store paused', tone: 'error' };
    case 'canceled': return { label: 'Subscription ended', tone: 'error' };
    default: return { label: status ? status.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : 'Unknown', tone: 'info' };
  }
}

export const PLAN_STATUS_TONE_CLASS: Record<PlanStatusLabel['tone'], string> = {
  success: 'bg-success-bg text-success', warning: 'bg-warning-bg text-warning', error: 'bg-error-bg text-error', info: 'bg-fog text-slate',
};

/** Review-date presets for a complimentary plan (days from today); null = no review date. */
export const COMPLIMENTARY_REVIEW_OPTIONS: Array<{ id: string; label: string; days: number | null }> = [
  { id: '30', label: 'Review in 30 days', days: 30 },
  { id: '60', label: 'Review in 60 days', days: 60 },
  { id: '90', label: 'Review in 90 days', days: 90 },
  { id: 'none', label: 'No review date', days: null },
];

/** ISO review date for a preset, or null for "no review date". */
export function complimentaryReviewAt(optionId: string, now = new Date()): string | null {
  const opt = COMPLIMENTARY_REVIEW_OPTIONS.find(o => o.id === optionId);
  if (!opt || opt.days == null) return null;
  return new Date(now.getTime() + opt.days * 86400000).toISOString();
}
