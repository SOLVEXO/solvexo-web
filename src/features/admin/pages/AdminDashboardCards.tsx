import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Bell, Building2, CheckCircle2, DollarSign, HeartPulse, Layers, Percent, Shield, Store, TrendingUp, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import {
  apiAdminAnalyticsSellerRegistrationTrends, apiAdminAnalyticsTopCategories,
  type AdminOverviewData, type AdminPlatformAlertsData, type AdminPlatformHealthData,
} from '@/api/services/analytics/adminAnalytics';
import { apiAdminFinancePlatformRevenue } from '@/api/services/finance/adminFinance';
import { apiAdminGetPlatformPlanRevenue } from '@/api/services/platformPlans';
import { apiGetAdminActivityLog } from '@/api/services/activityLog';
import { apiGetMerchantHealth } from '@/api/services/admin/adminClients';
import { useAdminAnalyticsGrowthForecast } from '@/hooks/admin/useAdminAnalytics';
import type { AnalyticsRangePreset } from '@/components/comman/analytics/analyticsFilters';
import { AreaChart } from '@/components/comman/charts';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatCurrency, formatNumber, formatPercent } from '@/components/comman/analytics/format';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { timeAgo } from '@/utils/timeAgo';
import type { DashboardWidgetDef, LayoutWidget } from '@/components/comman/dashboard/dashboardTypes';

type Load<T> = { data: T | null; error: string; loading: boolean; retry: () => void };
export interface AdminDashboardData {
  overview: Load<AdminOverviewData>;
  alerts: Load<AdminPlatformAlertsData>;
  health: Load<AdminPlatformHealthData>;
}

const PANEL = 'bg-white border border-bone rounded-2xl h-full flex flex-col overflow-hidden';
const UNAVAILABLE = 'Unavailable';

function Panel({ title, icon, to, children }: { title: string; icon: ReactNode; to?: { label: string; path: string }; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className={PANEL}>
      <div className="px-4 py-3 border-b border-bone flex items-center gap-2.5 shrink-0">
        <div className="size-7 rounded-lg bg-cream text-graphite flex items-center justify-center shrink-0">{icon}</div>
        <p className="flex-1 text-[13px] font-bold text-charcoal">{title}</p>
        {to && <button type="button" onClick={() => navigate(to.path)} className="text-[11.5px] font-semibold text-slate hover:text-brand-orange bg-transparent border-none cursor-pointer">{to.label} →</button>}
      </div>
      <div className="px-4 py-3 flex-1 min-w-0">{children}</div>
    </div>
  );
}

const Skeleton = () => <div className="flex flex-col gap-3">{[0, 1, 2, 3].map(i => <SkeletonBox key={i} className="h-5 w-full" />)}</div>;
const Empty = ({ text }: { text: string }) => <p className="text-[12.5px] text-slate py-6 text-center">{text}</p>;

function Body<T>({ load, empty, children }: { load: Load<T>; empty?: (d: T) => string | null; children: (d: T) => ReactNode }) {
  if (load.error) return <AnalyticsErrorState message={load.error} onRetry={load.retry} />;
  if (load.loading || !load.data) return <Skeleton />;
  const msg = empty?.(load.data);
  return msg ? <Empty text={msg} /> : <>{children(load.data)}</>;
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
function Kpi({ id, data }: { id: string; data: AdminDashboardData }) {
  const { overview, alerts } = data;
  const o = overview.data;
  const pending = overview.loading;
  const show = (label: string, value: string | null, extra: { icon: ReactNode; color: string; sub?: string; trend?: string; trendUp?: boolean }) => (
    <MetricCard label={label} loading={pending} value={value ?? '—'} sub={value === null && !overview.error ? UNAVAILABLE : overview.error ? 'Could not load' : extra.sub}
      trend={value === null ? undefined : extra.trend} trendUp={extra.trendUp} icon={extra.icon} color={extra.color} />
  );
  const num = (v: number | undefined | null) => (o && v !== undefined && v !== null ? formatNumber(v) : null);
  const usd = (v: number | undefined | null) => (o && v !== undefined && v !== null ? formatCurrency(v) : null);

  switch (id) {
    case 'total_stores': return show('Total stores', num(o?.totalStores), { icon: <Store size={16} />, color: '#0D9488' });
    case 'active_stores': return show('Active stores', num(o?.activeStores), { icon: <Store size={16} />, color: '#0EA5E9', sub: o ? `${formatNumber(o.totalStores)} total` : undefined });
    case 'mrr': return show('Subscription MRR', usd(o?.sellerPlatformMRR), { icon: <Wallet size={16} />, color: '#D97757', sub: 'Plan fees only' });
    case 'plan_arr': return show('Annual recurring revenue', usd(o?.sellerPlatformARR), { icon: <Wallet size={16} />, color: '#D97757', sub: 'Plan fees only' });
    case 'paid_subscribers': return show('Paid subscribers', num(o?.activePlatformSubscribers), { icon: <Layers size={16} />, color: '#8B5CF6' });
    case 'churn': return show('Seller churn', o && o.sellerChurnRatePercent !== undefined ? formatPercent(o.sellerChurnRatePercent) : null, { icon: <Percent size={16} />, color: '#EF4444' });
    case 'total_sellers': return show('Seller accounts', num(o?.totalSellers), { icon: <Users size={16} />, color: '#8B5CF6' });
    case 'active_sellers': return show('Active sellers (30 days)', num(o?.sellersActiveThisMonth), { icon: <UserCheck size={16} />, color: '#22C55E' });
    case 'new_users': return show('New users (30 days)', num(o?.newUsers), { icon: <UserPlus size={16} />, color: '#0EA5E9', sub: o ? `${formatNumber(o.totalCustomers)} customers in total` : undefined });
    case 'gmv': return show('Merchant sales volume (30 days)', usd(o?.totalGMV), {
      icon: <DollarSign size={16} />, color: '#64748B', sub: 'Merchants’ sales, not Solvexo revenue',
      trend: o?.totalGMVChangePercent != null ? formatPercent(o.totalGMVChangePercent, { signed: true }) : undefined, trendUp: (o?.totalGMVChangePercent ?? 0) >= 0,
    });
    case 'critical_alerts': {
      const critical = alerts.data ? alerts.data.alerts.filter(a => a.severity === 'critical').length : null;
      return (
        <MetricCard label="Critical incidents" loading={alerts.loading} value={critical === null ? '—' : critical}
          sub={alerts.error ? 'Could not load' : critical === null ? UNAVAILABLE : critical === 0 ? 'All clear' : 'Needs review'}
          icon={<Shield size={16} />} color={critical ? '#DC2626' : '#22C55E'} />
      );
    }
    default: return null;
  }
}

// ── Charts and panels ─────────────────────────────────────────────────────────
function MerchantGrowth({ range }: { range: AnalyticsRangePreset }) {
  const load = useKeyedLoad(() => apiAdminAnalyticsSellerRegistrationTrends({ range }), `growth:${range}`);
  if (load.error) return <div className={`${PANEL} items-center justify-center min-h-[300px]`}><AnalyticsErrorState message={load.error} onRetry={load.retry} /></div>;
  const series = (load.data?.data.series ?? []).map(p => ({ label: p.date.slice(0, 10), newSellers: p.newSellers }));
  return <AreaChart data={series} dataKey="newSellers" xKey="label" title="New merchants over time" subtitle="Seller registrations per period" height={280} loading={load.loading} />;
}

function PlatformRevenue({ range }: { range: AnalyticsRangePreset }) {
  const load = useKeyedLoad(() => apiAdminFinancePlatformRevenue({ range }), `rev:${range}`);
  const rows = (d: NonNullable<typeof load.data>['data']) => [
    ['Plan fees (net of refunds)', d.planRevenue.netUSD], ['Add-ons', d.addons.grossUSD], ['Transaction fees collected', d.transactionFees.collectedUSD],
  ] as [string, number][];
  return (
    <Panel title="Solvexo revenue" icon={<DollarSign size={14} />} to={{ label: 'Finance', path: '/admin/finance' }}>
      <Body load={{ data: load.data?.data ?? null, error: load.error, loading: load.loading, retry: load.retry }}>
        {d => (
          <div className="flex flex-col gap-2.5">
            {rows(d).map(([label, v]) => <div key={label} className="flex justify-between text-[12.5px]"><span className="text-graphite">{label}</span><span className="font-semibold text-charcoal">{formatCurrency(v)}</span></div>)}
            <div className="flex justify-between text-[13px] border-t border-bone pt-2"><span className="font-semibold text-charcoal">Total</span><span className="font-bold text-charcoal">{formatCurrency(d.totalRevenueUSD)}</span></div>
            {d.planTax && <p className="text-[11.5px] text-slate">Plan tax collected (not revenue): {formatCurrency(d.planTax.collectedUSD)}</p>}
          </div>
        )}
      </Body>
    </Panel>
  );
}

function PlanDistribution() {
  const load = useKeyedLoad(() => apiAdminGetPlatformPlanRevenue({ range: '30d' }), 'plans');
  return (
    <Panel title="Plan distribution" icon={<Layers size={14} />} to={{ label: 'Billing', path: '/admin/billing' }}>
      <Body load={{ data: load.data?.data ?? null, error: load.error, loading: load.loading, retry: load.retry }} empty={d => (d.planBreakdown.length ? null : 'No paying stores yet.')}>
        {d => (
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {d.planBreakdown.map(p => (
              <li key={p.planName} className="flex justify-between text-[12.5px]">
                <span className="text-graphite">{p.planName}</span>
                <span className="font-semibold text-charcoal">{formatNumber(p.subscriberCount)} · {formatCurrency(p.mrrUSD)}/mo</span>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Panel>
  );
}

function MerchantHealth() {
  const navigate = useNavigate();
  const load = useKeyedLoad(() => apiGetMerchantHealth({ band: 'at_risk', limit: 5 }), 'merchant-health');
  return (
    <Panel title="Merchants at risk" icon={<HeartPulse size={14} />} to={{ label: 'Clients', path: '/admin/clients' }}>
      <Body load={{ data: load.data?.data ?? null, error: load.error, loading: load.loading, retry: load.retry }}>
        {d => (
          <>
            <p className="text-[12px] text-slate mb-2.5">
              <span className="font-semibold text-error">{formatNumber(d.summary.atRisk)} at risk</span> · {formatCurrency(d.summary.mrrAtRisk)} MRR at stake · {formatNumber(d.summary.attention)} need attention
            </p>
            {d.items.length === 0 ? <Empty text="No store is at risk right now." /> : (
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {d.items.map(m => (
                  <li key={m.storeId}>
                    <button type="button" onClick={() => navigate(`/admin/clients/${m.sellerId}`)}
                      className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left rounded-lg hover:bg-cream/60">
                      <span className="text-[13px] font-bold text-carbon tabular-nums w-6 text-right">{m.score}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-charcoal truncate">{m.storeName}</span>
                        <span className="block text-[11px] text-slate truncate">{m.reasons[0]?.text ?? ''}</span>
                      </span>
                      {m.mrr > 0 && <span className="text-[11.5px] text-graphite tabular-nums">{formatCurrency(m.mrr)}/mo</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Body>
    </Panel>
  );
}

const ALERT_PATH: Record<string, string> = { Payments: '/admin/finance', Revenue: '/admin/finance', Sellers: '/admin/clients' };
const SEVERITY_STYLE: Record<string, string> = { critical: 'bg-[#FEE2E2] text-[#B91C1C]', warning: 'bg-[#FEF3C7] text-[#92400E]', info: 'bg-cream text-graphite' };

function PlatformAlerts({ data }: { data: AdminDashboardData }) {
  const navigate = useNavigate();
  return (
    <Panel title="Platform alerts" icon={<Bell size={14} />}>
      <Body load={data.alerts} empty={d => (d.alerts.length ? null : 'No alerts right now.')}>
        {d => (
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {d.alerts.slice(0, 8).map(a => (
              <li key={a.id}>
                <button type="button" onClick={() => navigate(ALERT_PATH[a.category] ?? '/admin/analytics')} className="w-full flex items-start gap-2.5 text-left bg-transparent border-0 cursor-pointer px-0 py-1">
                  <span className={`shrink-0 mt-0.5 text-[10.5px] font-bold uppercase rounded px-1.5 py-0.5 ${SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.info}`}>{a.severity}</span>
                  <span className="flex-1 min-w-0 text-[12.5px] text-graphite"><span className="font-semibold text-charcoal">{a.category}</span> · {a.message}</span>
                  <ArrowRight size={13} className="shrink-0 mt-1 text-slate/60" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Panel>
  );
}

function SystemHealth({ data }: { data: AdminDashboardData }) {
  const dot = (up: boolean) => <span className={`inline-block size-2 rounded-full ${up ? 'bg-success' : 'bg-error'}`} aria-hidden />;
  return (
    <Panel title="System health" icon={<Activity size={14} />} to={{ label: 'Details', path: '/admin/analytics' }}>
      <Body load={data.health}>
        {d => {
          const failedJobs = d.queueBacklog.reduce((n, q) => n + (q.failed ?? 0), 0);
          const unavailable = d.queueBacklog.filter(q => q.unavailable).length;
          return (
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-[12.5px]">
              <li className="flex justify-between"><span className="text-graphite">Database</span><span className="inline-flex items-center gap-1.5 font-semibold">{dot(d.dependencyStatus.mongodb === 'up')}{d.dependencyStatus.mongodb}</span></li>
              <li className="flex justify-between"><span className="text-graphite">Cache (Redis)</span><span className="inline-flex items-center gap-1.5 font-semibold">{dot(d.dependencyStatus.redis === 'up')}{d.dependencyStatus.redis}</span></li>
              <li className="flex justify-between"><span className="text-graphite">Failed background jobs</span><span className="font-semibold text-charcoal">{formatNumber(failedJobs)}{unavailable ? ` (${unavailable} queue(s) unavailable)` : ''}</span></li>
              <li className="flex justify-between"><span className="text-graphite">Webhook failure rate</span><span className="font-semibold text-charcoal">{formatPercent(d.webhookReliability.failureRatePercent)} of {formatNumber(d.webhookReliability.totalEvents)}</span></li>
              <li className="text-[11px] text-slate">Checked {timeAgo(d.dependencyStatus.checkedAt)}. API latency and uptime are not monitored here.</li>
            </ul>
          );
        }}
      </Body>
    </Panel>
  );
}

function RecentPlatformActivity({ limit }: { limit: number }) {
  const load = useKeyedLoad(() => apiGetAdminActivityLog({ limit }), `activity:${limit}`);
  return (
    <Panel title="Recent platform activity" icon={<CheckCircle2 size={14} />} to={{ label: 'Activity log', path: '/admin/activity-log' }}>
      <Body load={{ data: load.data?.data.logs ?? null, error: load.error, loading: load.loading, retry: load.retry }} empty={l => (l.length ? null : 'No activity recorded yet.')}>
        {logs => (
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            {logs.map(e => (
              <li key={e._id} className="text-[12.5px]">
                <p className="text-charcoal truncate">{e.description || e.action}</p>
                <p className="text-[11px] text-slate">{e.actorName ?? 'System'} · {timeAgo(e.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Panel>
  );
}

function TopCategories() {
  const load = useKeyedLoad(() => apiAdminAnalyticsTopCategories({ range: '30d', limit: 5 }), 'topcats');
  return (
    <Panel title="Top categories by revenue (30 days)" icon={<TrendingUp size={14} />}>
      <Body load={{ data: load.data?.data ?? null, error: load.error, loading: load.loading, retry: load.retry }} empty={c => (c.length ? null : 'No category revenue yet.')}>
        {cats => {
          const max = Math.max(1, ...cats.map(c => c.revenue));
          return (
            <div className="flex flex-col gap-3.5">
              {cats.map(c => (
                <div key={c.categoryId}>
                  <div className="flex justify-between text-[12px] mb-1"><span className="text-graphite">{c.name}</span><span className="font-semibold text-charcoal">{formatCurrency(c.revenue)}</span></div>
                  <div className="h-2 rounded-full bg-cream overflow-hidden"><div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.round((c.revenue / max) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          );
        }}
      </Body>
    </Panel>
  );
}

function GrowthForecast() {
  const f = useAdminAnalyticsGrowthForecast();
  if (!f.data) return null; // no forecast yet: nothing to show
  return (
    <Panel title="Platform growth forecast" icon={<TrendingUp size={14} />}>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div><p className="text-[11px] text-slate">Next 7 days (net order revenue)</p><p className="text-[15px] font-bold text-charcoal">{formatCurrency(f.data.projectedNext7Days)}</p></div>
        <div><p className="text-[11px] text-slate">Next 30 days (net order revenue)</p><p className="text-[15px] font-bold text-charcoal">{formatCurrency(f.data.projectedNext30Days)}</p></div>
      </div>
      <p className="text-[11px] text-slate mt-2">{f.data.method === 'trend_seasonal' ? 'Trend-based, across all stores.' : 'Simple average while platform history builds up.'}</p>
    </Panel>
  );
}

const QUICK: { label: string; desc: string; path: string; icon: ReactNode }[] = [
  { label: 'Clients', desc: 'Stores, sellers and moderation', path: '/admin/clients', icon: <Building2 size={15} /> },
  { label: 'Finance', desc: 'Revenue, payouts and reports', path: '/admin/finance', icon: <Wallet size={15} /> },
  { label: 'Site content', desc: 'Announcements and FAQs', path: '/admin/content', icon: <Bell size={15} /> },
];
function QuickLinks({ canOpen }: { canOpen: (path: string) => boolean }) {
  const navigate = useNavigate();
  return (
    <Panel title="Quick access" icon={<ArrowRight size={14} />}>
      <div className="flex flex-col gap-2">
        {QUICK.filter(q => canOpen(q.path)).map(q => (
          <button key={q.path} type="button" onClick={() => navigate(q.path)} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-bone bg-white hover:bg-fog cursor-pointer text-left">
            <span className="text-graphite">{q.icon}</span>
            <span className="flex-1 min-w-0"><span className="block text-[12.5px] font-semibold text-charcoal">{q.label}</span><span className="block text-[11px] text-slate truncate">{q.desc}</span></span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function AdminWidget({ def, w, data, canOpen }: { def: DashboardWidgetDef; w: LayoutWidget; data: AdminDashboardData; canOpen: (path: string) => boolean }): ReactNode {
  const range = (typeof w.settings.range === 'string' ? w.settings.range : '30d') as AnalyticsRangePreset;
  const limit = typeof w.settings.limit === 'number' ? w.settings.limit : 8;
  if (def.id.startsWith('kpi.')) return <Kpi id={def.id.slice(4)} data={data} />;
  switch (def.id) {
    case 'merchant_growth': return <MerchantGrowth range={range} />;
    case 'platform_revenue': return <PlatformRevenue range={range} />;
    case 'plan_distribution': return <PlanDistribution />;
    case 'merchant_health': return <MerchantHealth />;
    case 'platform_alerts': return <PlatformAlerts data={data} />;
    case 'system_health': return <SystemHealth data={data} />;
    case 'recent_activity': return <RecentPlatformActivity limit={limit} />;
    case 'top_categories': return <TopCategories />;
    case 'growth_forecast': return <GrowthForecast />;
    case 'quick_links': return <QuickLinks canOpen={canOpen} />;
    default: return null;
  }
}
