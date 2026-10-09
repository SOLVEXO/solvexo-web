import { useMemo, useState, type ReactNode } from 'react';
import { FileBarChart2, Download } from 'lucide-react';
import { Button, MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart } from '@/components/comman/charts';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import {
  apiSellerReportSalesSummary, apiSellerReportSalesBy, apiSellerReportCohorts, apiSellerReportInventoryAbc,
  type SellerAnalyticsParams, type SalesMoneyTotals, type VariantSalesRow, type DiscountSalesRow, type ChannelSalesRow,
  type InventoryAbcRow, type SellerExportSection,
} from '@/api/services/analytics/analytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatBucketLabel } from '@/components/comman/analytics/format';
import { formatMoneyCompact } from '@/utils/currency';

type ReportId = 'finance' | 'variants' | 'discounts' | 'channels' | 'cohorts' | 'abc';

const REPORTS: { id: ReportId; label: string; csv: SellerExportSection }[] = [
  { id: 'finance', label: 'Finance summary', csv: 'sales-summary' },
  { id: 'variants', label: 'Sales by variant', csv: 'sales-by-variant' },
  { id: 'discounts', label: 'Sales by discount', csv: 'sales-by-discount' },
  { id: 'channels', label: 'Sales by channel', csv: 'sales-by-channel' },
  { id: 'cohorts', label: 'Customer cohorts', csv: 'cohorts' },
  { id: 'abc', label: 'Inventory ABC analysis', csv: 'inventory-abc' },
];

const PER_PAGE = 25;
const num = (n: number) => n.toLocaleString('en-US');

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-bone rounded-[10px]">
      <div className="px-5 pt-4 pb-3">
        <p className="text-[14px] font-bold text-charcoal">{title}</p>
        {subtitle && <p className="text-[11.5px] text-slate mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Client-side paging over an already-bounded report (the API caps rows). */
function usePaged<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / PER_PAGE)));
  return {
    rows: rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    pagination: total > PER_PAGE ? { page: safePage, total, perPage: PER_PAGE, onChange: setPage } : undefined,
  };
}

function FinanceSummary({ params, compare }: { params: SellerAnalyticsParams; compare: boolean }) {
  const q = useAnalyticsQuery(apiSellerReportSalesSummary, params);
  const d = q.data;
  if (q.loading && !d) return <ChartCardSkeleton height={260} />;
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  if (!d) return null;
  const money = (v: number) => formatMoneyCompact(v, d.currency);
  const card = (label: string, key: keyof SalesMoneyTotals, sub?: string) => {
    const change = d.changePercent[key];
    return (
      <MetricCard
        key={key} label={label} value={money(d.totals[key])} sub={sub}
        trend={compare && change != null ? `${change > 0 ? '+' : ''}${change}%` : undefined}
        trendUp={key === 'discounts' || key === 'returns' ? (change ?? 0) <= 0 : (change ?? 0) >= 0}
      />
    );
  };
  const columns: TableColumn<SalesMoneyTotals & { date: string }>[] = [
    { key: 'date', header: 'Period', render: r => formatBucketLabel(r.date, d.granularity) },
    { key: 'orders', header: 'Orders', align: 'right', render: r => num(r.orders) },
    { key: 'grossSales', header: 'Gross sales', align: 'right', render: r => money(r.grossSales) },
    { key: 'discounts', header: 'Discounts', align: 'right', render: r => money(-r.discounts) },
    { key: 'returns', header: 'Returns', align: 'right', render: r => money(-r.returns) },
    { key: 'netSales', header: 'Net sales', align: 'right', render: r => money(r.netSales) },
    { key: 'shipping', header: 'Shipping', align: 'right', render: r => money(r.shipping) },
    { key: 'taxes', header: 'Taxes', align: 'right', render: r => money(r.taxes) },
    { key: 'totalSales', header: 'Total sales', align: 'right', render: r => <span className="font-semibold">{money(r.totalSales)}</span> },
  ];
  const rows = [...d.series].reverse();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {card('Gross sales', 'grossSales', `${num(d.totals.orders)} orders`)}
        {card('Discounts', 'discounts')}
        {card('Returns', 'returns')}
        {card('Net sales', 'netSales')}
        {card('Shipping', 'shipping')}
        {card('Taxes', 'taxes')}
        {card('Total sales', 'totalSales', 'Net sales + shipping + taxes')}
      </div>
      <LineChart
        title="Sales over time"
        data={d.series.map(s => ({ label: formatBucketLabel(s.date, d.granularity), net: s.netSales, total: s.totalSales }))}
        lines={[{ dataKey: 'net', label: 'Net sales', color: '#D97757' }, { dataKey: 'total', label: 'Total sales', color: '#0EA5E9' }]}
      />
      <Card title="Finance summary by period" subtitle={d.note}>
        <div className="overflow-x-auto"><Table columns={columns} data={rows} keyExtractor={r => r.date} emptyState={{ icon: <FileBarChart2 size={28} className="text-slate/50" />, title: 'No sales in this period' }} /></div>
      </Card>
    </div>
  );
}

function SalesByVariant({ params }: { params: SellerAnalyticsParams }) {
  const fetcher = useMemo(() => (p: SellerAnalyticsParams) => apiSellerReportSalesBy<VariantSalesRow>({ ...p, dimension: 'variant' }), []);
  const q = useAnalyticsQuery(fetcher, params);
  const paged = usePaged(q.data?.rows ?? []);
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  const money = (v: number) => formatMoneyCompact(v, q.data?.currency);
  const columns: TableColumn<VariantSalesRow>[] = [
    { key: 'name', header: 'Product', render: r => <div className="min-w-0"><p className="truncate font-medium text-charcoal">{r.name}</p>{(r.variantTitle || r.sku) && <p className="text-[11px] text-slate truncate">{[r.variantTitle, r.sku].filter(Boolean).join(' · ')}</p>}</div> },
    { key: 'units', header: 'Units', align: 'right', render: r => num(r.units) },
    { key: 'grossSales', header: 'Gross sales', align: 'right', render: r => money(r.grossSales) },
    { key: 'discounts', header: 'Discounts', align: 'right', render: r => money(-r.discounts) },
    { key: 'returns', header: 'Returns', align: 'right', render: r => money(-r.returns) },
    { key: 'netSales', header: 'Net sales', align: 'right', render: r => <span className="font-semibold">{money(r.netSales)}</span> },
  ];
  return (
    <Card title="Sales by product variant">
      <div className="overflow-x-auto"><Table columns={columns} data={paged.rows} pagination={paged.pagination} loading={q.loading} keyExtractor={r => `${r.productId}:${r.variantId ?? ''}`} emptyState={{ icon: <FileBarChart2 size={28} className="text-slate/50" />, title: 'No sales in this period' }} /></div>
    </Card>
  );
}

function SalesByDiscount({ params }: { params: SellerAnalyticsParams }) {
  const fetcher = useMemo(() => (p: SellerAnalyticsParams) => apiSellerReportSalesBy<DiscountSalesRow>({ ...p, dimension: 'discount' }), []);
  const q = useAnalyticsQuery(fetcher, params);
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  const money = (v: number) => formatMoneyCompact(v, q.data?.currency);
  const TYPE: Record<string, string> = { code: 'Discount code', automatic: 'Automatic', campaign: 'Platform campaign' };
  const columns: TableColumn<DiscountSalesRow>[] = [
    { key: 'name', header: 'Discount', render: r => <span className="font-medium text-charcoal">{r.name}</span> },
    { key: 'type', header: 'Type', render: r => TYPE[r.type] ?? r.type },
    { key: 'orders', header: 'Orders', align: 'right', render: r => num(r.orders) },
    { key: 'discountAmount', header: 'Discount amount', align: 'right', render: r => money(r.discountAmount) },
    { key: 'grossSales', header: 'Gross sales', align: 'right', render: r => money(r.grossSales) },
    { key: 'netSales', header: 'Net sales', align: 'right', render: r => money(r.netSales) },
  ];
  return (
    <Card title="Sales by discount" subtitle="Orders that used each discount code, automatic discount or campaign">
      <div className="overflow-x-auto"><Table columns={columns} data={q.data?.rows ?? []} loading={q.loading} keyExtractor={r => `${r.type}:${r.name}`} emptyState={{ icon: <FileBarChart2 size={28} className="text-slate/50" />, title: 'No discounted sales in this period' }} /></div>
    </Card>
  );
}

function SalesByChannel({ params }: { params: SellerAnalyticsParams }) {
  const fetcher = useMemo(() => (p: SellerAnalyticsParams) => apiSellerReportSalesBy<ChannelSalesRow>({ ...p, dimension: 'channel' }), []);
  const q = useAnalyticsQuery(fetcher, params);
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  const money = (v: number) => formatMoneyCompact(v, q.data?.currency);
  const columns: TableColumn<ChannelSalesRow>[] = [
    { key: 'label', header: 'Sales channel', render: r => <span className="font-medium text-charcoal">{r.label}</span> },
    { key: 'orders', header: 'Orders', align: 'right', render: r => num(r.orders) },
    { key: 'grossSales', header: 'Gross sales', align: 'right', render: r => money(r.grossSales) },
    { key: 'netSales', header: 'Net sales', align: 'right', render: r => money(r.netSales) },
    { key: 'totalSales', header: 'Total sales', align: 'right', render: r => <span className="font-semibold">{money(r.totalSales)}</span> },
  ];
  return (
    <Card title="Sales by channel" subtitle="Online Store, Draft orders, Exchanges and Point of Sale">
      <div className="overflow-x-auto"><Table columns={columns} data={q.data?.rows ?? []} loading={q.loading} keyExtractor={r => r.channel} emptyState={{ icon: <FileBarChart2 size={28} className="text-slate/50" />, title: 'No sales in this period' }} /></div>
    </Card>
  );
}

function CustomerCohorts({ storeId }: { storeId: string }) {
  const [months, setMonths] = useState(12);
  const q = useAnalyticsQuery(apiSellerReportCohorts, { storeId, months });
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  if (q.loading && !q.data) return <ChartCardSkeleton height={260} />;
  const cohorts = q.data?.cohorts ?? [];
  const width = q.data?.months ?? months;
  const shade = (v: number) => `rgba(217, 119, 87, ${Math.min(0.85, 0.08 + v / 100)})`;
  return (
    <Card title="Customer cohort analysis" subtitle="Customers grouped by the month of their first order, and the share who ordered again in each later month">
      <div className="px-5 pb-3 flex items-center gap-2 text-[12px]">
        <span className="text-slate">Months</span>
        {[6, 12, 24].map(m => (
          <button key={m} type="button" onClick={() => setMonths(m)} className={`px-2.5 py-1 rounded-md border text-[12px] cursor-pointer ${months === m ? 'border-brand-orange bg-brand-pale-orange text-charcoal' : 'border-bone bg-white text-slate'}`}>{m}</button>
        ))}
      </div>
      {cohorts.every(c => c.customers === 0) ? (
        <p className="px-5 pb-5 text-[12.5px] text-slate">No first-time customers in this window yet.</p>
      ) : (
        <div className="overflow-x-auto px-5 pb-5">
          <table className="text-[11.5px] border-collapse min-w-full">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate pr-3 py-1.5">Cohort</th>
                <th className="text-right font-semibold text-slate pr-3 py-1.5">Customers</th>
                {Array.from({ length: width }, (_, i) => <th key={i} className="font-semibold text-slate px-1.5 py-1.5 text-center">M{i}</th>)}
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.month}>
                  <td className="pr-3 py-1 text-charcoal whitespace-nowrap">{c.month}</td>
                  <td className="pr-3 py-1 text-right tabular-nums">{num(c.customers)}</td>
                  {Array.from({ length: width }, (_, i) => {
                    const v = c.retention[i];
                    return (
                      <td key={i} className="px-0.5 py-0.5">
                        {v == null || c.customers === 0 ? <span className="block min-w-[38px]" /> : (
                          <span className="block min-w-[38px] text-center rounded py-1 tabular-nums" style={{ background: shade(v), color: v > 45 ? '#fff' : '#3D3B36' }}>{v}%</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function InventoryAbc({ storeId }: { storeId: string }) {
  const q = useAnalyticsQuery(apiSellerReportInventoryAbc, { storeId });
  const paged = usePaged(q.data?.rows ?? []);
  if (q.error) return <AnalyticsErrorState message={q.error} onRetry={q.refetch} />;
  const money = (v: number) => formatMoneyCompact(v, q.data?.currency);
  const GRADE: Record<string, string> = { A: '#1E7A3C', B: '#9A6A17', C: '#5A5852' };
  const columns: TableColumn<InventoryAbcRow>[] = [
    { key: 'grade', header: 'Grade', render: r => <span className="inline-flex w-6 h-6 items-center justify-center rounded-md text-[11px] font-bold text-white" style={{ background: GRADE[r.grade] }}>{r.grade}</span> },
    { key: 'name', header: 'Product', render: r => <div className="min-w-0"><p className="truncate font-medium text-charcoal">{r.name}</p>{(r.variantTitle || r.sku) && <p className="text-[11px] text-slate truncate">{[r.variantTitle, r.sku].filter(Boolean).join(' · ')}</p>}</div> },
    { key: 'revenue90', header: 'Net sales (90 days)', align: 'right', render: r => money(r.revenue90) },
    { key: 'unitsSold90', header: 'Units sold', align: 'right', render: r => num(r.unitsSold90) },
    { key: 'available', header: 'Available', align: 'right', render: r => (r.available == null ? 'Unlimited' : num(r.available)) },
    { key: 'daysOfInventory', header: 'Days of inventory', align: 'right', render: r => (r.daysOfInventory == null ? '—' : num(Math.round(r.daysOfInventory))) },
  ];
  return (
    <div className="flex flex-col gap-4">
      {q.data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['A', 'B', 'C'] as const).map(g => (
            <MetricCard key={g} label={`Grade ${g}`} value={`${num(q.data!.summary[g].variants)} variants`} sub={`${q.data!.summary[g].revenueShare}% of net sales · ${money(q.data!.summary[g].revenue)}`} color={GRADE[g]} />
          ))}
        </div>
      )}
      <Card title="ABC analysis by product variant" subtitle="A = variants making the first 80% of the last 90 days' net sales, B = the next 15%, C = the rest. Days of inventory use the last 30 days' sales pace.">
        <div className="overflow-x-auto"><Table columns={columns} data={paged.rows} pagination={paged.pagination} loading={q.loading} keyExtractor={r => r.variantId} emptyState={{ icon: <FileBarChart2 size={28} className="text-slate/50" />, title: 'No products yet' }} /></div>
      </Card>
    </div>
  );
}

export function SellerReportsTab({ params, storeId, compare, onExportCsv, exporting }: {
  params: SellerAnalyticsParams; storeId: string | null; compare: boolean;
  onExportCsv: (section: SellerExportSection) => void; exporting: boolean;
}) {
  const [active, setActive] = useState<ReportId>('finance');
  if (!storeId) return <p className="text-[13px] text-slate">Reports are per store — open a store to see them.</p>;
  const current = REPORTS.find(r => r.id === active)!;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Reports">
          {REPORTS.map(r => (
            <button
              key={r.id} type="button" role="tab" aria-selected={active === r.id} onClick={() => setActive(r.id)}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium cursor-pointer ${active === r.id ? 'border-brand-orange bg-brand-pale-orange text-charcoal' : 'border-bone bg-white text-slate hover:text-charcoal'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" icon={<Download size={13} />} loading={exporting} onClick={() => onExportCsv(current.csv)}>Export CSV</Button>
      </div>

      {active === 'finance' && <FinanceSummary params={params} compare={compare} />}
      {active === 'variants' && <SalesByVariant params={params} />}
      {active === 'discounts' && <SalesByDiscount params={params} />}
      {active === 'channels' && <SalesByChannel params={params} />}
      {active === 'cohorts' && <CustomerCohorts storeId={storeId} />}
      {active === 'abc' && <InventoryAbc storeId={storeId} />}
    </div>
  );
}
