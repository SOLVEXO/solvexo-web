import { useState, useEffect } from 'react';
import {
  Zap, PackageCheck, Bell, ShoppingBag, Search, Gift, ShieldCheck, Award, Headphones,
  Signal, Wifi, BatteryFull, Home, LayoutGrid, ShoppingCart, Package, User, Shirt, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { QrGlyph, StoreBadgeChip, RatingRow } from './AppPromoParts';
import { apiGetPlatformStats, type PlatformStats } from '@/api/services/store';

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const FEATURES = [
  { Icon: Zap,          title: 'Faster, one-tap checkout',         sub: 'Complete your order in seconds' },
  { Icon: PackageCheck, title: 'Real-time order tracking',         sub: 'Track every step in real time' },
  { Icon: Bell,         title: 'Instant deal & price-drop alerts', sub: 'Never miss the best deals' },
];

// ── Shared iOS-style status bar — time + signal/wifi/battery glyphs ───────────
export function StatusBar({ dark = false }: { dark?: boolean }) {
  const tone = dark ? 'text-white' : 'text-carbon';
  return (
    <div className={clsx('h-8 flex items-center justify-between px-[16px] pt-[4px] text-[9px] font-semibold', tone)}>
      <span>9:41</span>
      <div className="flex items-center gap-[4px]">
        <Signal size={10} className={tone} />
        <Wifi size={10} className={tone} />
        <BatteryFull size={13} className={tone} />
      </div>
    </div>
  );
}

// ── Shared bottom tab bar — Home / Categories / Cart / Orders / Account ───────
const TAB_ITEMS = [
  { Icon: Home,         label: 'Home' },
  { Icon: LayoutGrid,   label: 'Categories' },
  { Icon: ShoppingCart, label: 'Cart' },
  { Icon: Package,      label: 'Orders' },
  { Icon: User,         label: 'Account' },
] as const;

function BottomTabBar({ active }: { active: number }) {
  return (
    <div className="mt-auto h-[42px] border-t border-bone flex items-center justify-around px-1 bg-white">
      {TAB_ITEMS.map(({ Icon, label }, i) => (
        <div key={label} className="flex flex-col items-center gap-[2px]">
          <Icon size={13} className={i === active ? 'text-brand-orange' : 'text-slate/70'} />
          <span className={clsx('text-[5.5px] font-medium', i === active ? 'text-brand-orange' : 'text-slate/70')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── "My Orders" screen — back phone ────────────────────────────────────────────
function OrdersScreenMockup() {
  const tabs = ['All', 'Processing', 'Shipped', 'Delivered'];
  const orders = [
    { id: '124578', status: 'Delivered',  color: 'bg-success-bg text-success',           items: '2 items',  price: 129.98, date: 'Apr 24, 2025' },
    { id: '124577', status: 'Shipped',    color: 'bg-info-bg text-info',          items: '1 item',   price: 59.99,  date: 'Apr 23, 2025' },
    { id: '124576', status: 'Processing', color: 'bg-[#fef3c7] text-[#b45309]',          items: '3 items',  price: 199.97, date: 'Apr 22, 2025' },
    { id: '124575', status: 'Delivered',  color: 'bg-success-bg text-success',           items: '1 item',   price: 89.99,  date: 'Apr 20, 2025' },
  ];
  return (
    <div className="relative w-full h-full bg-white overflow-hidden flex flex-col">
      <StatusBar />
      <div className="px-[14px] pt-[6px] pb-[8px]">
        <p className="text-[13px] font-bold text-carbon">My Orders</p>
      </div>
      <div className="flex items-center gap-[14px] px-[14px] border-b border-bone">
        {tabs.map((t, i) => (
          <span key={t} className={clsx(
            'text-[8px] font-semibold pb-[7px] border-b-2',
            i === 0 ? 'text-brand-orange border-brand-orange' : 'text-slate border-transparent',
          )}>
            {t}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-[7px] px-[10px] pt-[9px] overflow-hidden">
        {orders.map((o, i) => (
          <div key={i} className="flex items-center gap-[8px] rounded-[10px] border border-bone p-[8px]">
            <div className="w-9 h-9 rounded-[7px] bg-brand-pale-orange shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[5px]">
                <p className="text-[8px] font-semibold text-carbon truncate">Order #SX{o.id}</p>
                <span className={clsx('shrink-0 px-[6px] py-[1.5px] rounded-full text-[6.5px] font-semibold', o.color)}>{o.status}</span>
              </div>
              <p className="text-[7px] text-slate mt-[2px]">{o.items} · ${o.price.toFixed(2)}</p>
              <p className="text-[6.5px] text-slate/70 mt-[1px]">{o.status === 'Delivered' ? 'Delivered' : o.status === 'Shipped' ? 'Shipped' : 'Placed'} on {o.date}</p>
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar active={3} />
    </div>
  );
}

// ── Home / discover screen — front phone ───────────────────────────────────────
const HOME_CATEGORIES = [
  { Icon: Headphones, label: 'Electronics' },
  { Icon: Shirt,       label: 'Fashion' },
  { Icon: Home,        label: 'Home' },
  { Icon: Sparkles,    label: 'Beauty' },
  { Icon: MoreHorizontal, label: 'More' },
];

const FLASH_DEAL_PRODUCTS = [
  { name: 'Wireless Headphones', color: '#EDE9FE', price: 59.99,  compareAt: 89.99,  pct: 33 },
  { name: 'Smart Watch Pro',     color: '#E6F1FB', price: 89.99,  compareAt: 129.99, pct: 31 },
  { name: 'Air Purifier',        color: '#EBF7EF', price: 129.99, compareAt: 199.99, pct: 35 },
];

export function HomeScreenMockup() {
  return (
    <div className="relative w-full h-full bg-white overflow-hidden flex flex-col">
      <StatusBar />
      <div className="h-9 flex items-center justify-between px-[13px]">
        <p className="text-[13px] font-bold text-carbon flex items-center gap-[3px]">
          <span className="w-4 h-4 rounded-[5px] bg-brand-orange text-white flex items-center justify-center text-[9px] font-black">S</span>
          solvexo
        </p>
        <Bell size={13} className="text-brand-orange" />
      </div>
      <div className="px-[11px]">
        <div className="flex items-center gap-[6px] rounded-full border border-bone bg-cream px-[10px] py-[6px] mb-[9px]">
          <Search size={10} className="text-slate" />
          <span className="text-[7.5px] text-slate">Search products, stores...</span>
        </div>

        <div className="rounded-[12px] bg-gradient-to-br from-brand-orange to-brand-deep-orange px-[11px] py-[10px] flex items-center justify-between mb-[10px]">
          <div>
            <p className="text-[8.5px] font-bold text-white leading-tight">EXTRA 20% OFF</p>
            <p className="text-[7px] text-white/85 leading-tight mt-[1px]">App Exclusive Deals</p>
            <span className="inline-block mt-[5px] px-[8px] py-[2.5px] rounded-full bg-white text-[6.5px] font-bold text-brand-deep-orange">Shop Now</span>
          </div>
          <Gift size={22} className="text-white/90 shrink-0" />
        </div>

        <div className="flex items-center justify-between mb-[6px]">
          <p className="text-[8.5px] font-bold text-carbon">Categories</p>
          <span className="text-[7px] text-brand-orange font-semibold">See all &gt;</span>
        </div>
        <div className="flex items-center justify-between mb-[10px]">
          {HOME_CATEGORIES.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-[4px]">
              <span className="w-[26px] h-[26px] rounded-full bg-cream border border-bone flex items-center justify-center">
                <Icon size={12} className="text-brand-orange" />
              </span>
              <span className="text-[5.5px] text-slate whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-[6px]">
          <p className="text-[8.5px] font-bold text-carbon">Flash Deals</p>
          <span className="text-[7px] font-semibold text-error tabular-nums">02:45:30</span>
        </div>
        <div className="grid grid-cols-3 gap-[6px]">
          {FLASH_DEAL_PRODUCTS.map((p, i) => (
            <div key={i} className="rounded-[8px] border border-bone overflow-hidden relative">
              <div className="aspect-square relative" style={{ background: p.color }}>
                <span className="absolute top-[3px] left-[3px] px-[4px] py-[1px] rounded-[3px] text-[5px] font-bold bg-[#e11d48] text-white">-{p.pct}%</span>
              </div>
              <div className="px-[4px] py-[3px]">
                <p className="text-[5.5px] font-semibold text-charcoal truncate">{p.name}</p>
                <div className="flex items-baseline gap-[3px]">
                  <p className="text-[6.5px] font-bold text-carbon">${p.price}</p>
                  <p className="text-[5px] text-slate line-through">${p.compareAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomTabBar active={0} />
    </div>
  );
}

export function PhoneShell({ className, primary = true, children }: { className?: string; primary?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx('relative shrink-0 w-[188px] xl:w-[204px] aspect-[9/19]', primary ? 'z-[1]' : 'opacity-95', className)}>
      {/* Side buttons — the detail that reads "real phone" instead of a bare rounded rectangle */}
      <div className="absolute -left-px top-[20%] w-[2px] h-[6%] rounded-l-sm bg-[#0a0a09]" />
      <div className="absolute -left-px top-[29%] w-[2px] h-[9%] rounded-l-sm bg-[#0a0a09]" />
      <div className="absolute -left-px top-[40%] w-[2px] h-[9%] rounded-l-sm bg-[#0a0a09]" />
      <div className="absolute -right-px top-[24%] w-[2px] h-[10%] rounded-r-sm bg-[#0a0a09]" />

      <div className={clsx(
        'w-full h-full rounded-[36px] bg-gradient-to-b from-[#333130] via-carbon to-[#0a0a09] p-[8px] border',
        primary ? 'border-white/20' : 'border-white/10',
      )}>
        <div className="relative w-full h-full rounded-[28px] overflow-hidden ring-1 ring-black/60">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[38%] h-[16px] bg-carbon rounded-b-[12px] z-20" />
          {children}
          {/* Home indicator */}
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[30%] h-[4px] rounded-full bg-carbon/25 z-20" />
        </div>
      </div>
    </div>
  );
}

export function AppDownloadBanner({ className }: { className?: string }) {
  // Self-fetches — this banner is reused across several pages that don't already
  // load platform stats, so it can't rely on a prop from the caller.
  const [stats, setStats] = useState<PlatformStats | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiGetPlatformStats()
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { /* non-critical — trust stats just fall back to static copy */ });
    return () => { cancelled = true; };
  }, []);

  // "Secure Shopping" and "Customer Support" are policy statements, not measured
  // metrics — there's no backing field for either, so those two stay static.
  // Happy Shoppers / Verified Stores are real counts once they load.
  const trustStats = [
    { Icon: ShoppingBag, value: stats ? `${compactNumber.format(stats.buyersCount)}+` : '—', label: 'Happy Shoppers' },
    { Icon: ShieldCheck, value: '100%', label: 'Secure Shopping' },
    { Icon: Award,       value: stats ? `${compactNumber.format(stats.storesCount)}+` : '—', label: 'Verified Stores' },
    { Icon: Headphones,  value: '24/7', label: 'Customer Support' },
  ];

  return (
    <section className={clsx('relative overflow-hidden rounded-2xl bg-gradient-to-br from-carbon to-charcoal', className)}>
      {/* Thin top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-orange to-[#f0a57a]" />

      {/* Soft ambient circle + faint dotted-grid texture — CSS only. No orange
          here — the only orange glow in this banner lives locally behind the
          phone mockups (see the phone-cluster spotlight below), not hero-wide. */}
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[#3a3633] -top-20 -right-16 pointer-events-none" />
      <div
        className="hidden lg:block absolute right-0 top-0 bottom-0 w-[40%] opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />

      <div className="relative z-[1] px-6 sm:px-8 lg:px-10 pt-6 sm:pt-7 pb-5 grid grid-cols-1 lg:grid-cols-[1.1fr_auto_auto] items-center gap-6 lg:gap-8">

        {/* Copy + features */}
        <div className="text-center lg:text-left min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 bg-[rgba(217,119,87,0.15)] border border-[rgba(217,119,87,0.3)]">
            <ShoppingBag size={12} className="text-brand-orange shrink-0" />
            <span className="text-[11px] font-medium text-brand-orange">Solvexo Mobile</span>
          </div>
          <h3 className="text-[22px] sm:text-[25px] lg:text-[28px] font-bold text-white mb-2 leading-[1.15] tracking-tight">
            Shop <span className="text-brand-orange">smarter.</span> Anywhere, anytime.
          </h3>
          <p className="text-[12.5px] sm:text-[13px] text-[#b0aea8] max-w-[420px] mx-auto lg:mx-0 leading-relaxed mb-3">
            One-tap checkout, live order tracking, and app-only deals — right in your pocket.
          </p>

          <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
            <RatingRow />
          </div>

          {/* Feature cards */}
          <ul className="flex flex-col gap-[6px] mb-4">
            {FEATURES.map(({ Icon, title, sub }) => (
              <li
                key={title}
                className="flex items-center gap-[10px] text-left rounded-xl px-1 py-1"
              >
                <span className="w-8 h-8 rounded-[9px] border border-brand-orange/25 bg-brand-orange/[0.12] flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <p className="text-[12px] font-semibold text-white leading-tight">{title}</p>
                  <p className="text-[10.5px] text-slate leading-tight mt-[1px]">{sub}</p>
                </span>
              </li>
            ))}
          </ul>

          {/* Store badges — decorative only, no app is published yet (see
              StoreBadgeChip/Footer's AppBadge, the same honest pattern used
              everywhere else this codebase promotes the not-yet-real app) */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <StoreBadgeChip platform="ios" />
            <StoreBadgeChip platform="android" />
          </div>
        </div>

        {/* QR code — its own column, beside the phones (not attached to them).
            Decorative pattern only (see QrGlyph) — no real app to scan into
            yet, so the caption says so rather than promising a working scan. */}
        <div className="hidden lg:flex flex-col items-start gap-[8px] shrink-0">
          <div className="rounded-2xl border-2 border-brand-orange/50 p-3">
            <QrGlyph size={84} />
          </div>
          <p className="text-[11px] text-[#b0aea8] leading-tight">Coming soon</p>
          <div className="flex items-center gap-[6px]">
            <Sparkles size={13} className="text-brand-orange" />
            <p className="text-[10.5px] text-brand-orange italic whitespace-nowrap">We'll let you know when it's ready</p>
          </div>
        </div>

        {/* Phone mockups — layered composition: back phone tilted left, lower,
            further left; front phone near-upright, overlapping ~40% of it. */}
        <div className="hidden lg:flex items-end justify-center shrink-0 relative pb-1 pl-6">
          {/* Localized "studio spotlight" — orange only immediately behind the
              phone cluster, fading to nothing well before the hero's edges. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 65% 60% at 50% 55%, rgba(217,119,87,0.30) 0%, rgba(217,119,87,0.12) 40%, transparent 72%)' }}
          />
          {/* Contact shadow — grounds the phones on the pedestal */}
          <div className="absolute bottom-0 w-[220px] h-[30px] rounded-[50%] bg-black/25 blur-[2px]" />

          <PhoneShell primary={false} className="-mr-[86px] -translate-x-[14px] translate-y-[16px] -rotate-[15deg]">
            <OrdersScreenMockup />
          </PhoneShell>
          <PhoneShell className="rotate-[1deg]">
            <HomeScreenMockup />
          </PhoneShell>
        </div>
      </div>

      {/* Trust stats — its own rounded/bordered card, sitting at the bottom of the banner */}
      <div className="relative z-[1] px-6 sm:px-8 lg:px-10 pb-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 sm:px-6 py-[14px]">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-3">
            {trustStats.map(({ Icon, value, label }, i) => (
              <div key={label} className={clsx('flex items-center gap-[8px]', i > 0 && 'sm:border-l sm:border-white/10 sm:pl-4')}>
                <span className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-brand-orange" />
                </span>
                <span>
                  <p className="text-[13px] font-bold text-white leading-none">{value}</p>
                  <p className="text-[10px] text-slate mt-[2px] whitespace-nowrap">{label}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
