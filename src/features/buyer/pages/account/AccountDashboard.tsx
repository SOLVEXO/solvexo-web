import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Heart, Bell, MapPin, Package, ImageOff, ChevronRight,
  ShieldCheck, Mail, UserCog, Sparkles, ArrowRight, Store,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useNotification } from '@/contexts/NotificationContext';
import { apiGetMyOrders, type OrderSummary, type OrderStatus } from '@/api/services/orders';
import { apiGetMyAddresses } from '@/api/services/address';
import { Card, MetricCard, PageHeader, Badge, ProgressBar, Button, SkeletonBox, EmptyState } from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';

const STATUS_COLOR: Record<OrderStatus, 'orange' | 'blue' | 'green' | 'red'> = {
  pending: 'orange', processing: 'blue', shipped: 'blue',
  delivered: 'green', completed: 'green', cancelled: 'red',
};

function RecentOrderRow({ order }: { order: OrderSummary }) {
  const navigate = useNavigate();
  const itemCount = order.stores.reduce((n, s) => n + s.itemCount, 0);
  return (
    <button
      onClick={() => navigate('/account/orders')}
      className="w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-cream transition-colors rounded-[10px]"
    >
      <div className="w-9 h-9 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
        <Package size={14} className="text-brand-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-charcoal truncate">{order.orderNumber}</p>
        <p className="text-[11px] text-slate mt-[1px]">
          {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {itemCount} item{itemCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge color={STATUS_COLOR[order.orderStatus]} size="sm" className="capitalize">{order.orderStatus}</Badge>
        <span className="text-[12.5px] font-bold text-carbon whitespace-nowrap">
          {currencySymbol(order.currency)} {order.totalAmount.toLocaleString()}
        </span>
        <ChevronRight size={13} className="text-bone shrink-0" />
      </div>
    </button>
  );
}

function WishlistPreviewImg({ src, name }: { src?: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-12 h-12 rounded-[9px] bg-brand-pale-orange shrink-0 flex items-center justify-center border border-[#EDEBE2]">
        <ImageOff size={16} className="text-brand-orange opacity-40" />
      </div>
    );
  }
  return <img loading="lazy" decoding="async" src={src} alt={name} onError={() => setErr(true)} className="w-12 h-12 rounded-[9px] object-cover shrink-0 border border-[#EDEBE2]" />;
}

export function AccountDashboard() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useGetProfile();
  const { wishlistItems, wishlistCount, loading: wishlistLoading } = useWishlistContext();
  const { unreadCount } = useNotification();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMyOrders({ page: 1, limit: 3 })
      .then(res => {
        if (cancelled) return;
        setOrders(res.data.orders ?? []);
        setTotalOrders(res.data.pagination?.total ?? (res.data.orders ?? []).length);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOrdersLoading(false); });
    apiGetMyAddresses()
      .then(res => { if (!cancelled) setAddressCount((res.data ?? []).length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const completionChecks = [
    !!profile?.name,
    !!profile?.phone,
    !!profile?.address,
    !!profile?.profileImage,
    !!profile?.isVerified,
  ];
  const completionPct = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title={profileLoading ? 'Welcome back' : `Welcome back, ${profile?.name?.split(' ')[0] ?? 'there'}`}
        description={`Member since ${memberSince} · Here's what's happening with your account.`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Total Orders"
          value={totalOrders ?? 0}
          loading={ordersLoading}
          icon={<ShoppingBag size={16} />}
        />
        <MetricCard
          label="Wishlist Items"
          value={wishlistCount}
          loading={wishlistLoading}
          icon={<Heart size={16} />}
        />
        <MetricCard
          label="Saved Addresses"
          value={addressCount ?? 0}
          loading={addressCount === null}
          icon={<MapPin size={16} />}
        />
        <MetricCard
          label="Unread Alerts"
          value={unreadCount}
          icon={<Bell size={16} />}
        />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
        <div className="min-w-0 flex flex-col gap-5">
          {/* Recent orders */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3 border-b border-bone">
              <PageHeader
                title="Recent Orders"
                actions={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />} onClick={() => navigate('/account/orders')}>
                    View all
                  </Button>
                }
              />
            </div>
            {ordersLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[1, 2, 3].map(i => <SkeletonBox key={i} height={56} rounded="10px" />)}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={26} className="text-brand-orange opacity-55" />}
                title="No orders yet"
                description="Your recent purchases will show up here."
                action={{ label: 'Browse Marketplace', onClick: () => navigate('/marketplace'), icon: <Store size={13} /> }}
                className="py-9"
              />
            ) : (
              <div className="px-2 pb-2 flex flex-col">
                {orders.map(o => <RecentOrderRow key={o.orderId} order={o} />)}
              </div>
            )}
          </Card>

          {/* Wishlist preview */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3 border-b border-bone">
              <PageHeader
                title="Wishlist Preview"
                actions={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />} onClick={() => navigate('/account/wishlist')}>
                    View all
                  </Button>
                }
              />
            </div>
            {wishlistLoading ? (
              <div className="p-4 flex gap-3">
                {[1, 2, 3].map(i => <SkeletonBox key={i} width={72} height={72} rounded="10px" />)}
              </div>
            ) : wishlistCount === 0 ? (
              <EmptyState
                icon={<Heart size={26} className="text-brand-orange opacity-55" />}
                title="Wishlist is empty"
                description="Save products you love and find them here."
                className="py-9"
              />
            ) : (
              <div className="px-5 pb-5 pt-1 flex gap-3 flex-wrap">
                {wishlistItems.slice(0, 4).map(item => (
                  <button
                    key={item.product._id}
                    onClick={() => navigate(`/marketplace/${item.product._id}`)}
                    className="flex flex-col items-start gap-1.5 bg-transparent border-none cursor-pointer p-0 text-left w-[84px]"
                  >
                    <WishlistPreviewImg src={item.product.images?.[0]} name={item.product.name} />
                    <p className="text-[11px] text-charcoal font-medium line-clamp-2 leading-tight">{item.product.name}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          {/* Account completion */}
          <Card>
            <p className="text-[12px] font-semibold text-charcoal mb-3 flex items-center gap-1.5">
              <UserCog size={13} className="text-brand-orange" /> Account Completion
            </p>
            <ProgressBar value={completionPct} showValue color={completionPct === 100 ? 'green' : 'orange'} />
            <p className="text-[11px] text-slate mt-3 leading-relaxed">
              {completionPct === 100
                ? 'Your profile is fully set up.'
                : 'Complete your profile for a smoother checkout experience.'}
            </p>
            {completionPct < 100 && (
              <Button variant="outline" size="sm" fullWidth className="mt-3" onClick={() => navigate('/account/profile')}>
                Complete Profile
              </Button>
            )}
          </Card>

          {/* Security status */}
          <Card>
            <p className="text-[12px] font-semibold text-charcoal mb-3 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-brand-orange" /> Security Status
            </p>
            <div className="flex items-center gap-2 mb-2.5">
              <Mail size={13} className={profile?.isVerified ? 'text-success' : 'text-slate'} />
              <span className="text-[12px] text-graphite flex-1">Email verification</span>
              <Badge color={profile?.isVerified ? 'green' : 'gray'} size="sm">
                {profile?.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <ShieldCheck size={13} className="text-success" />
              <span className="text-[12px] text-graphite flex-1">Password protection</span>
              <Badge color="green" size="sm">Active</Badge>
            </div>
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/account/security')}>
              Manage Security
            </Button>
          </Card>

          {/* Quick actions */}
          <Card>
            <p className="text-[12px] font-semibold text-charcoal mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-orange" /> Quick Actions
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Edit Profile',      path: '/account/profile' },
                { label: 'Add New Address',   path: '/account/addresses' },
                { label: 'Track Orders',      path: '/account/orders' },
                { label: 'Notification Settings', path: '/account/notifications' },
                { label: 'Browse Marketplace', path: '/marketplace' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="w-full flex items-center justify-between px-3 py-[9px] rounded-[8px] text-[12.5px] text-charcoal bg-cream hover:bg-bone border-none cursor-pointer transition-colors"
                >
                  {a.label}
                  <ChevronRight size={13} className="text-slate" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
