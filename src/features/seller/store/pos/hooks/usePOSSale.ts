import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetPosProducts, apiSearchPosProducts, apiGetProductByBarcode } from '@/api/commerce/posProducts';
import {
  apiCreateSale, apiCompleteSale, apiEditHeldSaleItems,
  apiGetHeldSales, apiDiscardHeldSale,
  type Sale, type PosPaymentMethod,
} from '@/api/commerce/posSales';
import { apiGetPosSettings } from '@/api/commerce/posSettings';
import { usePosSession } from '../context/PosSessionContext';
import type {
  CartItem, PosView, AppliedDiscount, PosDiscountType, POSSaleState,
} from '../pos.types';

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
        ? apiSearchPosProducts(storeId, q).then(res => ({ items: res.data, totalPages: 1 }))
        : apiGetPosProducts(storeId, { page, limit: PAGE_SIZE }).then(res => ({
            items: res.data.products,
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
    setCart(prev => prev.map(i => i.variantId === variantId ? { ...i, customPrice: parseFloat(price) || null } : i));

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
    setAppliedDiscount({
      type:  discountType,
      value: parseFloat(discountVal),
      label: discountType === 'pct' ? `${discountVal}% off` : `$${discountVal} off`,
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
      .then(res => setHeldSales(res.data))
      .catch(() => {})
      .finally(() => setHeldSalesLoading(false));
  }, [storeId, sessionId]);

  useEffect(() => { reloadHeldSales(); }, [reloadHeldSales]);

  const resumeHeldSale = (sale: Sale) => {
    setCart(sale.items.map(item => ({
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
        const res = await apiCreateSale({
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
        });
        if (status === 'completed') {
          setLastSale(res.data);
          setPosView('receipt');
        } else {
          resetSaleInternal();
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
  };
}
