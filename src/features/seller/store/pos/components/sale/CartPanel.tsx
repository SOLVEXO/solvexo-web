import { clsx } from 'clsx';
import {
  ShoppingCart, User, Tag, Pause, ImageOff,
  CreditCard, Banknote, Wallet, CloudOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CustomerPanel } from './CustomerPanel';
import { DiscountPanel } from './DiscountPanel';
import { ReceiptOverlay } from './ReceiptOverlay';
import type { POSSaleState, PosPaymentMethod } from '../../pos.types';

const PAYMENT_METHODS: [PosPaymentMethod, LucideIcon, string][] = [
  ['card',  CreditCard, 'Card'  ],
  ['cash',  Banknote,   'Cash'  ],
  ['other', Wallet,     'Other' ],
];

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
    <div className="w-full lg:w-[300px] shrink-0 flex flex-col relative bg-pos-surface lg:min-h-0">

      {/* Cart header */}
      <div className="flex items-center justify-between px-[18px] py-3 border-b border-carbon shrink-0">
        <div>
          <p className="text-[14px] font-semibold text-white">
            {isResuming ? 'Resuming Held Sale' : 'Current Sale'}
          </p>
          {cart.length > 0 && (
            <p className="text-[11px] text-slate mt-[1px]">
              {cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)} subtotal
            </p>
          )}
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => setPosView(posView === 'customer' ? 'charge' : 'customer')}
            className={clsx(
              'px-[10px] py-[5px] border-0 rounded-lg text-[11px] cursor-pointer flex items-center gap-1',
              posView === 'customer' ? 'bg-brand-deep-orange' : 'bg-charcoal',
              customerName !== 'Walk-in' ? 'text-brand-orange' : 'text-pos-faint',
            )}
          >
            <User size={11} />
            {customerName !== 'Walk-in' ? customerName.split(' ')[0] : 'Customer'}
          </button>
          <button
            onClick={() => setPosView(posView === 'discount' ? 'charge' : 'discount')}
            className={clsx(
              'px-[10px] py-[5px] border-0 rounded-lg text-[11px] cursor-pointer flex items-center gap-1',
              posView === 'discount' ? 'bg-brand-deep-orange' : 'bg-charcoal',
              appliedDiscount ? 'text-brand-orange' : 'text-pos-faint',
            )}
          >
            <Tag size={11} />
            {appliedDiscount ? appliedDiscount.label : 'Discount'}
          </button>
        </div>
      </div>

      {pendingSyncCount > 0 && (
        <button
          onClick={() => syncNow()}
          className="flex items-center gap-2 px-[18px] py-2 bg-[#3A2A1A] border-b border-carbon text-left cursor-pointer border-x-0 border-t-0 w-full"
          title="Retry syncing now"
        >
          <CloudOff size={13} className="text-brand-orange shrink-0" />
          <span className="text-[11px] text-brand-orange flex-1">
            {pendingSyncCount} sale{pendingSyncCount !== 1 ? 's' : ''} waiting to sync
          </span>
          <span className="text-[10px] text-pos-faint underline">Retry now</span>
        </button>
      )}

      {/* Slide-in panels */}
      {posView === 'customer' && <CustomerPanel sale={sale} />}
      {posView === 'discount' && (
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
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-[18px] py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-10">
            <ShoppingCart size={48} className="mb-3 text-charcoal" />
            <p className="text-[13px] text-[#3A3836] text-center leading-[1.5]">
              Tap a product to add it<br />to the cart
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.variantId} className="py-[10px] border-b border-carbon">
              <div className="flex items-start gap-[10px]">
                <div className="w-[26px] h-[26px] mt-[1px] shrink-0 rounded-md overflow-hidden bg-carbon flex items-center justify-center">
                  {item.image ? (
                    <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={13} className="text-pos-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white">{item.name}</p>
                  <p className="text-[10px] text-pos-muted">{item.sku}</p>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-[16px] bg-transparent border-0 cursor-pointer leading-none -mt-[2px] text-[#3A3836]"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 pl-9">
                {/* Qty controls */}
                <div className="flex items-center gap-[6px]">
                  <button
                    onClick={() => updateQty(item.variantId, -1)}
                    className="w-[22px] h-[22px] rounded-[6px] bg-carbon border-0 text-white cursor-pointer flex items-center justify-center text-[14px]"
                  >
                    −
                  </button>
                  <span className="text-[13px] font-semibold text-white w-5 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, 1)}
                    className="w-[22px] h-[22px] rounded-[6px] bg-carbon border-0 text-white cursor-pointer flex items-center justify-center text-[14px]"
                  >
                    +
                  </button>
                </div>

                {/* Custom price input */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-pos-muted">$</span>
                  <input
                    value={item.customPrice ?? item.price}
                    onChange={e => setCustomPrice(item.variantId, e.target.value)}
                    className={clsx(
                      'w-[52px] text-right rounded-[6px] px-[6px] py-[2px] text-[12px] outline-none bg-charcoal border',
                      item.customPrice
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-charcoal text-white',
                    )}
                  />
                </div>

                <span className="text-[13px] font-bold text-brand-orange">
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
            className="w-full mt-[10px] bg-[#141312] border border-carbon rounded-lg px-[10px] py-[6px] text-[11px] outline-none box-border text-pos-faint"
          />
        )}
      </div>

      {/* Cart footer */}
      <div className="px-[18px] py-[14px] border-t border-carbon bg-[#141312] shrink-0">
        {cart.length > 0 && (
          <>
            {/* Totals */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[12px] text-pos-faint">Subtotal</span>
                <span className="text-[12px] text-white">${subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-success flex items-center gap-1">
                    <Tag size={10} />{appliedDiscount.label}
                  </span>
                  <span className="text-[12px] text-success">−${discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-[12px] text-pos-faint">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="text-[12px] text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-carbon">
                <span className="text-[16px] font-bold text-white">Total</span>
                <span className="text-[20px] font-bold text-brand-orange">${total.toFixed(2)}</span>
              </div>
              {customerName !== 'Walk-in' && (
                <div className="mt-[6px] bg-pos-surface rounded-lg px-[10px] py-[6px] flex justify-between">
                  <span className="text-[11px] text-pos-faint flex items-center gap-1">
                    <User size={10} />{customerName}
                  </span>
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[6px] mb-[10px]">
              {PAYMENT_METHODS.map(([id, IconComp, label]) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={clsx(
                    'px-1 py-2 rounded-lg cursor-pointer flex flex-col items-center gap-[3px] border',
                    paymentMethod === id
                      ? 'bg-brand-deep-orange border-brand-orange'
                      : 'bg-charcoal border-transparent',
                  )}
                >
                  <IconComp
                    size={14}
                    className={paymentMethod === id ? 'text-white' : 'text-pos-faint'}
                  />
                  <span className={clsx(
                    'text-[10px] font-medium',
                    paymentMethod === id ? 'text-white' : 'text-pos-faint',
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Cash tendered */}
            {paymentMethod === 'cash' && (
              <div className="bg-pos-surface rounded-lg p-3 mb-[10px]">
                <p className="text-[11px] text-pos-faint mb-[6px]">Cash tendered</p>
                <div className="flex gap-[6px] mb-[6px]">
                  <input
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-carbon border-0 rounded-lg px-[10px] py-[6px] text-[13px] text-white outline-none"
                  />
                  {[20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashGiven(amt.toString())}
                      className="px-[10px] py-[6px] bg-carbon border-0 rounded-lg text-[11px] text-white cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                {cashGiven && parseFloat(cashGiven) >= total && (
                  <div className="flex justify-between">
                    <span className="text-[12px] text-pos-faint">Change due</span>
                    <span className="text-[14px] font-bold text-success">${cashChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {chargeError && (
              <p className="text-[11px] text-error bg-[#C1303020] border border-error rounded-lg px-3 py-2 mb-[10px]">
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
            'w-full rounded-[10px] py-[13px] text-center text-[15px] font-bold text-white border-0',
            'flex items-center justify-center gap-[6px]',
            cart.length === 0 || charging
              ? 'bg-charcoal opacity-40 cursor-default'
              : 'bg-brand-orange cursor-pointer',
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
          <div className="flex gap-2 mt-2">
            <button
              onClick={resetSale}
              className="flex-1 py-[7px] bg-pos-surface border border-carbon rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="text-[11px] text-pos-muted">× Clear</span>
            </button>
            {!isResuming && (
              <button
                onClick={() => !charging && charge('held')}
                disabled={charging}
                className="flex-1 py-[7px] bg-pos-surface border border-carbon rounded-lg cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Pause size={11} className="text-pos-muted" />
                <span className="text-[11px] text-pos-muted">Hold</span>
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
