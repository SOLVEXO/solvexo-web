import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Badge, Card, EmptyState, SkeletonBox } from '@/components/comman/ui';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiListPreorders, type PreorderRow } from '@/api/services/merchandising';

/** Inventory → Pre-orders: variants with pre-order switched on, units sold under it and units currently reserved. */
export default function PreordersTab() {
  const { storeId } = useStoreWorkspace();
  const [rows, setRows] = useState<PreorderRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiListPreorders(storeId)
      .then((r) => { if (!cancelled) setRows(r.data); })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Could not load pre-orders'); setRows([]); } });
    return () => { cancelled = true; };
  }, [storeId]);

  if (rows === null) return <div aria-busy="true"><SkeletonBox height="120px" rounded="12px" /></div>;
  if (error) return <p className="text-[12.5px] text-error" role="alert">{error}</p>;
  if (rows.length === 0) {
    return <EmptyState icon={<Clock size={28} className="text-slate/50" />} title="No pre-orders set up" description="Turn on pre-order for a variant from its product page to let buyers order it while it is out of stock." />;
  }
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-mist text-slate text-left">
            <tr>
              <th className="px-4 py-2.5">Product</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Expected</th>
              <th className="px-4 py-2.5 text-right">Sold</th><th className="px-4 py-2.5 text-right">Limit</th>
              <th className="px-4 py-2.5 text-right">On hand</th><th className="px-4 py-2.5 text-right">Reserved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variantId} className="border-t border-bone">
                <td className="px-4 py-2.5"><span className="font-semibold text-charcoal">{r.productName}</span><span className="block text-slate">{r.sku}</span></td>
                <td className="px-4 py-2.5"><Badge color={r.preorder.enabled ? 'orange' : 'gray'}>{r.preorder.enabled ? 'Active' : 'Off'}</Badge></td>
                <td className="px-4 py-2.5">{r.preorder.expectedDate ? new Date(r.preorder.expectedDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-2.5 text-right">{r.preorder.sold ?? 0}</td>
                <td className="px-4 py-2.5 text-right">{r.preorder.limit ?? '∞'}</td>
                <td className="px-4 py-2.5 text-right">{r.onHand}</td>
                <td className="px-4 py-2.5 text-right">{r.reserved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
