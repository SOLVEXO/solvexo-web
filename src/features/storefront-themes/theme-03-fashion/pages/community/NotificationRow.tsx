import { Link } from 'react-router-dom';
import { Bell, Check, Gift, MessageSquare, Package, Trash2 } from 'lucide-react';
import type { NotificationItem } from '@/api/services/notifications';
import { fashionTheme as t } from '../../theme.config';
import { timeAgo } from '../../../core/community/communityFormat';
import { notificationKind, notificationLink } from '../../../core/community/notificationMeta';

const ICONS = { order: Package, message: MessageSquare, promo: Gift, general: Bell } as const;

/** One notification: unread dot, title, body, time, optional deep link, mark-read and delete buttons (all real buttons). */
export function NotificationRow({ item, onRead, onDelete }: { item: NotificationItem; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  const Icon = ICONS[notificationKind(item)];
  const link = notificationLink(item);
  const open = () => { if (!item.isRead) onRead(item._id); };
  const title = <span className="text-[15px]" style={{ fontWeight: item.isRead ? 500 : 650 }}>{item.title}</span>;

  return (
    <li className="flex list-none items-start gap-3 p-4 sm:gap-4 sm:p-5" style={{ background: item.isRead ? 'transparent' : t.colors.bgAlt, borderBottom: `1px solid ${t.colors.border}` }}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full" style={{ background: item.isRead ? t.colors.bgAlt : t.colors.bg, color: t.colors.ink }}>
        <Icon size={18} aria-hidden />
        {!item.isRead && <span aria-hidden className="absolute right-0 top-0 size-2.5 rounded-full" style={{ background: t.colors.danger, border: `2px solid ${t.colors.bgAlt}` }} />}
      </span>
      <div className="min-w-0 flex-1">
        {link
          ? <Link to={link} onClick={open} className="block no-underline" style={{ color: t.colors.ink }}>{title}</Link>
          : title}
        {!item.isRead && <span className="sr-only"> (unread)</span>}
        {item.body && <p className="m-0 mt-1 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{item.body}</p>}
        <p className="m-0 mt-1.5 text-xs" style={{ color: t.colors.inkMuted }}><time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time></p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!item.isRead && (
          <button type="button" onClick={() => onRead(item._id)} aria-label={`Mark "${item.title}" as read`} title="Mark as read" className="grid size-9 place-items-center rounded-full border-0 bg-transparent" style={{ color: t.colors.ink, cursor: 'pointer' }}>
            <Check size={16} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => onDelete(item._id)} aria-label={`Delete "${item.title}"`} title="Delete" className="grid size-9 place-items-center rounded-full border-0 bg-transparent" style={{ color: t.colors.inkMuted, cursor: 'pointer' }}>
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </li>
  );
}
