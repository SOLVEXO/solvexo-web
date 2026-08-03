import { Bell, Package, MessageSquare, Star, Sparkles } from 'lucide-react';

/** Shared by NotificationBell (dropdown) and NotificationsPanel (full page) —
 *  previously each hand-rolled an identical copy of this type→icon/color
 *  mapping, which risked silently drifting apart if one was edited alone. */
export function getNotificationIcon(type: string, size: number = 14) {
  const t = type.toLowerCase();
  if (t.includes('order')) return <Package size={size} className="text-brand-orange" />;
  if (t.includes('message') || t.includes('chat')) return <MessageSquare size={size} className="text-[#1A65A8]" />;
  if (t.includes('loyalty') || t.includes('points') || t.includes('tier')) return <Star size={size} className="text-[#D4AF37]" />;
  if (t.includes('subscription') || t.includes('plan')) return <Sparkles size={size} className="text-[#7C3AED]" />;
  return <Bell size={size} className="text-slate" />;
}
