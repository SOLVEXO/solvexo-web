import { clsx } from 'clsx';
import {
  ShoppingCart, User, Tag, Pause, Printer,
  CreditCard, Banknote, Smartphone, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CustomerPanel } from './CustomerPanel';
import { DiscountPanel } from './DiscountPanel';
import { ReceiptOverlay } from './ReceiptOverlay';
import type { POSSaleState, PaymentMethod } from '../../pos.types';

const PAYMENT_METHODS: [PaymentMethod, LucideIcon, string][] = [
  ['card',  CreditCard,  'Card' ],
  ['cash',  Banknote,    'Cash' ],
  ['tap',   Smartphone,  'Tap'  ],
  ['split', Zap,         'Split'],
];

interface CartPanelProps {
  sale: POSSaleState;
}

export function CartPanel({ sale }: CartPanelProps) {
  const {
    cart, removeItem, updateQty, setCustomPrice,
    subtotal, discountAmt, tax, total, cashChange,
    appliedDiscount, customer,
    paymentMethod, setPaymentMethod,
    posView, setPosView,
    cashGiven, setCashGiven,
    note, setNote,
    resetSale,
    setCustomer, setDiscountType, setDiscountVal,
    setCouponCode, setAppliedDiscount, applyDiscount,
    discountType, discountVal, couponCode,
  } = sale;

  return (
    <div className="w-[300px] shrink-0 flex flex-col relative bg-pos-surface">

      {/* Cart header */}
      <div className="flex items-center justify-between px-[18px] py-3 border-b border-carbon shrink-0">
        <div>
          <p className="text-[14px] font-semibold text-white">Current Sale</p>
          {cart.length > 0 && (
            <p className="text-[11px] text-[#8C8A82] mt-[1px]">
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
              customer ? 'text-brand-orange' : 'text-pos-faint',
            )}
          >
            <User size={11} />
            {customer ? customer.name.split(' ')[0] : 'Customer'}
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

      {/* Slide-in panels */}
      {posView === 'customer' && (
        <CustomerPanel
          customer={customer}
          setCustomer={setCustomer}
          setPosView={setPosView}
        />
      )}
      {posView === 'discount' && (
        <DiscountPanel
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountVal={discountVal}
          setDiscountVal={setDiscountVal}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          appliedDiscount={appliedDiscount}
          setAppliedDiscount={setAppliedDiscount}
          applyDiscount={applyDiscount}
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
            <div key={item.name} className="py-[10px] border-b border-carbon">
              <div className="flex items-start gap-[10px]">
                <item.icon size={18} className="mt-[2px] shrink-0 text-brand-orange" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white">{item.name}</p>
                  <p className="text-[10px] text-pos-muted">{item.sku}</p>
                </div>
                <button
                  onClick={() => removeItem(item.name)}
                  className="text-[16px] bg-transparent border-0 cursor-pointer leading-none -mt-[2px] text-[#3A3836]"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 pl-7">
                {/* Qty controls */}
                <div className="flex items-center gap-[6px]">
                  <button
                    onClick={() => updateQty(item.name, -1)}
                    className="w-[22px] h-[22px] rounded-[6px] bg-carbon border-0 text-white cursor-pointer flex items-center justify-center text-[14px]"
                  >
                    −
                  </button>
                  <span className="text-[13px] font-semibold text-white w-5 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.name, 1)}
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
                    onChange={e => setCustomPrice(item.name, e.target.value)}
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
                <span className="text-[12px] text-pos-faint">Tax (8%)</span>
                <span className="text-[12px] text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-carbon">
                <span className="text-[16px] font-bold text-white">Total</span>
                <span className="text-[20px] font-bold text-brand-orange">${total.toFixed(2)}</span>
              </div>
              {customer && (
                <div className="mt-[6px] bg-pos-surface rounded-lg px-[10px] py-[6px] flex justify-between">
                  <span className="text-[11px] text-pos-faint flex items-center gap-1">
                    <User size={10} />{customer.name}
                  </span>
                  <span className="text-[11px] text-brand-orange">+{Math.floor(total)} pts</span>
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-4 gap-[6px] mb-[10px]">
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
          </>
        )}

        {/* Charge button */}
        <button
          onClick={() => cart.length > 0 && setPosView('receipt')}
          className={clsx(
            'w-full rounded-[10px] py-[13px] text-center text-[15px] font-bold text-white border-0',
            'flex items-center justify-center gap-[6px]',
            cart.length === 0
              ? 'bg-charcoal opacity-40 cursor-default'
              : 'bg-brand-orange cursor-pointer',
          )}
        >
          {cart.length === 0 ? 'Charge $0.00' : `Charge $${total.toFixed(2)}`}
        </button>

        {/* Clear / Hold / Print */}
        {cart.length > 0 && (
          <div className="flex gap-2 mt-2">
            {([
              ['× Clear', null,    resetSale  ],
              ['Hold',    Pause,   () => {}   ],
              ['Print',   Printer, () => {}   ],
            ] as [string, LucideIcon | null, () => void][]).map(([label, Icon, handler]) => (
              <button
                key={label}
                onClick={handler}
                className="flex-1 py-[7px] bg-pos-surface border border-carbon rounded-lg cursor-pointer flex items-center justify-center gap-1"
              >
                {Icon && <Icon size={11} className="text-pos-muted" />}
                <span className="text-[11px] text-pos-muted">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Receipt overlay */}
      {posView === 'receipt' && (
        <ReceiptOverlay
          cart={cart}
          total={total}
          cashChange={cashChange}
          paymentMethod={paymentMethod}
          resetSale={resetSale}
        />
      )}
    </div>
  );
}
