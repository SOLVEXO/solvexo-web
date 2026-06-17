import { TrendingUp, ShoppingBag, Package, Users, CheckCircle, Clock, Globe } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashSkeleton() {
  const box = (w: string, h: number) => (
    <div className="animate-pulse rounded-[6px] bg-bone" style={{ width: w, height: h }} />
  );
  return (
    <div className="px-7 py-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 border border-bone">
            {box('40px', 40)}<div className="mt-3">{box('80px', 12)}</div><div className="mt-1.5">{box('120px', 20)}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="bg-white rounded-xl p-5 border border-bone h-[260px]">
          {box('60%', 14)}<div className="mt-2">{box('40%', 10)}</div>
          <div className="mt-5 flex items-end gap-2 h-[150px]">
            {[60,90,75,110,85,140,95,120,80,100,130,110].map((h, i) => (
              <div key={i} className="animate-pulse flex-1 rounded-[4px] bg-bone" style={{ height: h }} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-bone h-[260px]">
          {box('50%', 14)}<div className="mt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex justify-between mt-4">
                {box('40%', 10)}{box('25%', 10)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  label:  string;
  value:  string;
  change: string;
  up:     boolean;
  Icon:   typeof TrendingUp;
  color:  string;
}
function MetricCard({ label, value, change, up, Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-bone">
      <div
        className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center mb-3"
        style={{ background: color + '22' }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-[11px] text-slate font-medium mb-1">{label}</p>
      <p className="text-[22px] font-bold text-charcoal leading-none">{value}</p>
      <p className="text-[11px] mt-[5px] font-medium" style={{ color: up ? '#22C55E' : '#EF4444' }}>
        {up ? '▲' : '▼'} {change} <span className="text-slate font-normal">vs last month</span>
      </p>
    </div>
  );
}

// ── Store Info Row ────────────────────────────────────────────────────────────
function InfoPill({ label, value, color = '#D97757' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-[14px] py-2 bg-bone rounded-lg border border-bone">
      <span className="text-[11px] text-slate">{label}</span>
      <span
        className="text-[12px] font-semibold px-2 py-[2px] rounded"
        style={{ color, background: color + '18' }}
      >{value}</span>
    </div>
  );
}

// ── Bar Chart (dummy) ─────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BAR_DATA = [32,56,44,78,60,92,68,84,55,72,95,80];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const { store, loading } = useStoreWorkspace();

  const subtitle = store ? `${store.sellerType ?? 'Seller'} · ${store.plan ?? ''}` : '';

  const statusColor = store?.status === 'active' ? '#22C55E' : '#8C8A82';
  const statusIcon  = store?.status === 'active' ? CheckCircle : Clock;
  const StatusIcon  = statusIcon;

  return (
    <div>
      <StorePageHeader
        title={loading ? 'Loading…' : `${store?.name ?? ''} Dashboard`}
        subtitle={subtitle}
      />

      {loading ? <DashSkeleton /> : (
        <div className="px-7 py-6">

          {/* Store pills */}
          <div className="flex gap-2 flex-wrap mb-[22px]">
            <InfoPill label="Status" value={store?.status ?? '—'} color={statusColor} />
            <InfoPill label="Plan"   value={store?.plan   ?? '—'} color="#8B5CF6" />
            {store?.sellerType && <InfoPill label="Type" value={store.sellerType} color="#0EA5E9" />}
            {store?.slug && <InfoPill label="URL" value={`/${store.slug}`} color="#D97757" />}
            {(store?.productTypes?.length ?? 0) > 0 && (
              <InfoPill label="Product types" value={store!.productTypes!.join(', ')} color="#059669" />
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Revenue"   value="$0"  change="—"   up Icon={TrendingUp}  color="#D97757" />
            <MetricCard label="Total Orders"    value="0"   change="—"   up Icon={Package}     color="#8B5CF6" />
            <MetricCard label="Active Products" value="0"   change="—"   up Icon={ShoppingBag} color="#0EA5E9" />
            <MetricCard label="Customers"       value="0"   change="—"   up Icon={Users}       color="#22C55E" />
          </div>

          {/* Charts row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>

            {/* Revenue chart */}
            <div className="bg-white rounded-xl p-5 border border-bone">
              <p className="text-[14px] font-semibold text-charcoal mb-0.5">Revenue Overview</p>
              <p className="text-[11px] text-slate mb-5">Monthly revenue trend (coming soon)</p>
              <div className="flex items-end gap-[5px] h-[140px]">
                {BAR_DATA.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-brand-orange rounded-t-[4px] opacity-25"
                      style={{ height: `${(h / 100) * 130}px` }}
                    />
                    <span className="text-[9px] text-slate">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-[14px] px-[14px] py-[10px] rounded-lg bg-bone border border-bone flex items-center gap-2">
                <Globe size={14} className="text-slate" />
                <span className="text-[11px] text-slate">
                  Revenue data will appear here once you have your first sale.
                </span>
              </div>
            </div>

            {/* Store info */}
            <div className="bg-white rounded-xl p-5 border border-bone">
              <p className="text-[14px] font-semibold text-charcoal mb-[14px]">Store Details</p>
              {[
                { label: 'Store Name',   value: store?.name    ?? '—' },
                { label: 'Category',     value: store?.categoryId ?? '—' },
                { label: 'Description',  value: store?.description ? store.description.slice(0, 50) + (store.description.length > 50 ? '…' : '') : '—' },
                { label: 'Created',      value: store?.createdAt ? new Date(store.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-[9px] border-b border-[#F3F2EC]">
                  <span className="text-[11px] text-slate">{row.label}</span>
                  <span className="text-[11px] font-semibold text-charcoal max-w-[120px] text-right overflow-hidden text-ellipsis whitespace-nowrap">
                    {row.value}
                  </span>
                </div>
              ))}

              <div className="mt-[14px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <StatusIcon size={12} style={{ color: statusColor }} />
                  <span className="text-[11px] font-semibold" style={{ color: statusColor }}>
                    {store?.status === 'active' ? 'Store is live' : `Status: ${store?.status ?? '—'}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
