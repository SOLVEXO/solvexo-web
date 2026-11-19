import type { GrowthRange } from '@/api/services/growth';

export const RANGE_LABEL: Record<GrowthRange, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '12m': 'Last 12 months',
};

/** Traffic-type names the way Shopify shows them. */
export function channelLabel(key: string): string {
  const map: Record<string, string> = {
    direct: 'Direct', search: 'Search', social: 'Social', email: 'Email', paid: 'Paid', referral: 'Referral', unattributed: 'Unattributed',
  };
  return map[key] ?? key;
}

export function percent(n: number): string {
  return `${n.toFixed(n >= 10 ? 1 : 2)}%`;
}
