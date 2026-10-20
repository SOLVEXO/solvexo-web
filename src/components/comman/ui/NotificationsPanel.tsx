import { FEATURES } from '@/constants/features';
import { useEffect, useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Toggle } from './Toggle';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { SkeletonBox } from './SkeletonBox';
import {
  Bell, Mail, Smartphone, Check, Trash2,
  Clock, Package, MessageSquare, Star, Sparkles, Filter, AlertTriangle, Coins, Megaphone
} from 'lucide-react';
import type { NotificationPreferenceFlags } from '@/api/services/notifications';
import { clsx } from 'clsx';
import { getNotificationIcon } from './notificationIcon';
import { TokenStorage } from '@/api/services/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationTarget } from '@/utils/notificationTarget';

function formatFullTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}


export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
  } = useNotification();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const storeFromPath = pathname.match(/^\/store\/([^/]+)/)?.[1] ?? null;
  const openNotification = (notif: (typeof notifications)[number]) => {
    if (!notif.isRead) markAsRead(notif._id);
    const to = notificationTarget(notif, storeFromPath);
    if (to) navigate(to);
  };

  const role = TokenStorage.getUser<{ role?: 'user' | 'seller' | 'admin' }>()?.role;
  const topics: { key: keyof NotificationPreferenceFlags; title: string; hint: string; Icon: typeof Package; bg: string; color: string }[] = role === 'admin'
    ? [{ key: 'admin', title: 'Platform alerts', hint: 'New sellers and stores, verification and payout requests, billing failures, email problems.', Icon: AlertTriangle, bg: 'bg-brand-pale-orange/50', color: 'text-brand-orange' }]
    : [
        { key: 'orders', title: 'Orders & Deliveries', hint: 'Updates on purchases, order progress, and deliveries.', Icon: Package, bg: 'bg-brand-pale-orange/50', color: 'text-brand-orange' },
        { key: 'messages', title: 'Direct Messages', hint: 'Alerts when a client or admin sends a new message.', Icon: MessageSquare, bg: 'bg-[#eef7ff]', color: 'text-[#1a65a8]' },
        ...(role === 'seller' ? [{ key: 'finance' as const, title: 'Payouts & Finance', hint: 'Payout updates and payment disputes.', Icon: Coins, bg: 'bg-[#eaf7ef]', color: 'text-[#1f8a4c]' }] : []),
        ...(role === 'seller' ? [{ key: 'promotions' as const, title: 'Promotions & Store Updates', hint: 'Store approval, verification and promotion status.', Icon: Megaphone, bg: 'bg-[#fff1f0]', color: 'text-[#d4380d]' }] : []),
        ...(FEATURES.loyalty ? [{ key: 'loyalty' as const, title: 'Loyalty & Reward Points', hint: 'Updates on loyalty milestones, points earned, or tier upgrades.', Icon: Star, bg: 'bg-[#fff8e7]', color: 'text-[#d4af37]' }] : []),
        { key: 'subscriptions', title: 'Subscriptions & Plans', hint: 'Billing notices, renewal reminders, or payment issues.', Icon: Sparkles, bg: 'bg-[#f5f0ff]', color: 'text-[#7c3aed]' },
      ];

  const [unreadOnly, setUnreadOnly] = useState(false);
  // History starts short (the page used to be an endless scroll) — "Show all" expands it.
  const [showAll, setShowAll] = useState(false);
  const [prefError, setPrefError] = useState('');
  const [prefSuccess, setPrefSuccess] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    fetchNotifications(unreadOnly);
  }, [unreadOnly, fetchNotifications]);

  useEffect(() => {
    fetchPreferences().finally(() => setPrefsLoaded(true));
  }, [fetchPreferences]);

  const handleTogglePref = async (key: string, value: boolean) => {
    setPrefError('');
    setPrefSuccess(false);
    try {
      await updatePreferences({ [key]: value });
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const showPrefsLoading = !prefsLoaded && preferences === null;
  const HISTORY_PREVIEW = 5;
  const visibleNotifications = showAll ? notifications : notifications.slice(0, HISTORY_PREVIEW);

  return (
    <div className="flex flex-col gap-6">
      {/* ── CARD 1: Preferences Settings ── */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex justify-between items-center">
          <div>
            <h2 className="text-[15px] font-bold text-carbon">My alert preferences</h2>
            <p className="text-[12px] text-slate mt-0.5">How and when <i>you</i> are alerted (these don't change what your customers receive).</p>
          </div>
          {prefSuccess && (
            <span className="text-[11px] font-medium text-success bg-success-bg px-2.5 py-1 rounded-md animate-fade-in">
              Preferences updated
            </span>
          )}
          {prefError && (
            <span className="text-[11px] font-medium text-error bg-error-bg px-2.5 py-1 rounded-md">
              {prefError}
            </span>
          )}
        </div>

        <div className="p-5 flex flex-col gap-5 divide-y divide-[#f5f4ef]">
          {showPrefsLoading ? (
            <div className="flex flex-col gap-4 py-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <SkeletonBox width={120} height={12} className="mb-2" />
                    <SkeletonBox width={200} height={9} />
                  </div>
                  <SkeletonBox width={40} height={20} rounded="99px" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Channel Delivery Settings */}
              <div className="flex flex-col gap-4 pb-4">
                <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em]">Delivery Channels</p>
                
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-lg bg-bone flex items-center justify-center shrink-0">
                      <Smartphone size={15} className="text-slate" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-charcoal leading-none">Push Notifications</p>
                      <p className="text-[11.5px] text-slate mt-1 leading-normal">
                        Receive instant alerts directly in your browser or application workspace.
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={preferences?.pushEnabled ?? true}
                    onChange={(v) => handleTogglePref('pushEnabled', v)}
                  />
                </div>

                <div className="flex justify-between items-start gap-4 pt-2">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-lg bg-bone flex items-center justify-center shrink-0">
                      <Mail size={15} className="text-slate" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-charcoal leading-none">Email Notifications</p>
                      <p className="text-[11.5px] text-slate mt-1 leading-normal">
                        Receive summaries, digests, and transactional email updates in your inbox.
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={preferences?.emailEnabled ?? true}
                    onChange={(v) => handleTogglePref('emailEnabled', v)}
                  />
                </div>
              </div>

              {/* Notification Category Filters — which topics apply depends on who is looking */}
              <div className="flex flex-col gap-4 pt-4">
                <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em]">Notification Topics</p>
                {topics.map(t => (
                  <div key={t.key} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-7 rounded flex items-center justify-center shrink-0 ${t.bg}`}>
                        <t.Icon size={13} className={t.color} />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-medium text-charcoal">{t.title}</p>
                        <p className="text-[10.5px] text-slate leading-normal">{t.hint}</p>
                      </div>
                    </div>
                    <Toggle
                      size="sm"
                      checked={preferences?.prefs?.[t.key] ?? true}
                      onChange={(v) => handleTogglePref(t.key, v)}
                      ariaLabel={t.title}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── CARD 2: History Inbox ── */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-carbon">Recent alerts</h2>
            <p className="text-[12px] text-slate mt-0.5">Your latest notifications.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Unread-only filter */}
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={clsx(
                'px-[10px] py-[6px] rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white transition-colors duration-150',
                unreadOnly ? 'border-brand-orange text-brand-orange bg-brand-pale-orange/10' : 'border-bone text-slate hover:bg-cream'
              )}
            >
              <Filter size={12} />
              <span>Unread Only</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-[12px] py-[6px] rounded-lg bg-brand-orange text-white text-xs font-semibold cursor-pointer border-none flex items-center gap-1 hover:opacity-90 transition-opacity"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#f5f4ef]">
          {notificationsLoading && notifications.length === 0 ? (
            <div className="p-5 flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <SkeletonBox width={32} height={32} rounded="8px" />
                  <div className="flex-1">
                    <SkeletonBox width={150} height={12} className="mb-2" />
                    <SkeletonBox width="100%" height={24} rounded="6px" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            visibleNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => openNotification(notif)}
                className={clsx(
                  'p-4 flex gap-4 transition-colors duration-150 relative group',
                  notificationTarget(notif, storeFromPath) && 'cursor-pointer hover:bg-cream/40',
                  !notif.isRead && 'bg-brand-pale-orange/5'
                )}
              >
                {/* Category Icon */}
                <div className="size-9 rounded-lg bg-bone flex items-center justify-center shrink-0 border border-bone">
                  {getNotificationIcon(notif.type, 16)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={clsx('text-[13px] text-carbon', !notif.isRead ? 'font-bold' : 'font-semibold')}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="px-1.5 py-[1px] rounded bg-brand-orange text-white text-[8px] font-bold uppercase tracking-[0.05em]">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate mt-1 leading-relaxed break-words">
                    {notif.body}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate mt-2">
                    <Clock size={10} />
                    <span>{formatFullTime(notif.createdAt)}</span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2">
                  {!notif.isRead && (
                    <button
                      title="Mark as read"
                      onClick={() => markAsRead(notif._id)}
                      className="size-7 rounded-lg bg-white border border-bone flex items-center justify-center cursor-pointer text-success hover:bg-success-bg transition-colors"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    title="Delete notification"
                    onClick={() => deleteNotification(notif._id)}
                    className="size-7 rounded-lg bg-white border border-bone flex items-center justify-center cursor-pointer text-error hover:bg-error-bg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              className="py-8!"
              icon={<Bell size={28} className="text-slate/40" />}
              title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
              description={
                unreadOnly
                  ? 'All of your notifications are marked as read. Check back later!'
                  : 'You will receive updates here whenever order activity, chat updates, or promotion events occur.'
              }
            />
          )}
        </div>
        {notifications.length > HISTORY_PREVIEW && (
          <div className="px-5 py-2.5 border-t border-bone text-center">
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="text-[12px] font-medium text-brand-orange hover:underline bg-transparent border-0 cursor-pointer"
            >
              {showAll ? 'Show fewer' : `Show all ${notifications.length}`}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
