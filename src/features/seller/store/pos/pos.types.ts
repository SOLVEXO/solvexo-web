import type { PosProductVariant } from '@/api/services/pos/posProducts';
import type { PosPaymentMethod, Sale } from '@/api/services/pos/posSales';

export type { PosPaymentMethod, PosProductVariant };

export type PosView   = 'charge' | 'customer' | 'discount' | 'receipt';
export type ActiveTab = 'sale' | 'orders' | 'products' | 'summary' | 'manage';

export type PosDiscountType = 'pct' | 'fixed';

export interface AppliedDiscount {
  type:  PosDiscountType;
  value: number;
  label: string;
}

// A cart line — always a single product+variant pair (real catalog items, not mock SKUs)
export interface CartItem {
  productId:   string;
  variantId:   string;
  name:        string;
  sku:         string;
  image:       string | null;
  price:       number;
  stock:       number;
  qty:         number;
  customPrice: number | null;
}

export interface POSSaleState {
  // Products (paginated browse + search)
  products:        Array<{ productId: string; name: string; image: string | null; variants: PosProductVariant[] }>;
  productsLoading: boolean;
  productsError:   string;
  searchQuery:     string;
  setSearchQuery:  (q: string) => void;
  page:            number;
  totalPages:      number;
  setPage:         (p: number) => void;
  reloadProducts:  () => void;
  lookupBarcode:   (barcode: string) => Promise<void>;
  barcodeError:    string;

  // Cart
  cart:           CartItem[];
  addItem:        (item: { productId: string; variantId: string; name: string; sku: string; image: string | null; price: number; stock: number }) => void;
  removeItem:     (variantId: string) => void;
  updateQty:      (variantId: string, delta: number) => void;
  setCustomPrice: (variantId: string, price: string) => void;

  // View
  posView:    PosView;
  setPosView: (v: PosView) => void;

  // Customer (no backend customer directory for POS — free-text name only)
  customerName:    string;
  setCustomerName: (v: string) => void;

  // Discount
  discountType:       PosDiscountType;
  setDiscountType:    (t: PosDiscountType) => void;
  discountVal:        string;
  setDiscountVal:     (v: string) => void;
  appliedDiscount:    AppliedDiscount | null;
  applyDiscount:      () => void;
  removeDiscount:     () => void;

  // Payment
  paymentMethod:    PosPaymentMethod;
  setPaymentMethod: (m: PosPaymentMethod) => void;
  cashGiven:        string;
  setCashGiven:     (v: string) => void;

  // Note
  note:    string;
  setNote: (v: string) => void;

  // Computed totals
  subtotal:    number;
  discountAmt: number;
  taxRate:     number;
  tax:         number;
  total:       number;
  cashChange:  number;

  // Held sales
  heldSales:        Sale[];
  heldSalesLoading: boolean;
  resumingSaleId:   string | null;
  resumeHeldSale:   (sale: Sale) => void;
  discardHeldSale:  (saleId: string) => Promise<void>;
  reloadHeldSales:  () => void;

  // Checkout
  charging:    boolean;
  chargeError: string;
  lastSale:    Sale | null;
  charge:      (status: 'completed' | 'held') => Promise<void>;
  resetSale:   () => void;
}
