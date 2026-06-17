import { useState, useMemo } from 'react';
import { POS_PRODUCTS } from '../pos.data';
import type {
  CartItem, PosProduct, PosCustomer, PosView,
  PaymentMethod, DiscountType, AppliedDiscount,
  POSSaleState,
} from '../pos.types';

export function usePOSSale(): POSSaleState {
  const [cart,             setCart]             = useState<CartItem[]>([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [activeCategory,   setActiveCategory]   = useState('All');
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>('card');
  const [posView,          setPosView]          = useState<PosView>('charge');
  const [discountType,     setDiscountType]     = useState<DiscountType>('pct');
  const [discountVal,      setDiscountVal]      = useState('');
  const [couponCode,       setCouponCode]       = useState('');
  const [appliedDiscount,  setAppliedDiscount]  = useState<AppliedDiscount | null>(null);
  const [customer,         setCustomer]         = useState<PosCustomer | null>(null);
  const [cashGiven,        setCashGiven]        = useState('');
  const [note,             setNote]             = useState('');

  const categories = useMemo(
    () => ['All', ...new Set(POS_PRODUCTS.map(p => p.category))],
    [],
  );

  const filtered = useMemo(
    () => POS_PRODUCTS.filter(p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [activeCategory, searchQuery],
  );

  const addItem = (p: PosProduct) => {
    if (p.stock === 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.name === p.name);
      if (existing) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1, customPrice: null }];
    });
  };

  const removeItem = (name: string) =>
    setCart(prev => prev.filter(i => i.name !== name));

  const updateQty = (name: string, delta: number) =>
    setCart(prev => prev.map(i => i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const setCustomPrice = (name: string, price: string) =>
    setCart(prev => prev.map(i => i.name === name ? { ...i, customPrice: parseFloat(price) || null } : i));

  const subtotal    = cart.reduce((s, i) => s + (i.customPrice ?? i.price) * i.qty, 0);
  const discountAmt = appliedDiscount
    ? (appliedDiscount.type === 'pct'
        ? subtotal * (appliedDiscount.value / 100)
        : Math.min(appliedDiscount.value, subtotal))
    : 0;
  const afterDiscount = subtotal - discountAmt;
  const tax           = afterDiscount * 0.08;
  const total         = afterDiscount + tax;
  const cashChange    = cashGiven ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  const applyDiscount = () => {
    if (discountType === 'coupon' && couponCode === 'SAVE10') {
      setAppliedDiscount({ type: 'pct', value: 10, label: 'Coupon SAVE10' });
      setPosView('charge');
      return;
    }
    if (discountType !== 'coupon' && discountVal) {
      setAppliedDiscount({
        type:  discountType,
        value: parseFloat(discountVal),
        label: discountType === 'pct' ? `${discountVal}% off` : `$${discountVal} off`,
      });
      setPosView('charge');
    }
  };

  const resetSale = () => {
    setCart([]);
    setAppliedDiscount(null);
    setCustomer(null);
    setCashGiven('');
    setNote('');
    setPosView('charge');
  };

  return {
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory,
    categories, filtered,
    cart, addItem, removeItem, updateQty, setCustomPrice,
    posView, setPosView,
    customer, setCustomer,
    discountType, setDiscountType,
    discountVal, setDiscountVal,
    couponCode, setCouponCode,
    appliedDiscount, setAppliedDiscount,
    applyDiscount,
    paymentMethod, setPaymentMethod,
    cashGiven, setCashGiven,
    note, setNote,
    subtotal, discountAmt, tax, total, cashChange,
    resetSale,
  };
}
