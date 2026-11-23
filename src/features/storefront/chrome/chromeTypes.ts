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
  /** No background fill behind the dots at all. */
  transparent?: boolean;
  /** Card colour (only with `frame`); empty = the QR's own background. */
  frameBg?: string;
}

export interface PopupLink { label: string; url: string; icon: string; bold: boolean }

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
  /** 'below' = opens right under the strip item, 'center' = a centred window. */
  placement: 'below' | 'center';
  /** Exact width in px; 0 = use `width`. */
  widthPx: number;
  /** 'side' = text with the QR/image beside it, 'stack' = one column. */
  layout: 'side' | 'stack';
  /** Order of the parts; a part left out is hidden. */
  order: PopupPart[];
  bg: string;
  fg: string;
  /** px; -1 = the theme's own. */
  radius: number;
  /** px; -1 = automatic. */
  padding: number;
  titleSize: number;
  bodySize: number;
  align: 'left' | 'center';
  border: boolean;
  shadow: boolean;
  /** 'theme' = the active theme's own popup look, 'classic' = flat and attached (the old look). Missing = classic. */
  style?: 'theme' | 'classic';
  /** auto = theme default; custom = widthPx / width; content = the page container; full = edge to edge. Missing = auto. */
  widthMode?: 'auto' | 'custom' | 'content' | 'full';
  /** px, scrolls inside; 0 = automatic. */
  maxHeight?: number;
  /** px between the strip and the popup; -1 = the theme's own. */
  gap?: number;
  mediaPlacement?: 'side' | 'below' | 'above';
  linksTitle?: string;
  linksColumns?: number;
  links?: PopupLink[];
}

export type PopupPart = 'title' | 'body' | 'links' | 'image' | 'qr' | 'button' | 'share' | 'footnote';
export const POPUP_PARTS: PopupPart[] = ['title', 'body', 'links', 'image', 'qr', 'button', 'share', 'footnote'];
export const MAX_POPUP_LINKS = 30;
export const POPUP_PART_LABEL: Record<PopupPart, string> = {
  title: 'Heading', body: 'Text', image: 'Image', qr: 'QR code', button: 'Button', share: 'Share icons', footnote: 'Small print', links: 'Links / menu',
};

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
  /** px; 0 = the strip's size. */
  fontSize: number;
  bold: boolean;
  popup: ChromePopup | null;
}

export const MAX_CHROME_ITEMS = 12;

export const DEFAULT_QR: ChromeQr = { data: '', fg: '#111111', bg: '#ffffff', dot: 'square', eye: 'square', logoUrl: '', caption: '', frame: true, transparent: false, frameBg: '' };

export const DEFAULT_POPUP: ChromePopup = {
  title: '', body: '', imageUrl: '', qr: null, buttonLabel: '', buttonUrl: '', showShare: false, footnote: '', width: 'md',
  placement: 'below', widthPx: 0, layout: 'side', order: [...POPUP_PARTS], bg: '', fg: '', radius: -1, padding: -1,
  titleSize: 0, bodySize: 0, align: 'left', border: false, shadow: true,
  style: 'theme', widthMode: 'auto', maxHeight: 0, gap: -1, mediaPlacement: 'side', linksTitle: '', linksColumns: 2, links: [],
};

export function newChromeItem(kind: ChromeItem['kind'], zone: ChromeZone = 'right'): ChromeItem {
  return {
    id: `i${Math.random().toString(36).slice(2, 9)}`,
    kind, zone, label: kind === 'text' ? 'Your text' : kind === 'popup' ? 'Open popup' : 'Link',
    icon: kind === 'popup' ? 'message-circle' : '', iconUrl: '', url: '', newTab: false, bg: '', fg: '', device: 'all', fontSize: 0, bold: false,
    popup: kind === 'popup' ? { ...DEFAULT_POPUP, title: 'Your heading', body: 'Write anything here.' } : null,
  };
}

/** Icons a seller can pick. `social` keys use brand glyphs; the rest are line icons. */
export const CHROME_ICON_KEYS = [
  'whatsapp', 'facebook', 'instagram', 'x', 'youtube', 'linkedin', 'tiktok', 'telegram', 'pinterest', 'snapchat',
  'phone', 'mail', 'message-circle', 'map-pin', 'store', 'truck', 'package', 'gift', 'tag', 'percent', 'clock', 'star', 'heart',
  'shield-check', 'headphones', 'help-circle', 'bell', 'sparkles', 'globe', 'qr-code', 'users', 'info', 'link',
] as const;
