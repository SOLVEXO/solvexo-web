import type { ComponentType } from 'react';
import { Award, Check, Clock, Gift, Headset, Heart, Leaf, Lock, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react';

/** The icons a seller can pick for a trust badge (same keys the API accepts). */
export const TRUST_ICON_OPTIONS: { value: string; label: string; Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }> }[] = [
  { value: 'truck', label: 'Shipping', Icon: Truck }, { value: 'return', label: 'Returns', Icon: RotateCcw }, { value: 'shield', label: 'Protection', Icon: ShieldCheck },
  { value: 'lock', label: 'Secure payment', Icon: Lock }, { value: 'headset', label: 'Support', Icon: Headset }, { value: 'award', label: 'Quality', Icon: Award },
  { value: 'gift', label: 'Gift', Icon: Gift }, { value: 'clock', label: 'Fast / on time', Icon: Clock }, { value: 'leaf', label: 'Eco friendly', Icon: Leaf },
  { value: 'heart', label: 'Made with care', Icon: Heart }, { value: 'check', label: 'Check', Icon: Check }, { value: 'star', label: 'Top rated', Icon: Star },
];

export const DEFAULT_TRUST_ITEMS = [
  { icon: 'truck', title: 'Free shipping', text: 'On orders over a set amount' },
  { icon: 'return', title: 'Easy returns', text: 'Changed your mind? Send it back' },
  { icon: 'shield', title: 'Secure checkout', text: 'Your payment details stay private' },
];
