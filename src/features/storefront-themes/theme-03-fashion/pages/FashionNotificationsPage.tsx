import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, CheckCheck } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useNotification } from '@/contexts/NotificationContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, PillButton, SkeletonBlock } from '../ui/primitives';
import { NotificationRow } from './community/NotificationRow';

type Filter = 'all' | 'unread';

/** `/notifications` - the buyer's inbox (live via the notification socket), filter, mark read, delete. */
export function FashionNotificationsPage() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: 'Notifications', noindex: true });
  const { notifications, notificationsLoading, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [filter, setFilter] = useState<Filter>('all');
  const signedIn = TokenStorage.isLoggedIn();

  useEffect(() => { if (signedIn) void fetchNotifications(); }, [fetchNotifications, signedIn]);

  const shown = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const tabs: { key: Filter; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'unread', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' }];

  return (
    <AccountLayout title="Your" accent="notifications" subtitle={<span aria-live="polite">{!signedIn ? 'Sign in to see your updates.' : unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}</span>}
      actions={signedIn && unreadCount > 0 ? <PillButton variant="outline" onClick={() => void markAllAsRead()} style={{ height: 40, padding: '0 18px' }}><CheckCheck size={16} aria-hidden />Mark all as read</PillButton> : undefined}>
      {guest ? null : !signedIn ? (
        <EmptyState icon={<BellOff size={24} aria-hidden />} title="Sign in to see notifications" text="Order updates and replies from the store show up here."
          action={<Link to="/login?redirect=%2Fnotifications" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>Sign in</Link>} />
      ) : (
        <>
          <div role="group" aria-label="Filter notifications" className="mb-5 flex gap-2">
            {tabs.map(tab => (
              <button key={tab.key} type="button" aria-pressed={filter === tab.key} onClick={() => setFilter(tab.key)}
                className="rounded-full px-4 py-2 text-sm font-medium" style={{ cursor: 'pointer', border: `1px solid ${filter === tab.key ? t.colors.ink : t.colors.border}`, background: filter === tab.key ? t.colors.ink : 'transparent', color: filter === tab.key ? t.colors.bg : t.colors.ink }}>
                {tab.label}
              </button>
            ))}
          </div>
          {notificationsLoading && notifications.length === 0 ? (
            <div role="status" aria-label="Loading notifications"><SkeletonBlock h={84} rows={4} /></div>
          ) : shown.length === 0 ? (
            <EmptyState icon={<BellOff size={24} aria-hidden />} title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              text={filter === 'unread' ? 'Everything has been read.' : 'Order updates and messages from the store will show up here.'}
              action={filter === 'unread' ? <PillButton variant="outline" onClick={() => setFilter('all')}>Show all</PillButton> : undefined} />
          ) : (
            <ul className="m-0 overflow-hidden p-0" aria-label="Notifications" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 20 }}>
              {shown.map(n => <NotificationRow key={n._id} item={n} onRead={id => void markAsRead(id)} onDelete={id => void deleteNotification(id)} />)}
            </ul>
          )}
          {notifications.length >= 50 && <p className="m-0 mt-4 text-center text-[13px]" style={{ color: t.colors.inkMuted }}>Showing your 50 most recent notifications.</p>}
        </>
      )}
    </AccountLayout>
  );
}

