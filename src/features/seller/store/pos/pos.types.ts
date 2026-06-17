import type { LucideIcon } from 'lucide-react';
import type { PaymentMethod, DiscountType, AppliedDiscount } from '@/types';

export type { PaymentMethod, DiscountType, AppliedDiscount };

export interface PosProduct {
  name:     string;
  price:    number;
  icon:     LucideIcon;
  sku:      string;
  category: string;
  stock:    number;
}

export interface CartItem extends PosProduct {
  qty:         number;
  customPrice: number | null;
}

export interface PosCustomer {
  name:    string;
  email:   string;
  points:  number;
  segment: string;
}

export type PosView   = 'charge' | 'customer' | 'discount' | 'receipt';
export type ActiveTab = 'sale' | 'orders' | 'products' | 'summary';

export interface POSSaleState {
  // Filter
  searchQuery:       string;
  setSearchQuery:    (q: string) => void;
  activeCategory:    string;
  setActiveCategory: (c: string) => void;
  categories:        string[];
  filtered:          PosProduct[];
  // Cart
  cart:           CartItem[];
  addItem:        (p: PosProduct) => void;
  removeItem:     (name: string) => void;
  updateQty:      (name: string, delta: number) => void;
  setCustomPrice: (name: string, price: string) => void;
  // View
  posView:    PosView;
  setPosView: (v: PosView) => void;
  // Customer
  customer:    PosCustomer | null;
  setCustomer: (c: PosCustomer | null) => void;
  // Discount
  discountType:       DiscountType;
  setDiscountType:    (t: DiscountType) => void;
  discountVal:        string;
  setDiscountVal:     (v: string) => void;
  couponCode:         string;
  setCouponCode:      (v: string) => void;
  appliedDiscount:    AppliedDiscount | null;
  setAppliedDiscount: (d: AppliedDiscount | null) => void;
  applyDiscount:      () => void;
  // Payment
  paymentMethod:    PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cashGiven:        string;
  setCashGiven:     (v: string) => void;
  // Note
  note:    string;
  setNote: (v: string) => void;
  // Computed totals
  subtotal:    number;
  discountAmt: number;
  tax:         number;
  total:       number;
  cashChange:  number;
  // Actions
  resetSale: () => void;
}
