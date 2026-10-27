import { Award, BadgeCheck, Clock, CreditCard, Gift, Headphones, Heart, Leaf, Lock, Package, Percent, RefreshCw, ShieldCheck, Sparkles, Star, Truck, type LucideIcon } from 'lucide-react';

/** The icons a seller can pick for a "Feature list" item. The stored value is the key; an unknown key (older or edited data) falls back to the check badge. */
export const FEATURE_ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  truck: { Icon: Truck, label: 'Delivery' },
  shield: { Icon: ShieldCheck, label: 'Secure / guarantee' },
  refresh: { Icon: RefreshCw, label: 'Returns / exchange' },
  heart: { Icon: Heart, label: 'Heart' },
  star: { Icon: Star, label: 'Star' },
  gift: { Icon: Gift, label: 'Gift' },
  clock: { Icon: Clock, label: 'Time / fast' },
  award: { Icon: Award, label: 'Quality award' },
  leaf: { Icon: Leaf, label: 'Natural / eco' },
  sparkles: { Icon: Sparkles, label: 'Sparkles' },
  headphones: { Icon: Headphones, label: 'Support' },
  lock: { Icon: Lock, label: 'Privacy' },
  check: { Icon: BadgeCheck, label: 'Check badge' },
  card: { Icon: CreditCard, label: 'Payment' },
  package: { Icon: Package, label: 'Package' },
  percent: { Icon: Percent, label: 'Discount' },
};

export const FEATURE_ICON_OPTIONS = Object.entries(FEATURE_ICONS).map(([value, { label }]) => ({ value, label }));

export function featureIcon(name: unknown): LucideIcon {
  return FEATURE_ICONS[typeof name === 'string' ? name : '']?.Icon ?? BadgeCheck;
}
