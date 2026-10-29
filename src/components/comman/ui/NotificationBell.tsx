import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { TokenStorage } from '@/api/services/auth';
import {
  Bell, Check, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { getNotificationIcon } from './notificationIcon';
import { AnimatedBellIcon } from './AnimatedBellIcon';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';
import { notificationTarget } from '@/utils/notificationTarget';

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toast,
    clearToast,
    fetchNotifications,
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useDropdownPosition(containerRef, isOpen);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Load initial notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    // Inside a store's own dashboard, stay there — Notifications is its own
    // real Settings tab (SettingsHub.tsx), not buried inside the seller's
    // personal Account/profile page.
    const storeMatch = pathname.match(/^\/store\/([^/]+)/);
    if (storeMatch) {
      navigate(`/store/${storeMatch[1]}/settings?tab=notifications`);
      return;
    }
    const user = TokenStorage.getUser<{ role?: 'user' | 'seller' | 'admin' }>();
    const role = user?.role;
    if (role === 'seller') {
      navigate('/seller/settings?tab=notifications');
    } else if (role === 'admin') {
      navigate('/admin/settings?tab=notifications');
    } else {
      // `role === 'user'` (a buyer) on the apex domain — `/account/notifications`
      // no longer exists (see `ProfileAvatar.tsx`'s own `SHOW_BUYER_FEATURES`
      // comment: the whole apex-domain Account/Marketplace/Cart/Checkout flow
      // was removed outright, since a real buyer always shops a store's own
      // themed subdomain now — the branch above already handles that case).
      // Nothing meaningful to land a bare apex-domain buyer on any more.
      navigate('/');
    }
  };

  const storeFromPath = pathname.match(/^\/store\/([^/]+)/)?.[1] ?? null;
  const openNotification = (notif: (typeof notifications)[number]) => {
    if (!notif.isRead) markAsRead(notif._id);
    const to = notificationTarget(notif, storeFromPath);
    if (to) { setIsOpen(false); navigate(to); }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div ref={containerRef} className="relative z-[900]">
      {/* Dynamic Bell Icon Button */}
      <button
        onClick={handleBellClick}
        aria-label="Notifications"
        className={clsx(
          'group relative w-9 h-9 rounded-full bg-brand-pale-orange/50 flex items-center justify-center cursor-pointer shrink-0 border-none transition-all duration-200 hover:bg-brand-pale-orange hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-1',
          isOpen && 'bg-brand-pale-orange ring-2 ring-brand-orange/30'
        )}
      >
        <AnimatedBellIcon size={16} className="text-brand-orange" />
        {unreadCount > 0 && (
          <span className="absolute -top-[3px] -right-[3px] min-w-[15px] h-[15px] bg-[#c0392b] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] border border-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Bell Dropdown Popup */}
      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={pos}
          className="dropdown-enter fixed z-[9999] bg-white border border-bone rounded-[14px] w-[330px] md:w-[356px] max-w-[calc(100vw-2rem)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-bone flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-carbon">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-[2px] rounded-full text-[9.5px] font-bold bg-brand-pale-orange text-brand-deep-orange leading-none">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-brand-orange hover:text-brand-deep-orange border-none bg-transparent cursor-pointer flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List content */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-fog">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => openNotification(notif)}
                  className="group relative flex gap-3 px-3.5 py-3 cursor-pointer transition-colors duration-150 hover:bg-cream/50"
                >
                  {/* Unread reads as an edge bar on the row, not a loose dot
                      floating in the corner of the card. */}
                  {!notif.isRead && (
                    <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand-orange" />
                  )}

                  {/* The icon already carries its own type colour, so the
                      tinted chip behind it was only adding a second shape. */}
                  <span aria-hidden className="shrink-0 mt-[2px]">{getNotificationIcon(notif.type, 15)}</span>

                  {/* Body text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={clsx(
                      'text-[12.5px] leading-snug',
                      notif.isRead ? 'font-semibold text-charcoal' : 'font-bold text-carbon',
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-[11.5px] text-slate mt-1 leading-normal break-words line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-[10.5px] text-slate/80 mt-1.5">{formatRelativeTime(notif.createdAt)}</p>
                  </div>

                  {/* One action instead of two — opening the row already marks
                      it read, so a separate "mark read" button was redundant,
                      and a bare trash glyph read as a bigger threat than
                      removing one line from a list. */}
                  <button
                    title="Dismiss"
                    aria-label="Dismiss notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    className="absolute right-2 top-2 size-6 rounded-md flex items-center justify-center cursor-pointer border-0 bg-transparent text-slate opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-cream hover:text-carbon outline-none transition-[opacity,background-color,color] duration-150"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-9 px-4 text-center">
                <Bell size={22} className="text-slate/35 mx-auto mb-2" />
                <p className="text-[12.5px] font-semibold text-charcoal">All caught up</p>
                <p className="text-[11px] text-slate mt-0.5">No new notifications.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAll}
            className="w-full py-2.5 border-t border-bone bg-cream/40 text-center text-[12px] font-semibold text-brand-orange hover:text-brand-deep-orange hover:bg-cream cursor-pointer"
          >
            View all notification settings
          </button>
        </div>,
        document.body,
      )}

      {/* Slide-in real-time push toast overlay */}
      {toast && (
        <div
          onClick={() => { const to = notificationTarget(toast, storeFromPath); if (to) { clearToast(); navigate(to); } }}
          className={clsx('fixed bottom-6 right-6 z-[9999] bg-carbon text-white rounded-xl border border-charcoal p-3.5 flex gap-3.5 max-w-[340px] animate-slide-in duration-300', notificationTarget(toast, storeFromPath) && 'cursor-pointer')}>
          <div className="size-9 rounded-lg bg-dark-active flex items-center justify-center shrink-0 border border-charcoal">
            {getNotificationIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-bold leading-tight">{toast.title}</p>
            <p className="text-[11.5px] text-slate mt-1 leading-normal">{toast.body}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); clearToast(); }}
            className="text-slate hover:text-white bg-transparent border-0 cursor-pointer p-0 shrink-0 self-start mt-0.5"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
