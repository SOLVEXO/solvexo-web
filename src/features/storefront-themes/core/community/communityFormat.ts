import type { Message, MessageType, SendMessagePayload } from '@/api/services/messaging';
import { ts } from '@/utils/tStatic';
import { activeLocale } from '../locale';

/** "just now", "5m ago", "3h ago", "2d ago", then a plain date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return ts('pg.just_now', 'Just now');
  if (mins < 60) return ts('pg.countm_ago', '{{count}}m ago', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ts('pg.counth_ago', '{{count}}h ago', { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return ts('pg.countd_ago', '{{count}}d ago', { count: days });
  return new Date(iso).toLocaleDateString(activeLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(activeLocale(), { hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday" or a date, used for the dividers inside a chat thread. */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return ts('pg.word_today', 'Today');
  if (diffDays === 1) return ts('pg.word_yesterday', 'Yesterday');
  return d.toLocaleDateString(activeLocale(), { weekday: 'long', day: 'numeric', month: 'short' });
}

export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Message type used when a file is sent as an attachment. */
export function attachmentKind(file: File): Extract<MessageType, 'image' | 'video' | 'voice' | 'pdf' | 'document'> {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'voice';
  if (file.type === 'application/pdf') return 'pdf';
  return 'document';
}

/** One-line description of a message, used in reply quotes. */
export function messagePreview(m: Pick<Message, 'type' | 'text' | 'isDeleted'>): string {
  if (m.isDeleted) return ts('pg.message_deleted', 'Message deleted');
  switch (m.type) {
    case 'text': return m.text ?? '';
    case 'image': return ts('pg.word_photo_2', 'Photo');
    case 'video': return ts('pg.word_video', 'Video');
    case 'voice': return ts('pg.voice_message', 'Voice message');
    case 'pdf': return ts('pg.pdf_document', 'PDF document');
    case 'product_share': return ts('pg.shared_a_product', 'Shared a product');
    default: return ts('pg.word_attachment', 'Attachment');
  }
}

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'] as const;

/** Returns the url only when it is http(s); anything else (javascript:, data: ...) becomes null. */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, 'https://placeholder.invalid');
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : null;
  } catch { return null; }
}

/** Rebuilds the send payload of a message that failed to send, so it can be retried in place. */
export function retryPayload(m: Message): SendMessagePayload | null {
  const replyTo = m.replyTo ? { replyTo: m.replyTo } : {};
  if (m.type === 'text') return { type: 'text', text: m.text ?? '', ...replyTo, ...(m.linkPreview ? { linkPreview: m.linkPreview } : {}) };
  if (m.type === 'product_share' && m.productShare) return { type: 'product_share', productShare: { productId: m.productShare.productId }, ...replyTo };
  if (m.type !== 'product_share' && (m.attachments?.length ?? 0) > 0) return { type: m.type, attachments: m.attachments, ...replyTo };
  return null;
}
