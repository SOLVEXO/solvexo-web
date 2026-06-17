import { CheckCircle, Mail, Printer, ArrowRight } from 'lucide-react';
import type { CartItem, PaymentMethod } from '../../pos.types';

interface ReceiptOverlayProps {
  cart:          CartItem[];
  total:         number;
  cashChange:    number;
  paymentMethod: PaymentMethod;
  resetSale:     () => void;
}

export function ReceiptOverlay({ cart, total, cashChange, paymentMethod, resetSale }: ReceiptOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20">
      <div className="bg-pos-surface border border-carbon rounded-2xl p-6 w-[320px]">

        {/* Header */}
        <div className="text-center mb-5">
          <CheckCircle size={48} className="text-success mx-auto mb-2" />
          <p className="text-[18px] font-bold text-white">Payment Complete</p>
          <p className="text-[28px] font-bold text-brand-orange my-2">${total.toFixed(2)}</p>
          <p className="text-[12px] text-pos-faint">
            {new Date().toLocaleTimeString()} · {paymentMethod}
          </p>
        </div>

        {/* Cash change */}
        {paymentMethod === 'cash' && cashChange > 0 && (
          <div className="bg-[#2D8A4E20] border border-success rounded-[10px] p-3 mb-4 text-center">
            <p className="text-[12px] text-pos-faint mb-1">Change due</p>
            <p className="text-[22px] font-bold text-success">${cashChange.toFixed(2)}</p>
          </div>
        )}

        {/* Line items */}
        <div className="mb-4">
          {cart.map(item => (
            <div key={item.name} className="flex justify-between py-1 border-b border-carbon">
              <span className="text-[11px] text-[#8C8A82]">{item.qty}× {item.name}</span>
              <span className="text-[11px] text-white">
                ${((item.customPrice ?? item.price) * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-[6px]">
            <span className="text-[12px] text-pos-faint">Total paid</span>
            <span className="text-[12px] font-semibold text-white">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {([
            [Mail,    'Email Receipt'],
            [Printer, 'Print Receipt'],
          ] as const).map(([Icon, label]) => (
            <button
              key={label}
              className="bg-carbon border-0 rounded-lg py-[10px] text-[12px] text-white cursor-pointer flex items-center justify-center gap-[6px]"
            >
              <Icon size={13} />{label}
            </button>
          ))}
          <button
            onClick={resetSale}
            className="bg-brand-orange border-0 rounded-lg py-3 text-[13px] font-bold text-white cursor-pointer flex items-center justify-center gap-[6px]"
          >
            New Sale <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
