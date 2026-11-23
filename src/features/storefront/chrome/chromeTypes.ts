/** Seller-built items for the storefront top strip and floating contact bar. Mirrors the API's `chrome-items.util.ts`. */
export interface ChromeQr {
  data: string;
  fg: string;
  bg: string;
  dot: 'square' | 'rounded' | 'dots';
  eye: 'square' | 'rounded' | 'circle';
  logoUrl: string;
  caption: string;
  frame: boolean;
}

export interface ChromePopup {
  title: string;
  body: string;
  imageUrl: string;
  qr: ChromeQr | null;
  buttonLabel: string;
  buttonUrl: string;
  showShare: boolean;
  footnote: string;
  width: 'sm' | 'md' | 'lg';
}

export type ChromeZone = 'left' | 'center' | 'right';

export interface ChromeItem {
  id: string;
  kind: 'text' | 'link' | 'popup';
  zone: ChromeZone;
  label: string;
  icon: string;
  iconUrl: string;
  url: string;
  newTab: boolean;
  bg: string;
  fg: string;
  device: 'all' | 'desktop' | 'mobile';
  popup: ChromePopup | null;
}

export const MAX_CHROME_ITEMS = 12;

export const DEFAULT_QR: ChromeQr = { data: '', fg: '#111111', bg: '#ffffff', dot: 'square', eye: 'square', logoUrl: '', caption: '', frame: true };

export const DEFAULT_POPUP: ChromePopup = {
  title: '', body: '', imageUrl: '', qr: null, buttonLabel: '', buttonUrl: '', showShare: false, footnote: '', width: 'md',
};

export function newChromeItem(kind: ChromeItem['kind'], zone: ChromeZone = 'right'): ChromeItem {
  return {
    id: `i${Math.random().toString(36).slice(2, 9)}`,
    kind, zone, label: kind === 'text' ? 'Your text' : kind === 'popup' ? 'Open popup' : 'Link',
    icon: kind === 'popup' ? 'message-circle' : '', iconUrl: '', url: '', newTab: false, bg: '', fg: '', device: 'all',
    popup: kind === 'popup' ? { ...DEFAULT_POPUP, title: 'Your heading', body: 'Write anything here.' } : null,
  };
}

/** Icons a seller can pick. `social` keys use brand glyphs; the rest are line icons. */
export const CHROME_ICON_KEYS = [
  'whatsapp', 'facebook', 'instagram', 'x', 'youtube', 'linkedin', 'tiktok', 'telegram', 'pinterest', 'snapchat',
  'phone', 'mail', 'message-circle', 'map-pin', 'store', 'truck', 'package', 'gift', 'tag', 'percent', 'clock', 'star', 'heart',
  'shield-check', 'headphones', 'help-circle', 'bell', 'sparkles', 'globe', 'qr-code', 'users', 'info', 'link',
] as const;
