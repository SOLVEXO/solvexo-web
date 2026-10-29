import { FEATURES } from '@/constants/features';
import { useEffect, useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Toggle } from './Toggle';
import { EmptyState } from './EmptyState';
import { SettingsCard, SettingsRow, SettingsGroupLabel } from '@/components/comman/settings';
import {
  Bell, Inbox, Mail, Smartphone, Check, Trash2,
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
        { key: 'messages', title: 'Direct Messages', hint: 'Alerts when a client or admin sends a new message.', Icon: MessageSquare, bg: 'bg-mist', color: 'text-graphite' },
        ...(role === 'seller' ? [{ key: 'finance' as const, title: 'Payouts & Finance', hint: 'Payout updates and payment disputes.', Icon: Coins, bg: 'bg-success-bg', color: 'text-success' }] : []),
        ...(role === 'seller' ? [{ key: 'promotions' as const, title: 'Promotions & Store Updates', hint: 'Store approval, verification and promotion status.', Icon: Megaphone, bg: 'bg-brand-pale-orange', color: 'text-brand-deep-orange' }] : []),
        ...(FEATURES.loyalty ? [{ key: 'loyalty' as const, title: 'Loyalty & Reward Points', hint: 'Updates on loyalty milestones, points earned, or tier upgrades.', Icon: Star, bg: 'bg-warning-bg', color: 'text-warning' }] : []),
        { key: 'subscriptions', title: 'Subscriptions & Plans', hint: 'Billing notices, renewal reminders, or payment issues.', Icon: Sparkles, bg: 'bg-mist', color: 'text-graphite' },
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
    <div className="flex flex-col gap-5">
      {/* ── CARD 1: Preferences Settings ── */}
      {/* Every switch here saves the moment it is flipped, so this card has no
          save bar — only the result of the last write shows in the header. */}
      <SettingsCard
        title="My alert preferences"
        icon={<Bell size={14} />}
        divided
        description="How and when you are alerted (these don't change what your customers receive)."
        actions={prefSuccess ? (
          <span className="animate-fade-in rounded-md bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success">
            Preferences updated
          </span>
        ) : prefError ? (
          <span className="rounded-md bg-error-bg px-2.5 py-1 text-[11px] font-medium text-error">
            {prefError}
          </span>
        ) : undefined}
      >
        {showPrefsLoading ? null : (
          <div className="flex flex-col gap-5">
            {/* Channel Delivery Settings */}
            <div>
              <SettingsGroupLabel className="mb-1">Delivery Channels</SettingsGroupLabel>
              <div className="-mx-5 divide-y divide-fog border-y border-fog px-5">
                <SettingsRow
                  label={<span className="flex items-center gap-2"><span aria-hidden className="size-6 shrink-0 rounded-[7px] bg-mist flex items-center justify-center"><Smartphone size={12} className="text-slate" /></span>Push Notifications</span>}
                  description="Receive instant alerts directly in your browser or application workspace."
                >
                  <Toggle
                    checked={preferences?.pushEnabled ?? true}
                    onChange={(v) => handleTogglePref('pushEnabled', v)}
                    ariaLabel="Push Notifications"
                  />
                </SettingsRow>

                <SettingsRow
                  label={<span className="flex items-center gap-2"><span aria-hidden className="size-6 shrink-0 rounded-[7px] bg-mist flex items-center justify-center"><Mail size={12} className="text-slate" /></span>Email Notifications</span>}
                  description="Receive summaries, digests, and transactional email updates in your inbox."
                >
                  <Toggle
                    checked={preferences?.emailEnabled ?? true}
                    onChange={(v) => handleTogglePref('emailEnabled', v)}
                    ariaLabel="Email Notifications"
                  />
                </SettingsRow>
              </div>
            </div>

            {/* Notification Category Filters — which topics apply depends on who is looking */}
            <div>
              <SettingsGroupLabel className="mb-1">Notification Topics</SettingsGroupLabel>
              <div className="-mx-5 divide-y divide-fog border-y border-fog px-5">
                {topics.map(t => (
                  <SettingsRow
                    key={t.key}
                    label={<span className="flex items-center gap-2"><span aria-hidden className={clsx('size-6 shrink-0 rounded-[7px] flex items-center justify-center', t.bg)}><t.Icon size={12} className={t.color} /></span>{t.title}</span>}
                    description={t.hint}
                  >
                    <Toggle
                      size="sm"
                      checked={preferences?.prefs?.[t.key] ?? true}
                      onChange={(v) => handleTogglePref(t.key, v)}
                      ariaLabel={t.title}
                    />
                  </SettingsRow>
                ))}
              </div>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* ── CARD 2: History Inbox ── */}
      <SettingsCard
        title="Recent alerts"
        icon={<Inbox size={14} />}
        divided
        bodyClassName="px-0 pb-0"
        description="Your latest notifications."
        actions={
          <div className="flex items-center gap-2">
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
                className="px-[12px] py-[6px] rounded-lg bg-brand-orange text-white text-xs font-semibold cursor-pointer border-none flex items-center gap-1 hover:bg-brand-deep-orange transition-colors"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
        }
      >
        <div className="divide-y divide-fog">
          {notificationsLoading && notifications.length === 0 ? null : notifications.length > 0 ? (
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
                <div className="size-9 rounded-lg bg-cream border border-bone flex items-center justify-center shrink-0">
                  {getNotificationIcon(notif.type, 16)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-12 pointer-coarse:pr-[86px]">
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
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2">
                  {!notif.isRead && (
                    <button
                      title="Mark as read"
                      onClick={() => markAsRead(notif._id)}
                      className="size-7 pointer-coarse:size-11 rounded-lg bg-white border border-bone flex items-center justify-center cursor-pointer text-success hover:bg-success-bg transition-colors"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    title="Delete notification"
                    onClick={() => deleteNotification(notif._id)}
                    className="size-7 pointer-coarse:size-11 rounded-lg bg-white border border-bone flex items-center justify-center cursor-pointer text-error hover:bg-error-bg transition-colors"
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
      </SettingsCard>
    </div>
  );
}
