import { useEffect } from 'react';
import { Bell, Check, Trash2, BellOff } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useNotification } from '@/contexts/NotificationContext';
import { novaTheme as t } from '../theme.config';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Theme 02's own Notifications page — ported functionally 1:1 from
 *  `AtelierNotificationsPage`, restyled with Nova's rounded/pill vocabulary. */
export function NovaNotificationsPage() {
  useStorefrontSeo({ title: 'Notifications', noindex: true });
  const { notifications, notificationsLoading, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <main className="mx-auto" style={{ maxWidth: '640px', padding: `48px ${t.layout.containerPadX}` }}>
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>Notifications</h1>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '4px' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button" onClick={markAllAsRead}
            className="flex items-center gap-1.5 cursor-pointer bg-transparent"
            style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '8px 14px' }}
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {notificationsLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse" style={{ height: '64px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <BellOff size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>No notifications yet</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
            Order updates and messages will show up here.
          </p>
        </div>
      ) : (
        <div style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
          {notifications.map((n, i) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              className="flex items-start gap-3 cursor-pointer"
              style={{
                padding: '16px 20px',
                borderTop: i > 0 ? `1.5px solid ${t.colors.border}` : undefined,
                background: n.isRead ? 'transparent' : t.colors.bgAlt,
              }}
            >
              <Bell size={15} style={{ color: n.isRead ? t.colors.inkMuted : t.colors.accent, marginTop: '2px', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: n.isRead ? 500 : 700, color: t.colors.ink }}>{n.title}</p>
                <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted, marginTop: '2px' }}>{n.body}</p>
                <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted, marginTop: '4px' }}>{timeAgo(n.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); deleteNotification(n._id); }}
                aria-label="Delete notification"
                className="cursor-pointer bg-transparent border-0 shrink-0"
                style={{ color: t.colors.inkMuted, padding: '2px' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
