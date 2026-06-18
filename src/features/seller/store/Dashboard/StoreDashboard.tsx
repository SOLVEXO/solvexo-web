import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Package, Users,
  CheckCircle, Clock, Globe, Copy, ExternalLink,
  ArrowRight, Settings, Sparkles, BarChart2,
  ClipboardList, Megaphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { AreaChart } from '@/components/comman/charts';

// ── Sample revenue data (replaced by real data once sales exist) ───────────────
const sampleRevenue = [
  { month: 'Jan', revenue: 420  },
  { month: 'Feb', revenue: 680  },
  { month: 'Mar', revenue: 510  },
  { month: 'Apr', revenue: 900  },
  { month: 'May', revenue: 760  },
  { month: 'Jun', revenue: 1120 },
];

// ── Badge style maps ───────────────────────────────────────────────────────────
const planStyles: Record<string, { bg: string; color: string }> = {
  starter:      { bg: '#EAF0FB', color: '#2156A8' },
  professional: { bg: '#EAF7EF', color: '#1E7A3C' },
  enterprise:   { bg: '#F5F0FF', color: '#7C3AED' },
};
const typeStyles: Record<string, { bg: string; color: string }> = {
  creator: { bg: '#FFF4E5', color: '#B36200' },
  seller:  { bg: '#EAF0FB', color: '#2156A8' },
  brand:   { bg: '#F5F0FF', color: '#7C3AED' },
};

// ── Metric Card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub:   string;
  Icon:  LucideIcon;
  color: string;
}
function MetricCard({ label, value, sub, Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-[10px] border border-bone shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-[18px]">
      <div
        className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-[14px]"
        style={{ background: color + '18' }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-[6px]">{label}</p>
      <p className="text-[26px] font-bold text-charcoal leading-[1.2]">{value}</p>
      <p className="text-[11px] text-slate mt-[5px]">{sub}</p>
    </div>
  );
}

// ── Store Info Card ───────────────────────────────────────────────────────────
function StoreInfoCard() {
  const navigate = useNavigate();
  const { store, storeId } = useStoreWorkspace();
  const [copied, setCopied] = useState(false);

  const statusColor = store?.status === 'active' ? '#22C55E' : '#8C8A82';
  const StatusIcon  = store?.status === 'active' ? CheckCircle : Clock;
  const planStyle   = planStyles[store?.plan ?? ''] ?? { bg: '#F0EEE6', color: '#5A5852' };
  const typeStyle   = typeStyles[store?.sellerType ?? ''] ?? { bg: '#F0EEE6', color: '#5A5852' };

  const handleCopy = () => {
    if (store?.slug) {
      navigator.clipboard.writeText(`/${store.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="bg-white rounded-[10px] border border-bone shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex flex-col">

      {/* Logo + name + badges */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F3F2EC]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[10px] bg-brand-pale-orange border border-[#EAE8DE] flex items-center justify-center overflow-hidden shrink-0">
            {store?.logo
              ? <img src={store.logo} alt={store?.name} className="w-full h-full object-cover" />
              : <Globe size={18} className="text-brand-orange" />}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
              {store?.name ?? '—'}
            </p>
            <p className="text-[11px] text-slate mt-[2px]">Store Workspace</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-[6px]">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-[3px] rounded-full"
            style={{ background: statusColor + '18', color: statusColor }}
          >
            <StatusIcon size={9} />
            {store?.status ?? '—'}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-[3px] rounded-full"
            style={planStyle}
          >
            {store?.plan ?? '—'} plan
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-[3px] rounded-full capitalize"
            style={typeStyle}
          >
            {store?.sellerType ?? '—'}
          </span>
        </div>
      </div>

      {/* URL + Product Types */}
      <div className="px-5 py-4 border-b border-[#F3F2EC] flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em] mb-1.5">Store URL</p>
          <div className="flex items-center gap-2 bg-[#F7F6F1] rounded-[7px] px-[10px] py-[8px] border border-[#EDEBD8]">
            <span className="flex-1 text-[12px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
              /{store?.slug ?? '…'}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 border-0 bg-transparent p-0 cursor-pointer transition-transform active:scale-90"
              title="Copy URL"
            >
              <Copy size={12} className={copied ? 'text-[#22C55E]' : 'text-slate'} />
            </button>
          </div>
          {copied && <p className="text-[10px] text-[#22C55E] mt-1 font-medium">Copied!</p>}
        </div>

        {(store?.productTypes?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em] mb-1.5">
              Product Types
            </p>
            <div className="flex flex-wrap gap-1">
              {store!.productTypes!.map(pt => (
                <span
                  key={pt}
                  className="text-[10px] font-medium text-charcoal bg-bone border border-[#E8E6DC] px-[8px] py-[3px] rounded-[5px] capitalize"
                >
                  {pt.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action links */}
      <div className="px-3 py-3 mt-auto flex flex-col gap-0.5">
        <button
          onClick={() => navigate(`/seller/store/${storeId}/settings`)}
          className="flex items-center gap-2.5 px-[10px] py-[9px] rounded-[7px] text-[12px] font-medium text-charcoal bg-transparent border-0 cursor-pointer text-left transition-colors duration-100 hover:bg-[#F7F6F1] w-full"
        >
          <Settings size={13} className="text-slate shrink-0" />
          Store Settings
          <ArrowRight size={11} className="text-[#C0BDB5] ml-auto" />
        </button>
        {store?.slug && (
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-[10px] py-[9px] rounded-[7px] text-[12px] font-medium text-charcoal no-underline transition-colors duration-100 hover:bg-[#F7F6F1]"
          >
            <ExternalLink size={13} className="text-slate shrink-0" />
            View Live Store
            <ExternalLink size={10} className="text-[#C0BDB5] ml-auto" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Quick Actions Row ─────────────────────────────────────────────────────────
interface QuickAction { Icon: LucideIcon; label: string; path: string; color: string }

function QuickActionsRow({ storeId }: { storeId: string }) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    { Icon: ShoppingBag,   label: 'Add Product', path: 'products/add', color: '#D97757' },
    { Icon: Package,       label: 'View Orders', path: 'orders',        color: '#8B5CF6' },
    { Icon: BarChart2,     label: 'Analytics',   path: 'analytics',     color: '#0EA5E9' },
    { Icon: ClipboardList, label: 'Inventory',   path: 'inventory',     color: '#22C55E' },
    { Icon: Megaphone,     label: 'Marketing',   path: 'marketing',     color: '#F59E0B' },
    { Icon: Sparkles,      label: 'AI Studio',   path: 'ai/studio',     color: '#A855F7' },
  ];

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="px-5 pt-4 pb-3 border-b border-[#F3F2EC]">
        <p className="text-sm font-bold text-charcoal">Quick Actions</p>
      </div>
      <div className="px-4 py-4 grid grid-cols-6 gap-3">
        {actions.map(({ Icon, label, path, color }) => (
          <button
            key={label}
            onClick={() => navigate(`/seller/store/${storeId}/${path}`)}
            className="flex flex-col items-center gap-2 py-4 px-2 rounded-[10px] border border-bone bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#FAF9F5] w-full"
          >
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center"
              style={{ background: color + '18' }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-[11px] font-medium text-charcoal text-center leading-[1.3]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="px-7 py-6 flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-[10px] border border-bone p-5">
            <div className="animate-pulse w-9 h-9 rounded-[8px] bg-bone mb-[14px]" />
            <div className="animate-pulse w-20 h-2.5 rounded bg-bone mb-2" />
            <div className="animate-pulse w-24 h-6 rounded bg-bone mb-1.5" />
            <div className="animate-pulse w-32 h-2.5 rounded bg-bone" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="bg-white rounded-[10px] border border-bone p-5 h-[300px]">
          <div className="animate-pulse w-36 h-3.5 rounded bg-bone mb-2" />
          <div className="animate-pulse w-24 h-2.5 rounded bg-bone mb-5" />
          <div className="animate-pulse w-full h-[200px] rounded bg-bone" />
        </div>
        <div className="bg-white rounded-[10px] border border-bone h-[300px]">
          <div className="px-5 pt-5 pb-4 border-b border-[#F3F2EC] flex items-center gap-3">
            <div className="animate-pulse w-10 h-10 rounded-[10px] bg-bone shrink-0" />
            <div className="flex-1">
              <div className="animate-pulse w-24 h-3.5 rounded bg-bone mb-1.5" />
              <div className="animate-pulse w-16 h-2.5 rounded bg-bone" />
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-2">
            {[0,1,2].map(i => <div key={i} className="animate-pulse w-full h-8 rounded bg-bone" />)}
          </div>
        </div>
      </div>
      <div className="animate-pulse bg-white rounded-[10px] border border-bone h-[136px]" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const { store, storeId, loading } = useStoreWorkspace();

  const subtitle = store
    ? `${store.sellerType ?? 'Seller'} · ${store.plan ?? ''} plan`
    : '';

  return (
    <div>
      <StorePageHeader
        title={loading ? 'Dashboard' : `${store?.name ?? ''} Dashboard`}
        subtitle={subtitle}
        actions={
          store?.slug ? (
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-[7px] bg-white border border-bone rounded-[7px] text-[12px] font-medium text-charcoal no-underline transition-colors duration-100 hover:bg-[#FAF9F5]"
            >
              <ExternalLink size={12} />
              View Store
            </a>
          ) : null
        }
      />

      {loading ? <DashSkeleton /> : (
        <div className="px-7 py-6 flex flex-col gap-5">

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Total Revenue"   value="$0" sub="No sales yet"           Icon={TrendingUp}  color="#D97757" />
            <MetricCard label="Total Orders"    value="0"  sub="No orders yet"          Icon={Package}     color="#8B5CF6" />
            <MetricCard label="Active Products" value="0"  sub="Add your first product" Icon={ShoppingBag} color="#0EA5E9" />
            <MetricCard label="Customers"       value="0"  sub="No customers yet"       Icon={Users}       color="#22C55E" />
          </div>

          {/* Revenue Chart + Store Info */}
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            <AreaChart
              data={sampleRevenue}
              dataKey="revenue"
              xKey="month"
              title="Revenue Overview"
              subtitle="Monthly revenue trend"
              action={
                <span className="text-[10px] font-medium text-slate bg-bone border border-[#E8E6DC] px-[8px] py-[3px] rounded-[5px]">
                  Sample data
                </span>
              }
              height={220}
              valuePrefix="$"
              yTickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            />
            <StoreInfoCard />
          </div>

          {/* Quick Actions */}
          <QuickActionsRow storeId={storeId} />

        </div>
      )}
    </div>
  );
}
