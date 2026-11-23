import {
  Bell, Clock, Gift, Globe, Headphones, Heart, CircleHelp, Info, Link2, Mail, MapPin, MessageCircle, Package, Percent, Phone,
  QrCode, ShieldCheck, Sparkles, Star, Store, Tag, Truck, Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { SocialIcon } from '@/features/storefront-themes/navigation/FooterParts';

const LINE: Record<string, ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>> = {
  phone: Phone, mail: Mail, 'message-circle': MessageCircle, 'map-pin': MapPin, store: Store, truck: Truck, package: Package,
  gift: Gift, tag: Tag, percent: Percent, clock: Clock, star: Star, heart: Heart, 'shield-check': ShieldCheck, headphones: Headphones,
  'help-circle': CircleHelp, bell: Bell, sparkles: Sparkles, globe: Globe, 'qr-code': QrCode, users: Users, info: Info, link: Link2,
};

const BRAND = new Set(['whatsapp', 'facebook', 'instagram', 'x', 'youtube', 'linkedin', 'tiktok']);

/** One icon: the seller's uploaded image, a brand glyph, or a line icon. Colour follows `currentColor`. */
export function ChromeIcon({ icon, iconUrl, size = 16 }: { icon: string; iconUrl?: string; size?: number }) {
  if (iconUrl) return <img src={iconUrl} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />;
  if (BRAND.has(icon)) return <SocialIcon platform={icon} size={size} />;
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const, focusable: false as const, fill: 'currentColor' };
  if (icon === 'telegram') return <svg {...common}><path d="M21.5 4.3 2.9 11.5c-.9.4-.9 1.1-.2 1.3l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.2-15.1c.3-1.2-.4-1.7-1.5-1.3zM8.6 13.7l9.7-6.1c.5-.3.9-.1.5.2l-8 7.2-.3 3.3-1.9-4.6z" /></svg>;
  if (icon === 'pinterest') return <svg {...common}><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" /></svg>;
  if (icon === 'snapchat') return <svg {...common}><path d="M12 2.2c-3 0-5.2 2.3-5.2 5.3v1.9c-.5.2-1.1.2-1.6.1-.5-.1-.9.4-.5.8.4.4 1.2.7 1.8.9-.3 1.1-1.3 2.5-2.9 2.9-.5.1-.5.7 0 .9 1 .5 2 .6 2.6.7.2.4.2 1.2.9 1.2.7 0 1.5-.3 2.3 0 1 .4 1.6 1.6 3.5 1.6s2.5-1.2 3.5-1.6c.8-.3 1.6 0 2.3 0 .7 0 .7-.8.9-1.2.6-.1 1.6-.2 2.6-.7.5-.2.5-.8 0-.9-1.6-.4-2.6-1.8-2.9-2.9.6-.2 1.4-.5 1.8-.9.4-.4 0-.9-.5-.8-.5.1-1.1.1-1.6-.1V7.5c0-3-2.2-5.3-5.2-5.3z" /></svg>;
  const Line = LINE[icon];
  return Line ? <Line size={size} strokeWidth={2} aria-hidden /> : null;
}
