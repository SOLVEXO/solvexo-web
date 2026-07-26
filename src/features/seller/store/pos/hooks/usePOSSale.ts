import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetPosProducts, apiSearchPosProducts, apiGetProductByBarcode } from '@/api/services/pos/posProducts';
import {
  apiCreateSale, apiCompleteSale, apiEditHeldSaleItems,
  apiGetHeldSales, apiDiscardHeldSale,
  type Sale, type PosPaymentMethod, type CreateSalePayload,
} from '@/api/services/pos/posSales';
import { apiGetPosSettings } from '@/api/services/pos/posSettings';
import { isNetworkError } from '@/api/client';
import { enqueueSale, getQueuedSales, removeQueuedSale, countQueuedSales } from '../offlineQueue';
import { usePosSession } from '../context/PosSessionContext';
import type {
  CartItem, PosView, AppliedDiscount, PosDiscountType, POSSaleState,
} from '../pos.types';

// Builds a Sale-shaped receipt entirely client-side for a sale that couldn't
// reach the server — it's queued locally and will be created for real once
// connectivity returns, but the cashier still needs a receipt right now.
function buildOfflineSale(payload: CreateSalePayload, cart: CartItem[], subtotal: number, discount: number, tax: number, total: number): Sale {
  const now = new Date().toISOString();
  return {
    _id: `offline-${payload.idempotencyKey}`,
    saleNumber: 'PENDING SYNC',
    storeId: payload.storeId,
    sessionId: payload.sessionId,
    registerId: payload.registerId,
    employeeId: payload.employeeId,
    items: cart.map(i => ({
      _id: i.variantId,
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      sku: i.sku,
      image: i.image,
      price: i.customPrice ?? i.price,
      qty: i.qty,
      lineTotal: (i.customPrice ?? i.price) * i.qty,
      refundedQty: 0,
    })),
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: payload.paymentMethod,
    customerId: null,
    customerName: payload.customerName ?? 'Walk-in',
    notes: payload.notes ?? null,
    heldAt: null,
    status: payload.status ?? 'completed',
    idempotencyKey: payload.idempotencyKey ?? null,
    voidedAt: null,
    voidedBy: null,
    refundedAmount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

const PAGE_SIZE = 30;

export function usePOSSale(): POSSaleState {
  const { storeId, sessionId, registerId, employee, refreshSession } = usePosSession();
  const employeeId = employee?._id;

  // ── Products (browse + search) ─────────────────────────────────────────────
  const [products, setProducts]               = useState<POSSaleState['products']>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError]     = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [barcodeError, setBarcodeError]       = useState('');
  const [reloadTick, setReloadTick]           = useState(0);

  const reloadProducts = useCallback(() => setReloadTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    setProductsLoading(true);
    setProductsError('');

    const timer = setTimeout(() => {
      const request = q
        ? apiSearchPosProducts(storeId, q).then(res => ({ items: res.data ?? [], totalPages: 1 }))
        : apiGetPosProducts(storeId, { page, limit: PAGE_SIZE }).then(res => ({
            items: res.data.products ?? [],
            totalPages: res.data.pagination.totalPages,
          }));

      request
        .then(({ items, totalPages: tp }) => {
          if (cancelled) return;
          setProducts(items);
          setTotalPages(tp);
        })
        .catch(err => { if (!cancelled) setProductsError(err instanceof Error ? err.message : 'Failed to load products.'); })
        .finally(() => { if (!cancelled) setProductsLoading(false); });
    }, q ? 300 : 0);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [storeId, page, searchQuery, reloadTick]);

  const lookupBarcode = useCallback(async (barcode: string) => {
    setBarcodeError('');
    try {
      const res = await apiGetProductByBarcode(storeId, barcode);
      addItemRef.current({
        productId: res.data.productId,
        variantId: res.data.variant.variantId,
        name:      res.data.name,
        sku:       res.data.variant.sku,
        image:     res.data.image,
        price:     res.data.variant.price,
        stock:     res.data.variant.stock,
      });
      setSearchQuery('');
    } catch (err) {
      setBarcodeError(err instanceof Error ? err.message : 'No product found for that barcode.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem: POSSaleState['addItem'] = (item) => {
    if (item.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.variantId === item.variantId);
      if (existing) {
        const nextQty = Math.min(existing.qty + 1, item.stock || existing.qty + 1);
        return prev.map(i => i.variantId === item.variantId ? { ...i, qty: nextQty } : i);
      }
      return [...prev, { ...item, qty: 1, customPrice: null }];
    });
  };
  const addItemRef = useRef(addItem);
  addItemRef.current = addItem;

  const removeItem = (variantId: string) =>
    setCart(prev => prev.filter(i => i.variantId !== variantId));

  const updateQty = (variantId: string, delta: number) =>
    setCart(prev => prev.map(i => {
      if (i.variantId !== variantId) return i;
      const next = Math.max(1, i.qty + delta);
      return { ...i, qty: i.stock > 0 ? Math.min(next, i.stock) : next };
    }));

  const setCustomPrice = (variantId: string, price: string) =>
    setCart(prev => prev.map(i => {
      if (i.variantId !== variantId) return i;
      const parsed = parseFloat(price);
      // Floor at 0 — a negative/zero override would let a line item erase real revenue
      // while stock is still deducted from inventory.
      const customPrice = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      return { ...i, customPrice };
    }));

  // ── View / customer / discount / payment / note ──────────────────────────
  const [posView, setPosView]           = useState<PosView>('charge');
  const [customerName, setCustomerName] = useState('Walk-in');
  const [discountType, setDiscountType] = useState<PosDiscountType>('pct');
  const [discountVal, setDiscountVal]   = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('cash');
  const [cashGiven, setCashGiven]       = useState('');
  const [note, setNote]                 = useState('');

  const applyDiscount = () => {
    if (!discountVal) return;
    const parsed = parseFloat(discountVal);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    // Percent discounts are capped at 100 — fixed discounts are already capped to the
    // sale subtotal when the total is computed below, so no separate ceiling is needed here.
    const value = discountType === 'pct' ? Math.min(parsed, 100) : parsed;
    setAppliedDiscount({
      type:  discountType,
      value,
      label: discountType === 'pct' ? `${value}% off` : `$${value} off`,
    });
    setPosView('charge');
  };
  const removeDiscount = () => { setAppliedDiscount(null); setDiscountVal(''); };

  // ── Tax settings ──────────────────────────────────────────────────────────
  const [taxRate, setTaxRate] = useState(0);
  useEffect(() => {
    let cancelled = false;
    apiGetPosSettings(storeId).then(res => { if (!cancelled) setTaxRate(res.data.taxRate || 0); }).catch(() => {});
    return () => { cancelled = true; };
  }, [storeId]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal    = cart.reduce((s, i) => s + (i.customPrice ?? i.price) * i.qty, 0);
  const discountAmt = appliedDiscount
    ? (appliedDiscount.type === 'pct'
        ? subtotal * (appliedDiscount.value / 100)
        : Math.min(appliedDiscount.value, subtotal))
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const tax           = parseFloat((afterDiscount * taxRate).toFixed(2));
  const total          = parseFloat((afterDiscount + tax).toFixed(2));
  const cashChange     = cashGiven ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  // ── Held sales ────────────────────────────────────────────────────────────
  const [heldSales, setHeldSales]               = useState<Sale[]>([]);
  const [heldSalesLoading, setHeldSalesLoading] = useState(false);
  const [resumingSaleId, setResumingSaleId]     = useState<string | null>(null);

  const reloadHeldSales = useCallback(() => {
    if (!sessionId) return;
    setHeldSalesLoading(true);
    apiGetHeldSales(storeId, sessionId)
      .then(res => setHeldSales(res.data ?? []))
      .catch(() => {})
      .finally(() => setHeldSalesLoading(false));
  }, [storeId, sessionId]);

  useEffect(() => { reloadHeldSales(); }, [reloadHeldSales]);

  const resumeHeldSale = (sale: Sale) => {
    setCart((sale.items ?? []).map(item => ({
      productId:   item.productId,
      variantId:   item.variantId,
      name:        item.name,
      sku:         item.sku,
      image:       item.image,
      price:       item.price,
      stock:       9999,
      qty:         item.qty,
      customPrice: null,
    })));
    setCustomerName(sale.customerName || 'Walk-in');
    setNote(sale.notes ?? '');
    setAppliedDiscount(null);
    setResumingSaleId(sale._id);
    setPosView('charge');
  };

  const discardHeldSaleFn = async (saleId: string) => {
    await apiDiscardHeldSale(saleId);
    if (resumingSaleId === saleId) resetSaleInternal();
    reloadHeldSales();
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const [charging, setCharging]       = useState(false);
  const [chargeError, setChargeError] = useState('');
  const [lastSale, setLastSale]       = useState<Sale | null>(null);

  // ── Offline sync ──────────────────────────────────────────────────────────
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const refreshPendingSyncCount = useCallback(() => {
    countQueuedSales().then(setPendingSyncCount).catch(() => {});
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const queued = await getQueuedSales().catch(() => []);
    for (const item of queued) {
      try {
        await apiCreateSale(item.payload);
        await removeQueuedSale(item.idempotencyKey);
      } catch (err) {
        if (isNetworkError(err)) break; // still offline — stop and retry later
        // A real server rejection (e.g. stale stock) — leave it queued rather
        // than silently discard a sale the cashier already rang up.
      }
    }
    refreshPendingSyncCount();
  }, [refreshPendingSyncCount]);

  useEffect(() => {
    refreshPendingSyncCount();
    window.addEventListener('online', flushOfflineQueue);
    const interval = setInterval(flushOfflineQueue, 30_000);
    return () => {
      window.removeEventListener('online', flushOfflineQueue);
      clearInterval(interval);
    };
  }, [flushOfflineQueue, refreshPendingSyncCount]);

  function resetSaleInternal() {
    setCart([]);
    setAppliedDiscount(null);
    setDiscountVal('');
    setCustomerName('Walk-in');
    setCashGiven('');
    setNote('');
    setPosView('charge');
    setResumingSaleId(null);
    setLastSale(null);
    setChargeError('');
  }

  const charge = async (status: 'completed' | 'held') => {
    if (cart.length === 0 || !sessionId || !registerId || !employeeId) return;
    setChargeError('');
    setCharging(true);
    try {
      if (resumingSaleId) {
        await apiEditHeldSaleItems(resumingSaleId, {
          items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          discount: parseFloat(discountAmt.toFixed(2)),
          tax,
        });
        const res = await apiCompleteSale(resumingSaleId, {
          paymentMethod,
          notes: note || undefined,
        });
        setLastSale(res.data);
        setPosView('receipt');
      } else {
        const payload: CreateSalePayload = {
          storeId,
          sessionId,
          registerId,
          employeeId,
          items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          discount: parseFloat(discountAmt.toFixed(2)),
          tax,
          paymentMethod,
          customerName: customerName.trim() || 'Walk-in',
          notes: note || undefined,
          status,
          idempotencyKey: crypto.randomUUID(),
        };
        try {
          const res = await apiCreateSale(payload);
          if (status === 'completed') {
            setLastSale(res.data);
            setPosView('receipt');
          } else {
            resetSaleInternal();
          }
        } catch (err) {
          if (!isNetworkError(err)) throw err;
          // No connection — queue it locally and let the cashier keep going.
          // It's created for real on the server as soon as connectivity returns.
          await enqueueSale(payload);
          refreshPendingSyncCount();
          if (status === 'completed') {
            setLastSale(buildOfflineSale(payload, cart, subtotal, discountAmt, tax, total));
            setPosView('receipt');
          } else {
            resetSaleInternal();
          }
        }
      }
      reloadProducts();
      reloadHeldSales();
      refreshSession();
    } catch (err) {
      setChargeError(err instanceof Error ? err.message : 'Failed to process sale. Please try again.');
    } finally {
      setCharging(false);
    }
  };

  const resetSale = () => resetSaleInternal();

  return {
    products, productsLoading, productsError,
    searchQuery, setSearchQuery, page, totalPages, setPage,
    reloadProducts, lookupBarcode, barcodeError,

    cart, addItem, removeItem, updateQty, setCustomPrice,

    posView, setPosView,

    customerName, setCustomerName,

    discountType, setDiscountType, discountVal, setDiscountVal,
    appliedDiscount, applyDiscount, removeDiscount,

    paymentMethod, setPaymentMethod,
    cashGiven, setCashGiven,
    note, setNote,

    subtotal, discountAmt, taxRate, tax, total, cashChange,

    heldSales, heldSalesLoading, resumingSaleId,
    resumeHeldSale, discardHeldSale: discardHeldSaleFn, reloadHeldSales,

    charging, chargeError, lastSale, charge, resetSale,

    pendingSyncCount, syncNow: flushOfflineQueue,
  };
}
