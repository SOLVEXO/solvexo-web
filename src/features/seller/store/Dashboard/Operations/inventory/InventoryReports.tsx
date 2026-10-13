import { useState, useEffect } from 'react';
import { TrendingUp, PackageX, DollarSign } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Card, MetricCard, SkeletonBox, EmptyState } from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { apiGetInventoryValuation, type InventoryValuationData } from '@/api/services/product';
import { apiGetMovementReport, type MovementReport } from '@/api/services/inventoryOps';
import { Button } from '@/components/comman/ui/Button';

// Real inventory reporting — stock value, dead stock, top movers. Costed
// entirely off `ProductVariant.costPrice` (set via Purchase Order receiving
// or the Inventory page's own "Reorder point & cost" action) — a SKU that's
// never had a real cost recorded is honestly excluded from the value total,
// never assumed to be worth 0.
export default function InventoryReports({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId, store } = useStoreWorkspace();
  const [data, setData] = useState<InventoryValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const symbol = currencySymbol(store?.baseCurrency);
  const [days, setDays] = useState(30);
  const [movement, setMovement] = useState<MovementReport | null>(null);
  const [movementLoading, setMovementLoading] = useState(true);
  const [movementError, setMovementError] = useState('');

  useEffect(() => {
    apiGetInventoryValuation(storeId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [storeId]);

  const loadMovement = () => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    apiGetMovementReport(storeId, { from: from.toISOString(), to: to.toISOString() })
      .then(res => { setMovement(res.data); setMovementError(''); })
      .catch((err: unknown) => setMovementError(err instanceof Error ? err.message : 'Could not load the movement report.'))
      .finally(() => setMovementLoading(false));
  };
  useEffect(loadMovement, [storeId, days]);

  return (
    <>
      {!embedded && <StorePageHeader title="Inventory Reports" subtitle="Stock value, dead stock, and top movers." />}
      <div className={embedded ? 'px-4 lg:px-7 pt-4 pb-10 flex flex-col gap-5' : 'px-4 lg:px-7 pt-5 pb-10 flex flex-col gap-5'}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="Inventory Value" icon={<DollarSign size={16} />} loading={loading}
            value={data ? `${symbol}${data.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
            sub={data ? `${data.valuedSkuCount} of ${data.totalSkuCount} SKUs have a cost set${data.expiredUnits ? ` · ${symbol}${(data.expiredValue ?? 0).toLocaleString()} of expired stock not counted` : ''}` : undefined}
          />
          <MetricCard label="Dead Stock SKUs" icon={<PackageX size={16} />} loading={loading} value={data?.deadStock.length ?? 0} sub="0 sales in 90 days" />
          <MetricCard label="Top Movers Tracked" icon={<TrendingUp size={16} />} loading={loading} value={data?.topMovers.length ?? 0} sub="Last 30 days" />
        </div>

        <Card padding="none">
          <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec] flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[14px] font-bold text-charcoal">Stock movement</p>
              <p className="text-[11px] text-slate mt-0.5">What changed your stock and why, supplier returns, and money tied up in expired or soon-to-expire lots.</p>
            </div>
            <div className="flex gap-1.5">
              {[7, 30, 90].map(d => (
                <Button key={d} size="xs" variant={days === d ? 'primary' : 'secondary'} onClick={() => { setMovementLoading(true); setDays(d); }}>{d}d</Button>
              ))}
            </div>
          </div>
          {movementError ? (
            <div role="alert" className="p-5 flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-error">{movementError}</p>
              <Button size="sm" variant="secondary" onClick={() => { setMovementLoading(true); loadMovement(); }}>Retry</Button>
            </div>
          ) : movementLoading ? (
            <div className="p-5 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={28} rounded="6px" />)}</div>
          ) : movement && (
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard label="Expired stock" icon={<PackageX size={16} />} value={`${symbol}${movement.expired.value.toLocaleString()}`} sub={`${movement.expired.units} units · ${movement.expired.lots} lots`} />
                <MetricCard label="Expiring in 30 days" icon={<PackageX size={16} />} value={`${symbol}${movement.expiringIn30Days.value.toLocaleString()}`} sub={`${movement.expiringIn30Days.units} units · ${movement.expiringIn30Days.lots} lots`} />
                <MetricCard label="Supplier returns" icon={<DollarSign size={16} />} value={`${symbol}${movement.supplierReturns.totalCredit.toLocaleString()}`} sub={`${movement.supplierReturns.count} returns · ${symbol}${movement.supplierReturns.pendingCredit.toLocaleString()} credit pending`} />
              </div>
              {movement.adjustmentsByReason.length === 0 ? (
                <p className="text-[12.5px] text-slate">No stock adjustments in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead><tr className="text-left text-slate"><th className="py-1.5 pr-3 font-medium">Reason</th><th className="py-1.5 pr-3 font-medium text-right">Entries</th><th className="py-1.5 pr-3 font-medium text-right">Units in</th><th className="py-1.5 font-medium text-right">Units out</th></tr></thead>
                    <tbody>
                      {movement.adjustmentsByReason.map(r => (
                        <tr key={r.reason} className="border-t border-[#f3f2ec]">
                          <td className="py-1.5 pr-3 text-charcoal capitalize">{r.reason.replace(/_/g, ' ')}</td>
                          <td className="py-1.5 pr-3 text-right">{r.entries}</td>
                          <td className="py-1.5 pr-3 text-right">{r.unitsIn}</td>
                          <td className="py-1.5 text-right">{r.unitsOut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card padding="none">
            <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec]">
              <p className="text-[14px] font-bold text-charcoal">Top Movers (30 days)</p>
            </div>
            {loading ? (
              <div className="p-5 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={32} rounded="6px" />)}</div>
            ) : !data?.topMovers.length ? (
              <EmptyState icon={<TrendingUp size={26} className="text-brand-orange opacity-55" />} title="No sales in the last 30 days" description="" />
            ) : (
              <div className="divide-y divide-[#f3f2ec]">
                {data.topMovers.map(m => (
                  <div key={m.variantId} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-charcoal truncate">{m.productName}</p>
                      <p className="text-[11px] text-slate">SKU: {m.sku ?? '—'}</p>
                    </div>
                    <span className="text-[12.5px] font-bold text-charcoal shrink-0">{m.qty} sold</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec]">
              <p className="text-[14px] font-bold text-charcoal">Dead Stock</p>
              <p className="text-[11px] text-slate mt-0.5">On-hand stock with zero sales in the last 90 days.</p>
            </div>
            {loading ? (
              <div className="p-5 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={32} rounded="6px" />)}</div>
            ) : !data?.deadStock.length ? (
              <EmptyState icon={<PackageX size={26} className="text-brand-orange opacity-55" />} title="No dead stock" description="Every SKU with on-hand stock has sold in the last 90 days." />
            ) : (
              <div className="divide-y divide-[#f3f2ec] max-h-[400px] overflow-y-auto">
                {data.deadStock.map(d => (
                  <div key={d.variantId} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-charcoal truncate">{d.productName}</p>
                      <p className="text-[11px] text-slate">SKU: {d.sku ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12.5px] font-bold text-charcoal">{d.stock} units</p>
                      {d.value != null && <p className="text-[10.5px] text-slate">{symbol}{d.value.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
