import { Badge } from '@/components/comman/ui';
import { SUPPORT_TIER_LABEL, type SupportTier } from '@/api/services/support';
import type { BadgeColor } from '@/types';

const COLOR: Record<SupportTier, BadgeColor> = { standard: 'gray', priority: 'orange', dedicated: 'blue' };

/** Tier label only. It sets the order in which requests are looked at; no response time is promised. */
export function SupportTierBadge({ tier, size = 'md' }: { tier: SupportTier | undefined | null; size?: 'sm' | 'md' }) {
  const t: SupportTier = tier && tier in SUPPORT_TIER_LABEL ? tier : 'standard';
  return <Badge color={COLOR[t]} size={size}>{SUPPORT_TIER_LABEL[t]}</Badge>;
}
