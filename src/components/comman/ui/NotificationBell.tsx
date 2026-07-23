import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { TokenStorage } from '@/api/services/auth';
import {
  Bell, Package, MessageSquare, Star, Sparkles, Check, Trash2, Clock, X
} from 'lucide-react';
import { clsx } from 'clsx';

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

function getNotificationIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('order')) return <Package size={14} className="text-brand-orange" />;
  if (t.includes('message') || t.includes('chat')) return <MessageSquare size={14} className="text-[#1A65A8]" />;
  if (t.includes('loyalty') || t.includes('points') || t.includes('tier')) return <Star size={14} className="text-[#D4AF37]" />;
  if (t.includes('subscription') || t.includes('plan')) return <Sparkles size={14} className="text-[#7C3AED]" />;
  return <Bell size={14} className="text-slate" />;
}

export function NotificationBell() {
  const navigate = useNavigate();
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
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
    const user = TokenStorage.getUser<{ role?: 'user' | 'seller' | 'admin' }>();
    const role = user?.role;
    if (role === 'seller') {
      navigate('/seller/settings?tab=notifications');
    } else if (role === 'admin') {
      navigate('/admin/settings?tab=notifications');
    } else {
      navigate('/account/notifications');
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div ref={containerRef} className="relative z-[900]">
      {/* Dynamic Bell Icon Button */}
      <button
        onClick={handleBellClick}
        aria-label="Notifications"
        className={clsx(
          'size-[34px] rounded-md bg-brand-pale-orange flex items-center justify-center cursor-pointer shrink-0 border-none hover:opacity-80 transition-opacity relative outline-none',
          isOpen && 'ring-2 ring-brand-orange/20'
        )}
      >
        <Bell size={16} className="text-brand-orange" />
        {unreadCount > 0 && (
          <span className="absolute -top-[3px] -right-[3px] min-w-[15px] h-[15px] bg-[#C0392B] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] border border-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Bell Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] bg-white border border-bone rounded-[16px] w-[320px] md:w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-bone flex items-center justify-between bg-cream/30">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-carbon">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-[2px] rounded-full text-[9px] font-bold bg-brand-pale-orange text-brand-orange">
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
          <div className="max-h-[300px] overflow-y-auto divide-y divide-[#F5F4EF]">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  className={clsx(
                    'p-3 flex gap-3 text-left transition-colors duration-150 relative group cursor-pointer hover:bg-cream/40',
                    !notif.isRead && 'bg-brand-pale-orange/20'
                  )}
                >
                  {/* Category icon */}
                  <div className="size-8 rounded-lg bg-bone flex items-center justify-center shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={clsx('text-[12px] text-charcoal leading-tight', !notif.isRead ? 'font-bold' : 'font-medium')}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate mt-1 leading-normal break-words">
                      {notif.body}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate mt-1.5">
                      <Clock size={9} />
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        className="size-5 rounded bg-white border border-bone flex items-center justify-center cursor-pointer text-success hover:bg-success-bg transition-colors"
                      >
                        <Check size={11} />
                      </button>
                    )}
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className="size-5 rounded bg-white border border-bone flex items-center justify-center cursor-pointer text-error hover:bg-error-bg transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Unread blue dot indicator */}
                  {!notif.isRead && (
                    <span className="absolute right-3 bottom-3 w-[6px] h-[6px] rounded-full bg-brand-orange shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 px-4 text-center">
                <Bell size={24} className="text-slate/40 mx-auto mb-2" />
                <p className="text-[12px] font-medium text-slate">All caught up!</p>
                <p className="text-[10px] text-slate/75 mt-0.5">No new notifications.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAll}
            className="w-full py-2.5 border-t border-bone bg-cream/10 text-center text-[12px] font-semibold text-brand-orange hover:text-brand-deep-orange hover:bg-cream/30 cursor-pointer border-none"
          >
            View all notification settings
          </button>
        </div>
      )}

      {/* Slide-in real-time push toast overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-carbon text-white rounded-xl border border-charcoal p-3.5 flex gap-3.5 max-w-[340px] animate-slide-in duration-300">
          <div className="size-9 rounded-lg bg-dark-active flex items-center justify-center shrink-0 border border-charcoal">
            {getNotificationIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-bold leading-tight">{toast.title}</p>
            <p className="text-[11.5px] text-slate mt-1 leading-normal">{toast.body}</p>
          </div>
          <button
            onClick={clearToast}
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
