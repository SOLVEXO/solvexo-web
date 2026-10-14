import type { StoreAnnouncementBar } from '@/api/services/store';

type Look = Pick<StoreAnnouncementBar,
  'type' | 'bgColor' | 'bgColor2' | 'textColor' | 'animation' | 'marqueeSpeed' | 'fontSize' | 'uppercase' | 'bold' | 'showIcon' | 'align' | 'closable'>;

export interface AnnouncementPreset {
  id: string;
  name: string;
  description: string;
  look: Look;
  /** Filled in only when the bar has nothing of its own yet. */
  sample: { message: string; ctaLabel?: string; ctaLink?: string; couponCode?: string; countdownDays?: number };
}

const BASE: Look = {
  type: 'info', bgColor: null, bgColor2: null, textColor: null, animation: 'slide', marqueeSpeed: 'normal',
  fontSize: 'sm', uppercase: false, bold: false, showIcon: true, align: 'left', closable: true,
};

export const ANNOUNCEMENT_PRESETS: AnnouncementPreset[] = [
  { id: 'simple', name: 'Simple', description: 'Matches your theme colours',
    look: { ...BASE }, sample: { message: 'Free shipping on orders over Rs. 3,000', ctaLabel: 'Shop now', ctaLink: '/' } },
  { id: 'minimal', name: 'Minimal', description: 'Clean, centred, no icon',
    look: { ...BASE, bgColor: '#ffffff', textColor: '#111111', showIcon: false, align: 'center', closable: false },
    sample: { message: 'New collection is live' } },
  { id: 'sale_countdown', name: 'Sale countdown', description: 'Bold red with a live timer',
    look: { ...BASE, type: 'sale', bgColor: '#b91c1c', textColor: '#ffffff', bold: true, uppercase: true, align: 'center', fontSize: 'md' },
    sample: { message: 'Mega sale ends in', ctaLabel: 'Shop the sale', ctaLink: '/', countdownDays: 3 } },
  { id: 'marquee', name: 'Scrolling', description: 'A moving strip of messages',
    look: { ...BASE, bgColor: '#111111', textColor: '#ffffff', animation: 'marquee', uppercase: true, bold: true, showIcon: false },
    sample: { message: 'Free delivery nationwide · Easy 7-day returns · Cash on delivery' } },
  { id: 'promo_code', name: 'Promo code', description: 'Code with a copy button',
    look: { ...BASE, type: 'coupon', bgColor: '#fff4e5', textColor: '#7a3e00', align: 'center', bold: true },
    sample: { message: 'Get 10% off your first order with', couponCode: 'WELCOME10' } },
  { id: 'free_shipping', name: 'Free shipping', description: 'Fresh green delivery message',
    look: { ...BASE, type: 'shipping', bgColor: '#e8f5e9', textColor: '#1b5e20', align: 'center' },
    sample: { message: 'Free shipping on all orders this week' } },
  { id: 'gradient', name: 'Gradient', description: 'Purple to pink, eye-catching',
    look: { ...BASE, type: 'holiday', bgColor: '#6d28d9', bgColor2: '#db2777', textColor: '#ffffff', animation: 'fade', align: 'center', bold: true },
    sample: { message: 'Eid collection is here', ctaLabel: 'Explore', ctaLink: '/' } },
  { id: 'luxury', name: 'Dark luxury', description: 'Black and gold, refined',
    look: { ...BASE, bgColor: '#0b0b0b', textColor: '#d4af37', animation: 'fade', uppercase: true, showIcon: false, align: 'center' },
    sample: { message: 'Complimentary gift wrapping on every order' } },
];

/** Applies a design: its look always, its sample text only where the bar has none. */
export function applyAnnouncementPreset(value: StoreAnnouncementBar, preset: AnnouncementPreset): StoreAnnouncementBar {
  const empty = !value.message && !(value.moreMessages ?? []).some(m => m.message);
  const s = preset.sample;
  return {
    ...value,
    ...preset.look,
    preset: preset.id,
    ...(empty ? { message: s.message, ctaLabel: s.ctaLabel ?? null, ctaLink: s.ctaLink ?? null, couponCode: s.couponCode ?? null } : {}),
    ...(s.couponCode && !value.couponCode && !empty ? { couponCode: s.couponCode } : {}),
    ...(s.countdownDays && !value.countdownEndAt ? { countdownEndAt: new Date(Date.now() + s.countdownDays * 86_400_000).toISOString() } : {}),
  };
}
