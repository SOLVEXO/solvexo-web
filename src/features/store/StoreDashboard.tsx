import { TrendingUp, ShoppingBag, Package, Users, CheckCircle, Clock, Globe } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashSkeleton() {
  const box = (w: number | string, h: number) => (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: 6, background: '#E8E6DC' }} />
  );
  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8E6DC' }}>
            {box(40, 40)}<div style={{ marginTop: 12 }}>{box(80, 12)}</div><div style={{ marginTop: 6 }}>{box(120, 20)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8E6DC', height: 260 }}>
          {box('60%', 14)}<div style={{ marginTop: 8 }}>{box('40%', 10)}</div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
            {[60,90,75,110,85,140,95,120,80,100,130,110].map((h, i) => (
              <div key={i} className="animate-pulse" style={{ flex: 1, height: h, borderRadius: 4, background: '#E8E6DC' }} />
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8E6DC', height: 260 }}>
          {box('50%', 14)}<div style={{ marginTop: 8 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
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
    <div style={{
      background: '#fff', borderRadius: 12, padding: 20,
      border: '1px solid #E8E6DC', fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9,
        background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p style={{ fontSize: 11, color: '#8C8A82', fontWeight: 500, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#141413', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: up ? '#22C55E' : '#EF4444', marginTop: 5, fontWeight: 500 }}>
        {up ? '▲' : '▼'} {change} <span style={{ color: '#8C8A82', fontWeight: 400 }}>vs last month</span>
      </p>
    </div>
  );
}

// ── Store Info Row ────────────────────────────────────────────────────────────
function InfoPill({ label, value, color = '#D97757' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', background: '#FAF9F5', borderRadius: 8,
      border: '1px solid #E8E6DC',
    }}>
      <span style={{ fontSize: 11, color: '#8C8A82' }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, color,
        background: color + '18', padding: '2px 8px', borderRadius: 4,
      }}>{value}</span>
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
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <StorePageHeader
        title={loading ? 'Loading…' : `${store?.name ?? ''} Dashboard`}
        subtitle={subtitle}
      />

      {loading ? <DashSkeleton /> : (
        <div style={{ padding: '24px 28px' }}>

          {/* Store pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            <InfoPill label="Status" value={store?.status ?? '—'} color={statusColor} />
            <InfoPill label="Plan"   value={store?.plan   ?? '—'} color="#8B5CF6" />
            {store?.sellerType && <InfoPill label="Type" value={store.sellerType} color="#0EA5E9" />}
            {store?.slug && <InfoPill label="URL" value={`/${store.slug}`} color="#D97757" />}
            {(store?.productTypes?.length ?? 0) > 0 && (
              <InfoPill label="Product types" value={store!.productTypes!.join(', ')} color="#059669" />
            )}
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <MetricCard label="Total Revenue"   value="$0"  change="—"   up Icon={TrendingUp}  color="#D97757" />
            <MetricCard label="Total Orders"    value="0"   change="—"   up Icon={Package}     color="#8B5CF6" />
            <MetricCard label="Active Products" value="0"   change="—"   up Icon={ShoppingBag} color="#0EA5E9" />
            <MetricCard label="Customers"       value="0"   change="—"   up Icon={Users}       color="#22C55E" />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            {/* Revenue chart */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8E6DC' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 2 }}>Revenue Overview</p>
              <p style={{ fontSize: 11, color: '#8C8A82', marginBottom: 20 }}>Monthly revenue trend (coming soon)</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140 }}>
                {BAR_DATA.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%',
                      height: `${(h / 100) * 130}px`,
                      background: '#D97757',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.25,
                    }} />
                    <span style={{ fontSize: 9, color: '#8C8A82' }}>{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8,
                background: '#FAF9F5', border: '1px solid #E8E6DC',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Globe size={14} style={{ color: '#8C8A82' }} />
                <span style={{ fontSize: 11, color: '#8C8A82' }}>
                  Revenue data will appear here once you have your first sale.
                </span>
              </div>
            </div>

            {/* Store info */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8E6DC' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 14 }}>Store Details</p>
              {[
                { label: 'Store Name',   value: store?.name    ?? '—' },
                { label: 'Category',     value: store?.categoryId ?? '—' },
                { label: 'Description',  value: store?.description ? store.description.slice(0, 50) + (store.description.length > 50 ? '…' : '') : '—' },
                { label: 'Created',      value: store?.createdAt ? new Date(store.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '9px 0', borderBottom: '1px solid #F3F2EC',
                }}>
                  <span style={{ fontSize: 11, color: '#8C8A82' }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#141413', maxWidth: 120, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.value}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <StatusIcon size={12} style={{ color: statusColor }} />
                  <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
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
