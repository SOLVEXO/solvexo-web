import { useState } from 'react';
import { apiRefundSale, type Sale } from '@/api/services/pos/posSales';

interface RefundOverlayProps {
  sale: Sale;
  actingEmployeeId?: string;
  onClose: () => void;
  onDone:  () => void;
}

export function RefundOverlay({ sale, actingEmployeeId, onClose, onDone }: RefundOverlayProps) {
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const refundableItems = (sale.items ?? []).filter(i => i.qty - i.refundedQty > 0);
  const hasPartialSelection = Object.values(qtyByItem).some(q => q > 0);

  function setQty(itemId: string, max: number, value: string) {
    const n = Math.max(0, Math.min(max, parseInt(value) || 0));
    setQtyByItem(prev => ({ ...prev, [itemId]: n }));
  }

  async function submitFullRefund() {
    setSaving(true);
    setError('');
    try {
      await apiRefundSale(sale._id, { actingEmployeeId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund sale.');
    } finally {
      setSaving(false);
    }
  }

  async function submitPartialRefund() {
    const items = Object.entries(qtyByItem)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, qty]) => ({ saleItemId, qty }));
    if (items.length === 0) return;

    setSaving(true);
    setError('');
    try {
      await apiRefundSale(sale._id, { items, actingEmployeeId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund selected items.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[400px] bg-pos-surface border border-carbon rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
        <p className="text-[14px] font-bold text-white mb-1">Refund {sale.saleNumber}</p>
        <p className="text-[12px] text-pos-muted mb-4">
          Select item quantities to refund, or refund the full sale.
        </p>

        <div className="mb-4">
          {refundableItems.map(item => {
            const available = item.qty - item.refundedQty;
            return (
              <div key={item._id} className="flex items-center justify-between py-2 border-b border-carbon">
                <div className="flex-1">
                  <p className="text-[12px] text-white">{item.name}</p>
                  <p className="text-[10px] text-pos-muted">{available} available · ${item.price.toFixed(2)} each</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={available}
                  value={qtyByItem[item._id] ?? 0}
                  onChange={e => setQty(item._id, available, e.target.value)}
                  className="w-[52px] text-center bg-carbon border border-carbon rounded-md px-1 py-1 text-[12px] text-white outline-none"
                />
              </div>
            );
          })}
        </div>

        {error && <p className="text-[11px] text-error mb-3">{error}</p>}

        <div className="flex flex-col gap-2">
          <button
            onClick={submitPartialRefund}
            disabled={saving || !hasPartialSelection}
            className="w-full py-[9px] min-h-11 lg:min-h-0 bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-40"
          >
            {saving ? 'Processing…' : 'Refund Selected Items'}
          </button>
          <button
            onClick={submitFullRefund}
            disabled={saving}
            className="w-full py-[9px] min-h-11 lg:min-h-0 bg-error border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            Refund Full Sale
          </button>
          <button
            onClick={onClose}
            className="w-full py-[9px] min-h-11 lg:min-h-0 bg-carbon border-0 rounded-lg text-[12px] text-pos-faint cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
