import { CheckCircle, Printer, ArrowRight } from 'lucide-react';
import type { Sale } from '@/api/services/pos/posSales';

interface ReceiptOverlayProps {
  sale:      Sale;
  resetSale: () => void;
}

export function ReceiptOverlay({ sale, resetSale }: ReceiptOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20 px-4 pos-overlay-enter">
      <div className="bg-pos-surface border border-carbon rounded-2xl shadow-xl p-7 w-full max-w-[320px] pos-panel-enter">

        {/* Header */}
        <div className="text-center mb-6">
          <CheckCircle size={48} className="text-success mx-auto mb-3" />
          <p className="text-[18px] font-bold text-white">Payment Complete</p>
          <p className="text-[12px] text-pos-muted mt-1">{sale.saleNumber}</p>
          <p className="text-[30px] font-bold text-brand-orange my-2">${sale.total.toFixed(2)}</p>
          <p className="text-[12px] text-pos-faint">
            {new Date(sale.createdAt).toLocaleTimeString()} · {sale.paymentMethod}
          </p>
        </div>

        {/* Line items */}
        <div className="mb-5">
          {sale.items.map(item => (
            <div key={item._id} className="flex justify-between py-[6px] border-b border-carbon">
              <span className="text-[11px] text-slate">{item.qty}× {item.name}</span>
              <span className="text-[11px] text-white">${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          {sale.discount > 0 && (
            <div className="flex justify-between pt-[6px]">
              <span className="text-[11px] text-success">Discount</span>
              <span className="text-[11px] text-success">−${sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-[6px]">
            <span className="text-[11px] text-pos-faint">Tax</span>
            <span className="text-[11px] text-white">${sale.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 mt-1 border-t border-carbon">
            <span className="text-[12px] text-pos-faint">Total paid</span>
            <span className="text-[12px] font-semibold text-white">${sale.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.print()}
            className="bg-carbon border-0 rounded-lg py-[11px] text-[12px] text-white cursor-pointer flex items-center justify-center gap-[6px] transition-transform duration-100 active:scale-[0.98]"
          >
            <Printer size={13} />Print Receipt
          </button>
          <button
            onClick={resetSale}
            className="bg-brand-orange border-0 rounded-lg py-[13px] text-[13px] font-bold text-white cursor-pointer flex items-center justify-center gap-[6px] shadow-md transition-transform duration-100 active:scale-[0.98]"
          >
            New Sale <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
