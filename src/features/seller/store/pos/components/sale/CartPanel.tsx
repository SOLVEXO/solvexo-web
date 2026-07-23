import { clsx } from 'clsx';
import {
  ShoppingCart, User, Tag, Pause, ImageOff, Minus, Plus,
  CreditCard, Banknote, Wallet, CloudOff, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CustomerPanel } from './CustomerPanel';
import { DiscountPanel } from './DiscountPanel';
import { ReceiptOverlay } from './ReceiptOverlay';
import type { POSSaleState, PosPaymentMethod } from '../../pos.types';

// Each payment method carries its own semantic accent — Card reads as "digital/
// info", Cash as "success/tender", Other as neutral — instead of every state in
// the terminal defaulting to the same brand-orange highlight.
const PAYMENT_METHODS: [PosPaymentMethod, LucideIcon, string, string][] = [
  ['card',  CreditCard, 'Card',  'info'    ],
  ['cash',  Banknote,   'Cash',  'success' ],
  ['other', Wallet,     'Other', 'neutral' ],
];

const PAYMENT_ACTIVE_CLASSES: Record<string, string> = {
  info:    'bg-info/15 border-info text-info',
  success: 'bg-success/15 border-success text-success',
  neutral: 'bg-white/10 border-white/25 text-white',
};

interface CartPanelProps {
  sale: POSSaleState;
}

export function CartPanel({ sale }: CartPanelProps) {
  const {
    cart, removeItem, updateQty, setCustomPrice,
    subtotal, discountAmt, taxRate, tax, total, cashChange,
    appliedDiscount, customerName,
    paymentMethod, setPaymentMethod,
    posView, setPosView,
    cashGiven, setCashGiven,
    note, setNote,
    resetSale, charge, charging, chargeError, lastSale,
    resumingSaleId,
    discountVal,
    pendingSyncCount, syncNow,
  } = sale;

  const isResuming = !!resumingSaleId;

  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col relative bg-pos-surface-2 lg:min-h-0">

      {/* Cart header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-pos-border shrink-0">
        <div>
          <p className="text-[15px] font-bold text-white">
            {isResuming ? 'Resuming Held Sale' : 'Current Sale'}
          </p>
          {cart.length > 0 && (
            <p className="text-[12px] text-pos-muted mt-[2px]">
              {cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)} subtotal
            </p>
          )}
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => setPosView(posView === 'customer' ? 'charge' : 'customer')}
            className={clsx(
              'h-11 px-[14px] border rounded-xl text-[12px] font-semibold cursor-pointer flex items-center gap-[6px]',
              'transition-all duration-150 active:scale-95',
              posView === 'customer' || customerName !== 'Walk-in'
                ? 'bg-info/15 border-info/40 text-info'
                : 'bg-pos-surface border-pos-border text-pos-faint hover:border-pos-border-strong',
            )}
          >
            <User size={14} />
            {customerName !== 'Walk-in' ? customerName.split(' ')[0] : 'Customer'}
          </button>
          <button
            onClick={() => setPosView(posView === 'discount' ? 'charge' : 'discount')}
            className={clsx(
              'h-11 px-[14px] border rounded-xl text-[12px] font-semibold cursor-pointer flex items-center gap-[6px]',
              'transition-all duration-150 active:scale-95',
              posView === 'discount' || appliedDiscount
                ? 'bg-warning/15 border-warning/40 text-warning'
                : 'bg-pos-surface border-pos-border text-pos-faint hover:border-pos-border-strong',
            )}
          >
            <Tag size={14} />
            {appliedDiscount ? appliedDiscount.label : 'Discount'}
          </button>
        </div>
      </div>

      {pendingSyncCount > 0 && (
        <button
          onClick={() => syncNow()}
          className="flex items-center gap-[10px] min-h-11 px-5 py-[10px] bg-warning/10 border-b border-pos-border text-left cursor-pointer border-x-0 border-t-0 w-full transition-opacity duration-150 active:opacity-80"
          title="Retry syncing now"
        >
          <CloudOff size={15} className="text-warning shrink-0" />
          <span className="text-[12px] font-medium text-warning flex-1">
            {pendingSyncCount} sale{pendingSyncCount !== 1 ? 's' : ''} waiting to sync
          </span>
          <span className="text-[11px] text-warning/80 underline">Retry now</span>
        </button>
      )}

      {/* Slide-in panels */}
      {posView === 'customer' && (
        <div className="pos-panel-enter">
          <CustomerPanel sale={sale} />
        </div>
      )}
      {posView === 'discount' && (
        <div className="pos-panel-enter">
          <DiscountPanel
            discountType={sale.discountType}
            setDiscountType={sale.setDiscountType}
            discountVal={discountVal}
            setDiscountVal={sale.setDiscountVal}
            appliedDiscount={appliedDiscount}
            applyDiscount={sale.applyDiscount}
            removeDiscount={sale.removeDiscount}
            setPosView={setPosView}
          />
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-10">
            <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-pos-surface-3 to-pos-surface border border-pos-border flex items-center justify-center mb-5 shrink-0">
              <ShoppingCart size={28} className="text-pos-border-strong" />
            </div>
            <p className="text-[13.5px] text-pos-muted text-center leading-[1.6]">
              Tap a product to add it<br />to the cart
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.variantId} className="py-[14px] border-b border-pos-border pos-item-enter">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-pos-surface-3 flex items-center justify-center">
                  {item.image ? (
                    <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={16} className="text-pos-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-[2px]">
                  <p className="text-[13px] font-medium text-white truncate">{item.name}</p>
                  <p className="text-[10.5px] text-pos-muted">{item.sku}</p>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  aria-label="Remove item"
                  className="w-9 h-9 -mr-[6px] -mt-[6px] shrink-0 flex items-center justify-center bg-transparent border-0 cursor-pointer text-pos-faint hover:text-error rounded-lg transition-colors duration-150"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3 pl-[52px] gap-2">
                {/* Floating qty stepper */}
                <div className="flex items-center gap-[2px] bg-pos-surface rounded-full border border-pos-border p-[3px] shrink-0">
                  <button
                    onClick={() => updateQty(item.variantId, -1)}
                    className="w-8 h-8 rounded-full bg-pos-surface-3 border-0 text-white cursor-pointer flex items-center justify-center transition-transform duration-100 active:scale-90"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-[13px] font-bold text-white w-7 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, 1)}
                    className="w-8 h-8 rounded-full bg-pos-surface-3 border-0 text-white cursor-pointer flex items-center justify-center transition-transform duration-100 active:scale-90"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Custom price input */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] text-pos-muted">$</span>
                  <input
                    value={item.customPrice ?? item.price}
                    onChange={e => setCustomPrice(item.variantId, e.target.value)}
                    className={clsx(
                      'w-[56px] h-8 text-right rounded-lg px-[8px] text-[12px] outline-none bg-pos-surface border transition-colors duration-150',
                      item.customPrice
                        ? 'border-brand-orange/50 text-brand-orange'
                        : 'border-pos-border text-white focus:border-pos-border-strong',
                    )}
                  />
                </div>

                <span className="text-[14px] font-bold text-brand-orange ml-auto">
                  ${((item.customPrice ?? item.price) * item.qty).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}

        {cart.length > 0 && (
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add order note..."
            className="w-full h-11 mt-3 mb-2 bg-pos-surface border border-pos-border rounded-xl px-[14px] text-[12px] outline-none box-border text-pos-faint transition-colors duration-150 focus:border-pos-border-strong"
          />
        )}
      </div>

      {/* Cart footer — elevated "floating summary" surface, sticky at the bottom */}
      <div className="px-5 pt-5 pb-5 border-t border-pos-border bg-pos-surface-3 shrink-0 rounded-t-2xl">
        {cart.length > 0 && (
          <>
            {/* Totals */}
            <div className="mb-4">
              <div className="flex justify-between mb-[6px]">
                <span className="text-[12.5px] text-pos-faint">Subtotal</span>
                <span className="text-[12.5px] text-white">${subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between mb-[6px]">
                  <span className="text-[12.5px] text-success flex items-center gap-1">
                    <Tag size={11} />{appliedDiscount.label}
                  </span>
                  <span className="text-[12.5px] text-success">−${discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-3">
                <span className="text-[12.5px] text-pos-faint">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="text-[12.5px] text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-pos-border">
                <span className="text-[15px] font-bold text-white">Total</span>
                <span className="text-[24px] font-bold text-brand-orange">${total.toFixed(2)}</span>
              </div>
              {customerName !== 'Walk-in' && (
                <div className="mt-[10px] bg-info/10 border border-info/20 rounded-xl px-[12px] py-[8px] flex justify-between">
                  <span className="text-[11.5px] text-info flex items-center gap-[6px] font-medium">
                    <User size={11} />{customerName}
                  </span>
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-3 gap-[8px] mb-3">
              {PAYMENT_METHODS.map(([id, IconComp, label, tone]) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={clsx(
                    'h-[64px] rounded-xl cursor-pointer flex flex-col items-center justify-center gap-[5px] border-2',
                    'transition-all duration-150 active:scale-[0.96]',
                    paymentMethod === id
                      ? PAYMENT_ACTIVE_CLASSES[tone]
                      : 'bg-pos-surface border-pos-border text-pos-faint hover:border-pos-border-strong',
                  )}
                >
                  <IconComp size={19} />
                  <span className="text-[11px] font-semibold">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Cash tendered */}
            {paymentMethod === 'cash' && (
              <div className="bg-pos-surface rounded-xl border border-pos-border p-[14px] mb-3">
                <p className="text-[11.5px] text-pos-faint mb-[8px] font-medium">Cash tendered</p>
                <div className="flex gap-[8px] mb-[8px]">
                  <input
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-11 min-w-0 bg-pos-surface-2 border border-pos-border rounded-xl px-[12px] text-[14px] text-white outline-none transition-colors duration-150 focus:border-pos-border-strong"
                  />
                  {[20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashGiven(amt.toString())}
                      className="w-12 h-11 shrink-0 bg-pos-surface-2 border border-pos-border rounded-xl text-[12px] font-semibold text-white cursor-pointer transition-all duration-150 hover:border-pos-border-strong active:scale-95"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                {cashGiven && parseFloat(cashGiven) >= total && (
                  <div className="flex justify-between items-center bg-success/10 rounded-lg px-3 py-[8px]">
                    <span className="text-[12px] text-success font-medium">Change due</span>
                    <span className="text-[15px] font-bold text-success">${cashChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {chargeError && (
              <p className="text-[12px] text-error bg-error/10 border border-error/30 rounded-xl px-[14px] py-[10px] mb-3">
                {chargeError}
              </p>
            )}
          </>
        )}

        {/* Charge button */}
        <button
          onClick={() => cart.length > 0 && !charging && charge('completed')}
          disabled={cart.length === 0 || charging}
          className={clsx(
            'w-full rounded-2xl h-[60px] text-center text-[16px] font-bold text-white border-0',
            'flex items-center justify-center gap-[8px] transition-all duration-150',
            cart.length === 0 || charging
              ? 'bg-pos-surface-2 opacity-40 cursor-default'
              : 'bg-gradient-to-b from-brand-orange to-brand-deep-orange cursor-pointer hover:brightness-110 active:scale-[0.98]',
          )}
        >
          {charging
            ? 'Processing…'
            : cart.length === 0
              ? 'Charge $0.00'
              : isResuming ? `Complete Sale $${total.toFixed(2)}` : `Charge $${total.toFixed(2)}`}
        </button>

        {/* Clear / Hold */}
        {cart.length > 0 && (
          <div className="flex gap-2 mt-[10px]">
            <button
              onClick={resetSale}
              className="flex-1 h-11 bg-pos-surface border border-pos-border rounded-xl cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-150 hover:border-pos-border-strong active:scale-95"
            >
              <X size={13} className="text-pos-muted" />
              <span className="text-[12px] font-medium text-pos-muted">Clear</span>
            </button>
            {!isResuming && (
              <button
                onClick={() => !charging && charge('held')}
                disabled={charging}
                className="flex-1 h-11 bg-pos-surface border border-pos-border rounded-xl cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-150 hover:border-pos-border-strong active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <Pause size={13} className="text-pos-muted" />
                <span className="text-[12px] font-medium text-pos-muted">Hold</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Receipt overlay */}
      {posView === 'receipt' && lastSale && (
        <ReceiptOverlay sale={lastSale} resetSale={resetSale} />
      )}
    </div>
  );
}
