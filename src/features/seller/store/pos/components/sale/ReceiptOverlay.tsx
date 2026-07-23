import { CheckCircle2, Printer, ArrowRight } from 'lucide-react';
import type { Sale } from '@/api/services/pos/posSales';

interface ReceiptOverlayProps {
  sale:      Sale;
  resetSale: () => void;
}

export function ReceiptOverlay({ sale, resetSale }: ReceiptOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-20 px-4 pos-overlay-enter">
      <div className="bg-pos-surface-3 border border-pos-border-strong rounded-[24px] p-7 w-full max-w-[340px] max-h-[90%] overflow-y-auto pos-panel-enter">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-success/15 pos-live-pulse" />
            <div className="absolute inset-[3px] rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={34} className="text-success" />
            </div>
          </div>
          <p className="text-[19px] font-bold text-white">Payment Complete</p>
          <p className="text-[12px] text-pos-muted mt-[3px]">{sale.saleNumber}</p>
          <p className="text-[34px] font-bold text-brand-orange my-2 leading-none">${sale.total.toFixed(2)}</p>
          <p className="text-[12px] text-pos-faint">
            {new Date(sale.createdAt).toLocaleTimeString()} · <span className="capitalize">{sale.paymentMethod}</span>
          </p>
        </div>

        {/* Line items — styled like a physical receipt slip */}
        <div className="mb-6 rounded-2xl bg-pos-surface border border-pos-border border-dashed p-4">
          {sale.items.map(item => (
            <div key={item._id} className="flex justify-between py-[7px] border-b border-pos-border last:border-b-0">
              <span className="text-[12px] text-slate">{item.qty}× {item.name}</span>
              <span className="text-[12px] text-white font-medium">${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          {sale.discount > 0 && (
            <div className="flex justify-between pt-[8px]">
              <span className="text-[12px] text-success">Discount</span>
              <span className="text-[12px] text-success">−${sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-[6px]">
            <span className="text-[12px] text-pos-faint">Tax</span>
            <span className="text-[12px] text-white">${sale.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-pos-border">
            <span className="text-[13px] font-semibold text-pos-faint">Total paid</span>
            <span className="text-[16px] font-bold text-white">${sale.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[10px]">
          <button
            onClick={() => window.print()}
            className="h-12 bg-pos-surface border border-pos-border rounded-xl text-[13px] font-medium text-white cursor-pointer flex items-center justify-center gap-[8px] transition-all duration-150 hover:border-pos-border-strong active:scale-[0.98]"
          >
            <Printer size={15} />Print Receipt
          </button>
          <button
            onClick={resetSale}
            className="h-[52px] bg-gradient-to-b from-brand-orange to-brand-deep-orange border-0 rounded-xl text-[14px] font-bold text-white cursor-pointer flex items-center justify-center gap-[8px] transition-transform duration-150 active:scale-[0.98]"
          >
            New Sale <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
