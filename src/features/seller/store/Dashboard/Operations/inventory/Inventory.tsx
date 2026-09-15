import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Download,
  AlertCircle, RefreshCw,
  AlertTriangle, History, PlusCircle, MinusCircle,
  CheckCircle2, XCircle, Package, MapPin, ArrowLeftRight, Trash2, Truck, SlidersHorizontal, ClipboardCheck, TrendingUp,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Table,      type TableColumn,
  Badge,
  EmptyState,
  Card,
  SearchInput,
  SkeletonBox,
  MetricCard,
  Modal,
  Button,
  Toggle,
} from '@/components/comman/ui';
import {
  apiGetLowStockSummary,
  apiExportInventoryCsv,
  apiGetStockLines,
  apiAdjustStock,
  apiGetStockHistory,
  apiListActiveLocations,
  apiListLocations,
  apiCreateLocation,
  apiArchiveLocation,
  apiGetVariantLocations,
  apiShipTransfer,
  apiReceiveTransfer,
  apiCancelTransfer,
  apiListTransfers,
  apiUpdateVariant,
  apiImportStockCsv,
  type LowStockSummaryData,
  type StockLine,
  type StockAdjustment,
  type StockAdjustmentReason,
  type StoreLocation,
  type VariantLocationBreakdown,
  type StockTransfer,
  type StockLineStatusFilter,
  type ImportStockCsvResult,
} from '@/api/services/product';
import { currencySymbol } from '@/utils/currency';
import { apiStartStockCount } from '@/api/services/stockCounts';
import { apiListBins, apiCreateBin, apiDeleteBin, type Bin } from '@/api/services/staff';

const STATUS_META: Record<StockLine['status'], { label: string; color: 'green' | 'orange' | 'red' | 'blue' }> = {
  in_stock:     { label: 'In Stock',     color: 'green'  },
  low_stock:    { label: 'Low Stock',    color: 'orange' },
  out_of_stock: { label: 'Out of Stock', color: 'red'    },
  unlimited:    { label: 'Unlimited',    color: 'blue'   },
};

// 'purchase_received' isn't listed here — it's written automatically by
// Purchase Order receiving, never picked manually from this form.
const REASON_OPTIONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: 'restocked',  label: 'Restocked'          },
  { value: 'damaged',    label: 'Damaged'            },
  { value: 'return',     label: 'Return'             },
  { value: 'correction', label: 'Count Correction'   },
  { value: 'write_off',  label: 'Write Off (damaged pool)' },
  { value: 'other',      label: 'Other'              },
];

// 'damaged' moves units OUT of the sellable pool without changing real
// on-hand `stock` (they're still physically here, just unsellable);
// 'write_off' permanently discards units already sitting in that pool.
// Both are inherently removal-only and apply to the variant as a whole —
// the backend rejects a positive delta or a locationId for either.
const BUCKET_ONLY_REASONS: StockAdjustmentReason[] = ['damaged', 'write_off'];

const TRANSFER_STATUS_META: Record<StockTransfer['status'], { label: string; color: 'green' | 'orange' | 'red' | 'blue' }> = {
  in_transit:         { label: 'In Transit',         color: 'orange' },
  partially_received: { label: 'Partially Received', color: 'blue'   },
  received:           { label: 'Received',           color: 'green'  },
  cancelled:           { label: 'Cancelled',          color: 'red'    },
};

// ── Page ──────────────────────────────────────────────────────────────────────
/** `embedded`: when rendered as the "Stock" tab of `InventoryHub.tsx` (the
 *  Analytics/SEO-Center-style tabbed consolidation page), the hub already
 *  renders one shared `StorePageHeader` + `TabBar` above every tab — this
 *  component then skips its OWN `StorePageHeader` (avoiding a duplicate
 *  page-header) and renders its action buttons as a plain inline bar
 *  instead, directly above the stats cards. Every action/modal/table is
 *  otherwise byte-identical either way. Defaults to `false` so the legacy
 *  standalone `/inventory` route (still reachable — see router's
 *  "disconnect, don't delete" convention) renders exactly as it always did. */
export function StoreInventory({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate    = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const [lines,         setLines]         = useState<StockLine[]>([]);
  const [stats, setStats] = useState<{ totalLines: number; inStock: number; lowStock: number; outOfStock: number } | null>(null);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lowStock,   setLowStock]   = useState<LowStockSummaryData | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockLineStatusFilter | ''>('');

  const LIMIT = 20;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    apiGetStockLines(storeId, page, LIMIT, debouncedSearch, statusFilter || undefined)
      .then(res => {
        if (cancelled) return;
        setLines(res.data.lines ?? []);
        setStats(res.data.stats);
        setTotal(res.data.pagination.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load inventory.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, refreshKey, debouncedSearch, statusFilter]);

  // Low-stock detail list — independent of pagination, only re-runs on store/refresh.
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiGetLowStockSummary(storeId)
      .then(res => { if (!cancelled) setLowStock(res.data); })
      .catch(() => { /* non-critical widget — stats card above already covers the count */ });
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  // ── Multi-location — only meaningful once a store has 2+ real
  // locations. A store with 0/1 never sees any location-aware UI at all —
  // Adjust/Transfer stay exactly as simple as before.
  const [activeLocations, setActiveLocations] = useState<StoreLocation[]>([]);
  const [locationsRefreshKey, setLocationsRefreshKey] = useState(0);
  const hasMultipleLocations = activeLocations.length >= 2;

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiListActiveLocations(storeId)
      .then(res => { if (!cancelled) setActiveLocations(res.data ?? []); })
      .catch(() => { /* non-critical — table just stays in single-number mode */ });
    return () => { cancelled = true; };
  }, [storeId, locationsRefreshKey]);

  const handlePageChange = (p: number) => {
    setLoading(true);
    setError('');
    setPage(p);
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRefreshKey(k => k + 1);
  };

  const [startingCount, setStartingCount] = useState(false);
  const handleStartStockCount = async () => {
    setStartingCount(true);
    try {
      const res = await apiStartStockCount(storeId);
      navigate(`/store/${storeId}/inventory/count/${res.data._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start stock count.');
    } finally {
      setStartingCount(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const handleExportCsv = () => {
    setExporting(true);
    setError('');
    apiExportInventoryCsv(storeId)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to export inventory.'))
      .finally(() => setExporting(false));
  };

  // ── Bulk stock reconciliation via CSV — real per-row result (updated
  // count + a per-row error list), never all-or-nothing, same UX pattern
  // the product CSV importer already established.
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<ImportStockCsvResult | null>(null);
  const handleImportCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportingCsv(true);
    setError('');
    try {
      const res = await apiImportStockCsv(storeId, file);
      setCsvImportResult(res.data);
      if (res.data.updatedCount > 0) setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import stock CSV.');
    } finally {
      setImportingCsv(false);
    }
  };

  // ── Real, reason-coded stock adjustment — was missing entirely (the only
  // way to change stock used to be opening the full Edit Product form, with
  // no audit trail of who changed what or why). Opens right from this table.
  const [adjustTarget, setAdjustTarget] = useState<StockLine | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'remove'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState<StockAdjustmentReason>('restocked');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  // Only populated/shown once the store has 2+ locations.
  const [adjustLocationId, setAdjustLocationId] = useState('');
  const [adjustBreakdown, setAdjustBreakdown] = useState<VariantLocationBreakdown | null>(null);
  const [adjustBreakdownLoading, setAdjustBreakdownLoading] = useState(false);

  const openAdjust = (line: StockLine) => {
    setAdjustTarget(line);
    setAdjustDirection('add');
    setAdjustQty('');
    setAdjustReason('restocked');
    setAdjustNote('');
    setAdjustError('');
    setAdjustLocationId('');
    setAdjustBreakdown(null);
    if (hasMultipleLocations) {
      setAdjustBreakdownLoading(true);
      apiGetVariantLocations(storeId, line.variantId)
        .then(res => {
          setAdjustBreakdown(res.data);
          const defaultLoc = res.data.locations.find(l => l.isDefault) ?? res.data.locations[0];
          if (defaultLoc) setAdjustLocationId(defaultLoc.locationId);
        })
        .catch(() => setAdjustError('Failed to load per-location stock.'))
        .finally(() => setAdjustBreakdownLoading(false));
    }
  };

  const isBucketOnlyReason = BUCKET_ONLY_REASONS.includes(adjustReason);

  const handleAdjustSubmit = async () => {
    if (!adjustTarget) return;
    const qty = parseInt(adjustQty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError('Enter a quantity greater than 0');
      return;
    }
    // 'damaged'/'write_off' apply to the variant as a whole, never one
    // location — the backend rejects a locationId for either.
    if (hasMultipleLocations && !isBucketOnlyReason && !adjustLocationId) {
      setAdjustError('Select which location this stock change applies to');
      return;
    }
    const delta = (isBucketOnlyReason ? false : adjustDirection === 'add') ? qty : -qty;
    setAdjusting(true);
    setAdjustError('');
    try {
      await apiAdjustStock(storeId, adjustTarget.variantId, delta, adjustReason, adjustNote, hasMultipleLocations && !isBucketOnlyReason ? adjustLocationId : undefined);
      setAdjustTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Failed to adjust stock.');
    } finally {
      setAdjusting(false);
    }
  };

  // ── Real branch-to-branch stock Transfer — Shopify's own equivalent.
  const [transferTarget, setTransferTarget] = useState<StockLine | null>(null);
  const [transferBreakdown, setTransferBreakdown] = useState<VariantLocationBreakdown | null>(null);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  const openTransfer = (line: StockLine) => {
    setTransferTarget(line);
    setTransferBreakdown(null);
    setTransferFrom('');
    setTransferTo('');
    setTransferQty('');
    setTransferNote('');
    setTransferError('');
    apiGetVariantLocations(storeId, line.variantId)
      .then(res => {
        setTransferBreakdown(res.data);
        if (res.data.locations.length >= 2) {
          setTransferFrom(res.data.locations[0].locationId);
          setTransferTo(res.data.locations[1].locationId);
        }
      })
      .catch(() => setTransferError('Failed to load per-location stock.'));
  };

  const handleTransferSubmit = async () => {
    if (!transferTarget) return;
    const qty = parseInt(transferQty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setTransferError('Enter a quantity greater than 0');
      return;
    }
    if (!transferFrom || !transferTo) {
      setTransferError('Select both a source and destination location');
      return;
    }
    if (transferFrom === transferTo) {
      setTransferError('Source and destination must be different');
      return;
    }
    setTransferring(true);
    setTransferError('');
    try {
      await apiShipTransfer(storeId, transferTarget.variantId, transferFrom, transferTo, qty, transferNote);
      setTransferTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : 'Failed to ship transfer.');
    } finally {
      setTransferring(false);
    }
  };

  // ── In-transit transfers (ship → later, receive) — a real 2-step
  // lifecycle, not an instant teleport (see StockTransfer schema's doc
  // comment). This panel is where a seller settles what's currently "on a
  // truck" once it actually arrives at its destination.
  const [transfersModalOpen, setTransfersModalOpen] = useState(false);
  const [transfersList, setTransfersList] = useState<StockTransfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersError, setTransfersError] = useState('');
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [receiveQtyById, setReceiveQtyById] = useState<Record<string, string>>({});
  const [transferActionError, setTransferActionError] = useState('');
  // One idempotency key per transfer, generated lazily and reused across a
  // retry of the SAME receive attempt — cleared on success so a genuinely
  // separate later partial-receive on that same transfer gets a fresh key
  // instead of being (wrongly) deduped against this one.
  const receiveKeysRef = useRef<Record<string, string>>({});
  const getReceiveIdempotencyKey = (transferId: string) => {
    if (!receiveKeysRef.current[transferId]) {
      receiveKeysRef.current[transferId] = `transfer-receive-${transferId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return receiveKeysRef.current[transferId];
  };

  const loadTransfers = () => {
    setTransfersLoading(true);
    setTransfersError('');
    apiListTransfers(storeId)
      .then(res => setTransfersList((res.data ?? []).filter(t => t.status === 'in_transit' || t.status === 'partially_received')))
      .catch((err: unknown) => setTransfersError(err instanceof Error ? err.message : 'Failed to load transfers.'))
      .finally(() => setTransfersLoading(false));
  };

  const openTransfersModal = () => {
    setTransfersModalOpen(true);
    setTransferActionError('');
    loadTransfers();
  };

  const handleReceiveTransfer = async (transfer: StockTransfer) => {
    const remaining = transfer.quantity - transfer.receivedQuantity;
    const qty = parseInt(receiveQtyById[transfer._id] ?? String(remaining), 10);
    if (!Number.isFinite(qty) || qty <= 0 || qty > remaining) {
      setTransferActionError(`Enter a quantity between 1 and ${remaining}`);
      return;
    }
    setReceivingId(transfer._id);
    setTransferActionError('');
    try {
      await apiReceiveTransfer(storeId, transfer._id, qty, getReceiveIdempotencyKey(transfer._id));
      delete receiveKeysRef.current[transfer._id];
      loadTransfers();
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setTransferActionError(err instanceof Error ? err.message : 'Failed to receive transfer.');
    } finally {
      setReceivingId(null);
    }
  };

  const handleCancelTransfer = async (transfer: StockTransfer) => {
    setReceivingId(transfer._id);
    setTransferActionError('');
    try {
      await apiCancelTransfer(storeId, transfer._id);
      loadTransfers();
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setTransferActionError(err instanceof Error ? err.message : 'Failed to cancel transfer.');
    } finally {
      setReceivingId(null);
    }
  };

  // ── Manage Locations (real CRUD, reuses the existing POS location
  // backend as-is) — a lightweight in-page modal rather than a whole new
  // route, since this is a light-touch settings action.
  const [locationsModalOpen, setLocationsModalOpen] = useState(false);
  const [allLocations, setAllLocations] = useState<StoreLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationType, setNewLocationType] = useState<'store' | 'warehouse'>('store');
  const [addingLocation, setAddingLocation] = useState(false);

  const openLocationsModal = () => {
    setLocationsModalOpen(true);
    setLocationsError('');
    setLocationsLoading(true);
    apiListLocations(storeId)
      .then(res => setAllLocations(res.data ?? []))
      .catch((err: unknown) => setLocationsError(err instanceof Error ? err.message : 'Failed to load locations.'))
      .finally(() => setLocationsLoading(false));
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      setLocationsError('Location name is required');
      return;
    }
    setAddingLocation(true);
    setLocationsError('');
    try {
      await apiCreateLocation(storeId, { name: newLocationName.trim(), city: newLocationCity.trim() || undefined, type: newLocationType });
      setNewLocationName('');
      setNewLocationCity('');
      setNewLocationType('store');
      const res = await apiListLocations(storeId);
      setAllLocations(res.data ?? []);
      setLocationsRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setLocationsError(err instanceof Error ? err.message : 'Failed to add location.');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleArchiveLocation = async (locationId: string) => {
    setLocationsError('');
    try {
      await apiArchiveLocation(storeId, locationId);
      const res = await apiListLocations(storeId);
      setAllLocations(res.data ?? []);
      setLocationsRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setLocationsError(err instanceof Error ? err.message : 'Failed to archive location.');
    }
  };

  // ── Bins (bin/shelf-level granularity within one location) — expanded
  // inline under that location's row in the same Manage Locations modal
  // rather than a separate modal-within-modal.
  const [binsOpenFor, setBinsOpenFor] = useState<string | null>(null);
  const [binsByLocation, setBinsByLocation] = useState<Record<string, Bin[]>>({});
  const [binsLoading, setBinsLoading] = useState(false);
  const [newBinCode, setNewBinCode] = useState('');
  const [addingBin, setAddingBin] = useState(false);
  const [binsError, setBinsError] = useState('');

  const toggleBins = (locationId: string) => {
    if (binsOpenFor === locationId) { setBinsOpenFor(null); return; }
    setBinsOpenFor(locationId);
    setBinsError('');
    setNewBinCode('');
    if (!binsByLocation[locationId]) {
      setBinsLoading(true);
      apiListBins(storeId, locationId)
        .then(res => setBinsByLocation(prev => ({ ...prev, [locationId]: res.data })))
        .catch((err: unknown) => setBinsError(err instanceof Error ? err.message : 'Failed to load bins.'))
        .finally(() => setBinsLoading(false));
    }
  };

  const handleAddBin = async (locationId: string) => {
    if (!newBinCode.trim()) { setBinsError('A bin code is required'); return; }
    setAddingBin(true);
    setBinsError('');
    try {
      await apiCreateBin(storeId, locationId, { code: newBinCode.trim() });
      setNewBinCode('');
      const res = await apiListBins(storeId, locationId);
      setBinsByLocation(prev => ({ ...prev, [locationId]: res.data }));
    } catch (err: unknown) {
      setBinsError(err instanceof Error ? err.message : 'Failed to add bin.');
    } finally {
      setAddingBin(false);
    }
  };

  const handleDeleteBin = async (locationId: string, binId: string) => {
    setBinsError('');
    try {
      await apiDeleteBin(storeId, binId);
      const res = await apiListBins(storeId, locationId);
      setBinsByLocation(prev => ({ ...prev, [locationId]: res.data }));
    } catch (err: unknown) {
      setBinsError(err instanceof Error ? err.message : 'Failed to delete bin.');
    }
  };

  // ── Real per-SKU stock history — Shopify's "Inventory History" equivalent,
  // never existed before this pass.
  const [historyTarget, setHistoryTarget] = useState<StockLine | null>(null);
  const [historyItems, setHistoryItems] = useState<StockAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const openHistory = (line: StockLine) => {
    setHistoryTarget(line);
    setHistoryItems([]);
    setHistoryError('');
    setHistoryLoading(true);
    apiGetStockHistory(storeId, line.variantId, 1, 50)
      .then(res => setHistoryItems(res.data.items ?? []))
      .catch((err: unknown) => setHistoryError(err instanceof Error ? err.message : 'Failed to load history.'))
      .finally(() => setHistoryLoading(false));
  };

  // ── Per-SKU reorder point + cost price — a fast-moving SKU and a
  // slow-moving one shouldn't share one store-wide low-stock threshold,
  // and cost is what makes the Inventory Value report (see Reports)
  // possible at all for a seller who never uses Purchase Orders.
  const [settingsTarget, setSettingsTarget] = useState<StockLine | null>(null);
  const [reorderPointInput, setReorderPointInput] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('');
  const [allowBackorderInput, setAllowBackorderInput] = useState(false);
  const [trackLotsInput, setTrackLotsInput] = useState(false);
  const [trackSerialsInput, setTrackSerialsInput] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const openSettings = (line: StockLine) => {
    setSettingsTarget(line);
    setReorderPointInput(line.reorderPoint != null ? String(line.reorderPoint) : '');
    setCostPriceInput(line.costPrice != null ? String(line.costPrice) : '');
    setAllowBackorderInput(!!line.allowBackorder);
    setTrackLotsInput(!!line.trackLots);
    setTrackSerialsInput(!!line.trackSerials);
    setSettingsError('');
  };

  const handleSaveSettings = async () => {
    if (!settingsTarget) return;
    setSavingSettings(true);
    setSettingsError('');
    try {
      const payload: { reorderPoint?: number; costPrice?: number; allowBackorder?: boolean; trackLots?: boolean; trackSerials?: boolean } = {
        allowBackorder: allowBackorderInput,
        trackLots: trackLotsInput,
        trackSerials: trackSerialsInput,
      };
      if (reorderPointInput.trim() !== '') payload.reorderPoint = Math.max(0, Number(reorderPointInput));
      if (costPriceInput.trim() !== '') payload.costPrice = Math.max(0, Number(costPriceInput));
      await apiUpdateVariant(settingsTarget.productId, settingsTarget.variantId, payload);
      setSettingsTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: TableColumn<StockLine>[] = [
    {
      key: 'product', header: 'Product',
      render: l => (
        <div className="flex items-center gap-2.5 min-w-0">
          {l.image
            ? <img src={l.image} alt="" className="w-9 h-9 rounded-[8px] object-cover shrink-0 border border-bone" />
            : <div className="w-9 h-9 rounded-[8px] bg-cream flex items-center justify-center shrink-0"><Package size={15} className="text-slate" /></div>}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal truncate">{l.productName}</p>
            {l.options.length > 0 && (
              <p className="text-[11px] text-slate truncate">
                {l.options.map(o => `${o.name}: ${o.value}`).join(', ')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sku', header: 'SKU',
      render: l => <span className="text-[12px] font-mono text-slate">{l.sku}</span>,
    },
    {
      key: 'price', header: 'Price', align: 'right',
      render: l => <span className="font-semibold text-charcoal">{currencySymbol(store?.baseCurrency)}{l.price.toLocaleString()}</span>,
    },
    {
      key: 'stock', header: 'Available', align: 'right',
      render: l => (
        <div className="text-right">
          <span className="text-[13px] text-carbon">
            {l.unlimitedStock ? '∞ Unlimited' : `${l.available} units`}
          </span>
          {/* Reserved/damaged/in-transit only shown when non-zero — the
              common case (nothing pending on this SKU) stays exactly as
              simple as before any of these existed. */}
          {!l.unlimitedStock && (l.committedStock > 0 || l.damagedStock > 0 || l.inTransitStock > 0) && (
            <p className="text-[10.5px] text-slate">
              {l.stock} on hand
              {l.committedStock > 0 && ` · ${l.committedStock} reserved`}
              {l.damagedStock > 0 && ` · ${l.damagedStock} damaged`}
              {l.inTransitStock > 0 && ` · ${l.inTransitStock} in transit`}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: l => <Badge color={STATUS_META[l.status].color}>{STATUS_META[l.status].label}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'center', width: '180px',
      render: l => (
        <div className="flex items-center justify-center gap-1.5">
          {!l.unlimitedStock && (
            <button
              onClick={() => openAdjust(l)}
              title="Adjust stock"
              className="flex items-center gap-1 text-[11px] font-medium text-graphite border border-bone rounded-[6px] px-2 py-[5px] cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
            >
              <PlusCircle size={12} /> Adjust
            </button>
          )}
          {hasMultipleLocations && !l.unlimitedStock && (
            <button
              onClick={() => openTransfer(l)}
              title="Ship to another location"
              className="flex items-center justify-center w-[26px] h-[26px] text-slate border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
            >
              <ArrowLeftRight size={13} />
            </button>
          )}
          <button
            onClick={() => openHistory(l)}
            title="Stock history"
            className="flex items-center justify-center w-[26px] h-[26px] text-slate border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
          >
            <History size={13} />
          </button>
          {!l.unlimitedStock && (
            <button
              onClick={() => openSettings(l)}
              title="Reorder point & cost"
              className="flex items-center justify-center w-[26px] h-[26px] text-slate border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
            >
              <SlidersHorizontal size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const actionsBar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        title="Manage Locations"
        onClick={openLocationsModal}
        className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
      >
        <MapPin size={14} />
        <span className="hidden sm:inline">Locations{activeLocations.length > 0 ? ` (${activeLocations.length})` : ''}</span>
      </button>
      {!embedded && (
        <button
          title="Inventory Reports"
          onClick={() => navigate(`/store/${storeId}/inventory/reports`)}
          className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
        >
          <TrendingUp size={14} className="sm:hidden" />
          <span className="hidden sm:inline">Reports</span>
        </button>
      )}
      {hasMultipleLocations && (
        <button
          title="In-transit transfers"
          onClick={openTransfersModal}
          className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
        >
          <Truck size={14} />
          <span className="hidden sm:inline">Transfers</span>
        </button>
      )}
      <button
        title="Start a stock count"
        onClick={handleStartStockCount}
        disabled={startingCount}
        className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-60 disabled:cursor-wait"
      >
        <ClipboardCheck size={14} className="sm:hidden" />
        <span className="hidden sm:inline">{startingCount ? 'Starting…' : 'Start Stock Count'}</span>
      </button>
      <button
        title="Export"
        onClick={handleExportCsv}
        disabled={exporting}
        className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-60 disabled:cursor-wait"
      >
        <Download size={14} className="sm:hidden" />
        <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
      </button>
      <input ref={csvInputRef} type="file" accept=".csv" onChange={handleImportCsvFile} className="hidden" />
      <button
        title="Import a stock-reconciliation CSV (SKU, Quantity)"
        onClick={() => csvInputRef.current?.click()}
        disabled={importingCsv}
        className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-60 disabled:cursor-wait"
      >
        <Download size={14} className="sm:hidden rotate-180" />
        <span className="hidden sm:inline">{importingCsv ? 'Importing…' : 'Import CSV'}</span>
      </button>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="px-4 lg:px-7 pt-4">{actionsBar}</div>
      ) : (
        <StorePageHeader
          title="Inventory"
          subtitle={loading ? 'Loading…' : `${total} SKU${total !== 1 ? 's' : ''}`}
          actions={actionsBar}
        />
      )}

      <div className="px-4 lg:px-7 py-5 flex flex-col gap-5">

        {/* Stats — variant/SKU-level, distinct from the Products list's
            product-level stats card (a product with 3 variants counts as
            3 lines here, 1 product there — both are correct for their own
            view). */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Total SKUs"   value={stats?.totalLines ?? 0}   icon={<ShoppingBag size={16} />}   loading={loading && !stats} />
          <MetricCard label="In Stock"     value={stats?.inStock ?? 0}      icon={<CheckCircle2 size={16} />}  loading={loading && !stats} />
          <MetricCard label="Low Stock"    value={stats?.lowStock ?? 0}     icon={<AlertTriangle size={16} />} loading={loading && !stats} />
          <MetricCard label="Out of Stock" value={stats?.outOfStock ?? 0}   icon={<XCircle size={16} />}       loading={loading && !stats} />
        </div>

        {/* Low stock detail */}
        {!!lowStock?.count && (
          <Card padding="none">
            <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-[#f3f2ec]">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <p className="text-[13px] font-bold text-charcoal">
                {lowStock.count} product{lowStock.count !== 1 ? 's' : ''} running low
              </p>
              <span className="text-[11px] text-slate ml-1">(≤ {lowStock.threshold} units left)</span>
              <button
                onClick={() => navigate(`/store/${storeId}/reorder-suggestions`)}
                className="ml-auto text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer"
              >
                Reorder →
              </button>
            </div>
            <div className="px-5 py-3 flex flex-col divide-y divide-[#f3f2ec]">
              {(lowStock.items ?? []).slice(0, 5).map(item => (
                <button
                  key={item.productId}
                  onClick={() => navigate(`/store/${storeId}/products/edit/${item.productId}`)}
                  className="flex items-center justify-between gap-3 py-2 bg-transparent border-none text-left cursor-pointer group"
                >
                  <span className="text-[13px] text-charcoal group-hover:text-brand-orange transition-colors">{item.name}</span>
                  <Badge color="orange">{item.stock} left</Badge>
                </button>
              ))}
              {(lowStock.items ?? []).length > 5 && (
                <p className="text-[11px] text-slate pt-2">+ {(lowStock.items ?? []).length - 5} more</p>
              )}
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{error}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 rounded-sm"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <Card padding="none">
            <div className="px-5 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[14px] font-bold text-charcoal shrink-0">All Stock (per SKU)</p>
              <div className="flex items-center gap-2 sm:ml-auto">
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as StockLineStatusFilter | ''); setPage(1); }}
                  className="border border-bone rounded-[8px] px-2.5 py-2 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 shrink-0"
                >
                  <option value="">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="unlimited">Unlimited</option>
                </select>
                <SearchInput
                  value={search}
                  onChange={value => { setSearch(value); setPage(1); }}
                  placeholder="Search by name or SKU…"
                  className="w-full sm:w-[220px]"
                />
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-[6px] transition-colors duration-150 hover:bg-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 shrink-0"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <SkeletonBox width={36} height={36} rounded="8px" />
                    <SkeletonBox width="35%" height={13} />
                    <SkeletonBox width="10%" height={13} className="ml-auto" />
                    <SkeletonBox width="10%" height={13} />
                    <SkeletonBox width={70}  height={22} rounded="999px" />
                    <SkeletonBox width={90}  height={26} rounded="7px" />
                  </div>
                ))}
              </div>
            ) : lines.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={30} className="text-brand-orange opacity-55" />}
                title={search ? 'No SKUs match your search' : 'No stock to track yet'}
                description={
                  search
                    ? 'Try a different name or SKU.'
                    : 'Add a physical product to start tracking its stock here.'
                }
              />
            ) : (
              <Table
                columns={columns}
                data={lines}
                keyExtractor={l => l.variantId}
                pagination={{
                  page,
                  total,
                  perPage:  LIMIT,
                  onChange: handlePageChange,
                  label:    'SKUs',
                }}
              />
            )}
          </Card>
        )}

      </div>

      {/* ── Adjust stock modal ──────────────────────────────────────────── */}
      {adjustTarget && (
        <Modal title="Adjust stock" onClose={() => setAdjustTarget(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdjustSubmit} loading={adjusting}>Save Adjustment</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{adjustTarget.productName}</p>
              <p className="text-[12px] text-slate">SKU: {adjustTarget.sku} · Current stock: {adjustTarget.stock} units</p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Reason</label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value as StockAdjustmentReason)}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              >
                {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {isBucketOnlyReason && (
                <p className="text-[11px] text-slate mt-1.5">
                  {adjustReason === 'damaged'
                    ? 'Moves units out of the sellable pool — on-hand stock stays the same, they just stop counting toward "Available".'
                    : 'Permanently discards units already in the damaged pool.'}
                </p>
              )}
            </div>

            {hasMultipleLocations && !isBucketOnlyReason && (
              <div>
                <label className="text-[12px] font-medium text-graphite mb-1 block">Location</label>
                {adjustBreakdownLoading ? (
                  <SkeletonBox height={38} rounded="8px" />
                ) : (
                  <select
                    value={adjustLocationId}
                    onChange={e => setAdjustLocationId(e.target.value)}
                    className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  >
                    {(adjustBreakdown?.locations ?? []).map(l => (
                      <option key={l.locationId} value={l.locationId}>{l.locationName} — {l.stock} units</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!isBucketOnlyReason && (
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustDirection('add')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-medium cursor-pointer border transition-colors ${adjustDirection === 'add' ? 'bg-success/10 border-success text-success' : 'bg-white border-bone text-slate hover:bg-cream'}`}
                >
                  <PlusCircle size={14} /> Add stock
                </button>
                <button
                  onClick={() => setAdjustDirection('remove')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-medium cursor-pointer border transition-colors ${adjustDirection === 'remove' ? 'bg-error-bg border-error text-error' : 'bg-white border-bone text-slate hover:bg-cream'}`}
                >
                  <MinusCircle size={14} /> Remove stock
                </button>
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">
                Quantity {isBucketOnlyReason && (adjustReason === 'damaged' ? 'to mark damaged' : 'to write off')}
              </label>
              <input
                type="number"
                min={1}
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                placeholder="e.g. 10"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Note (optional)</label>
              <textarea
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                rows={2}
                placeholder="Any extra detail…"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>

            {adjustError && <p className="text-[12px] text-error">{adjustError}</p>}
          </div>
        </Modal>
      )}

      {/* ── Stock history modal ─────────────────────────────────────────── */}
      {historyTarget && (
        <Modal title="Stock history" onClose={() => setHistoryTarget(null)} footer={
          <Button variant="ghost" onClick={() => setHistoryTarget(null)}>Close</Button>
        }>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{historyTarget.productName}</p>
              <p className="text-[12px] text-slate">SKU: {historyTarget.sku}</p>
            </div>

            {historyLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={40} rounded="8px" />)}
              </div>
            ) : historyError ? (
              <p className="text-[12px] text-error">{historyError}</p>
            ) : historyItems.length === 0 ? (
              <p className="text-[12px] text-slate py-4 text-center">No adjustments recorded yet for this SKU.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#f3f2ec] max-h-[340px] overflow-y-auto">
                {historyItems.map(item => (
                  <div key={item._id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] text-charcoal">
                        <span className={`font-semibold ${item.delta > 0 ? 'text-success' : 'text-error'}`}>
                          {item.delta > 0 ? '+' : ''}{item.delta}
                        </span>
                        {' '}({REASON_OPTIONS.find(r => r.value === item.reason)?.label ?? item.reason})
                      </p>
                      {item.note && <p className="text-[11px] text-slate mt-0.5">{item.note}</p>}
                      <p className="text-[11px] text-slate mt-0.5">
                        {item.previousStock} → {item.newStock} units
                        {item.adjustedByName ? ` · by ${item.adjustedByName}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate shrink-0">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Ship transfer modal (only reachable when 2+ locations) — step 1
           of 2: this only SHIPS the stock (leaves the source right away).
           It doesn't land at the destination until someone receives it
           there via the Transfers panel below, once it actually arrives. ── */}
      {transferTarget && (
        <Modal title="Ship stock to another location" onClose={() => setTransferTarget(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleTransferSubmit} loading={transferring}>Ship</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{transferTarget.productName}</p>
              <p className="text-[12px] text-slate">SKU: {transferTarget.sku}</p>
            </div>

            {!transferBreakdown ? (
              <SkeletonBox height={80} rounded="8px" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-graphite mb-1 block">From</label>
                    <select
                      value={transferFrom}
                      onChange={e => setTransferFrom(e.target.value)}
                      className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    >
                      {transferBreakdown.locations.map(l => (
                        <option key={l.locationId} value={l.locationId}>{l.locationName} ({l.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-graphite mb-1 block">To</label>
                    <select
                      value={transferTo}
                      onChange={e => setTransferTo(e.target.value)}
                      className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    >
                      {transferBreakdown.locations.map(l => (
                        <option key={l.locationId} value={l.locationId}>{l.locationName} ({l.stock})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-graphite mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={transferQty}
                    onChange={e => setTransferQty(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-graphite mb-1 block">Note (optional)</label>
                  <textarea
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    rows={2}
                    placeholder="Any extra detail…"
                    className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
              </>
            )}

            <p className="text-[11px] text-slate">
              Shipped stock moves to "in transit" immediately — it won't count toward the destination's
              stock until someone receives it there from the Transfers panel.
            </p>

            {transferError && <p className="text-[12px] text-error">{transferError}</p>}
          </div>
        </Modal>
      )}

      {/* ── Transfers panel — step 2 of 2: everything currently in transit,
           with Receive (partial or full) and Cancel actions. ─────────────── */}
      {transfersModalOpen && (
        <Modal title="In-Transit Transfers" onClose={() => setTransfersModalOpen(false)} footer={
          <Button variant="ghost" onClick={() => setTransfersModalOpen(false)}>Close</Button>
        }>
          <div className="flex flex-col gap-3">
            {transfersLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={70} rounded="8px" />)}
              </div>
            ) : transfersError ? (
              <p className="text-[12px] text-error">{transfersError}</p>
            ) : transfersList.length === 0 ? (
              <p className="text-[12px] text-slate py-4 text-center">Nothing in transit right now.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#f3f2ec] max-h-[420px] overflow-y-auto">
                {transfersList.map(t => {
                  const remaining = t.quantity - t.receivedQuantity;
                  return (
                    <div key={t._id} className="py-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-charcoal truncate">{t.productName}</p>
                          <p className="text-[11px] text-slate">
                            SKU: {t.sku} · {t.fromLocationName} → {t.toLocationName}
                          </p>
                          <p className="text-[11px] text-slate">
                            {t.receivedQuantity} / {t.quantity} received · {remaining} remaining
                          </p>
                        </div>
                        <Badge color={TRANSFER_STATUS_META[t.status].color}>{TRANSFER_STATUS_META[t.status].label}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={remaining}
                          placeholder={String(remaining)}
                          value={receiveQtyById[t._id] ?? ''}
                          onChange={e => setReceiveQtyById(prev => ({ ...prev, [t._id]: e.target.value }))}
                          className="w-24 border border-bone rounded-[7px] px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                        />
                        <Button variant="secondary" onClick={() => handleReceiveTransfer(t)} loading={receivingId === t._id}>Receive</Button>
                        {t.status === 'in_transit' && (
                          <button
                            onClick={() => handleCancelTransfer(t)}
                            disabled={receivingId === t._id}
                            className="text-[11px] font-medium text-error bg-transparent border-none cursor-pointer ml-auto disabled:opacity-50"
                          >
                            Cancel transfer
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {transferActionError && <p className="text-[12px] text-error">{transferActionError}</p>}
          </div>
        </Modal>
      )}

      {/* ── Reorder point / cost price modal ────────────────────────────── */}
      {settingsTarget && (
        <Modal title="Reorder point & cost" onClose={() => setSettingsTarget(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setSettingsTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSettings} loading={savingSettings}>Save</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{settingsTarget.productName}</p>
              <p className="text-[12px] text-slate">SKU: {settingsTarget.sku}</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Reorder point</label>
              <input
                type="number" min={0} value={reorderPointInput}
                onChange={e => setReorderPointInput(e.target.value)}
                placeholder={`Store default (${store?.lowStockThreshold ?? 10})`}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
              <p className="text-[11px] text-slate mt-1">Leave blank to use the store's default low-stock threshold.</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Cost price {currencySymbol(store?.baseCurrency)}</label>
              <input
                type="number" min={0} step="0.01" value={costPriceInput}
                onChange={e => setCostPriceInput(e.target.value)}
                placeholder="Not set"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
              <p className="text-[11px] text-slate mt-1">Used for inventory valuation — auto-updates when you receive a Purchase Order.</p>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-bone">
              <div>
                <p className="text-[13px] font-medium text-charcoal">Continue selling when out of stock</p>
                <p className="text-[11px] text-slate">Checkout never blocks on this SKU — an oversold order is flagged "backordered".</p>
              </div>
              <Toggle checked={allowBackorderInput} onChange={setAllowBackorderInput} ariaLabel="Continue selling when out of stock" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-charcoal">Track batch/lot numbers</p>
                <p className="text-[11px] text-slate">Real FIFO cost + expiry per receipt, instead of one blended average cost.</p>
              </div>
              <Toggle checked={trackLotsInput} onChange={setTrackLotsInput} ariaLabel="Track batch/lot numbers" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-charcoal">Track serial numbers</p>
                <p className="text-[11px] text-slate">One real serial per unit received — for high-value/electronics SKUs.</p>
              </div>
              <Toggle checked={trackSerialsInput} onChange={setTrackSerialsInput} ariaLabel="Track serial numbers" />
            </div>
            {settingsError && <p className="text-[12px] text-error">{settingsError}</p>}
          </div>
        </Modal>
      )}

      {/* ── CSV import result ────────────────────────────────────────────── */}
      {csvImportResult && (
        <Modal title="Stock CSV Import" onClose={() => setCsvImportResult(null)} footer={
          <Button variant="ghost" onClick={() => setCsvImportResult(null)}>Close</Button>
        }>
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-charcoal">
              <span className="font-semibold">{csvImportResult.updatedCount}</span> of {csvImportResult.totalRows} SKU{csvImportResult.totalRows !== 1 ? 's' : ''} reconciled successfully.
            </p>
            {csvImportResult.failed.length > 0 && (
              <div className="flex flex-col divide-y divide-[#f3f2ec] max-h-[260px] overflow-y-auto border border-bone rounded-lg">
                {csvImportResult.failed.map((f, i) => (
                  <div key={i} className="px-3 py-2 text-[11.5px]">
                    <span className="font-semibold text-charcoal">Row {f.row} ({f.sku})</span>
                    <span className="text-error"> — {f.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Manage Locations modal ──────────────────────────────────────── */}
      {locationsModalOpen && (
        <Modal title="Manage Locations" onClose={() => setLocationsModalOpen(false)} footer={
          <Button variant="ghost" onClick={() => setLocationsModalOpen(false)}>Close</Button>
        }>
          <div className="flex flex-col gap-4">
            <p className="text-[12px] text-slate">
              Add a physical branch/warehouse to start tracking stock per-location. A single location
              behaves exactly like before — location tracking only turns on once you add a second one.
            </p>

            {locationsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={44} rounded="8px" />)}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#f3f2ec]">
                {allLocations.filter(l => l.status === 'active').map(loc => (
                  <div key={loc._id} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-charcoal flex items-center gap-1.5">
                          {loc.name}
                          <Badge color={loc.type === 'warehouse' ? 'blue' : 'green'}>{loc.type === 'warehouse' ? 'Warehouse' : 'Store'}</Badge>
                          {loc.isDefault ? <span className="text-[10.5px] text-slate">(default)</span> : null}
                        </p>
                        {loc.city && <p className="text-[11px] text-slate">{loc.city}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBins(loc._id)}
                          className="text-[11px] font-medium text-brand-deep-orange bg-transparent border-none cursor-pointer hover:underline"
                        >
                          {binsOpenFor === loc._id ? 'Hide bins' : 'Bins'}{binsByLocation[loc._id]?.length ? ` (${binsByLocation[loc._id].length})` : ''}
                        </button>
                        <button
                          onClick={() => handleArchiveLocation(loc._id)}
                          title="Archive location"
                          className="flex items-center justify-center w-[26px] h-[26px] text-error border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {binsOpenFor === loc._id && (
                      <div className="mt-2 ml-2 pl-3 border-l-2 border-bone flex flex-col gap-2">
                        {binsLoading && !binsByLocation[loc._id] ? (
                          <SkeletonBox height={28} rounded="6px" />
                        ) : (
                          <>
                            {(binsByLocation[loc._id] ?? []).map(bin => (
                              <div key={bin._id} className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-charcoal">{bin.code}{bin.zone || bin.aisle || bin.shelf ? ` — ${[bin.zone, bin.aisle, bin.shelf].filter(Boolean).join(' / ')}` : ''}</span>
                                <button onClick={() => handleDeleteBin(loc._id, bin._id)} className="text-error bg-transparent border-none cursor-pointer" title="Delete bin">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            {(binsByLocation[loc._id] ?? []).length === 0 && <p className="text-[11px] text-slate">No bins yet at this location.</p>}
                            <div className="flex gap-1.5">
                              <input
                                value={newBinCode}
                                onChange={e => setNewBinCode(e.target.value)}
                                placeholder="Bin code (e.g. A3-B2)"
                                className="flex-1 border border-bone rounded-[6px] px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                              />
                              <Button size="xs" variant="secondary" onClick={() => handleAddBin(loc._id)} loading={addingBin}>Add</Button>
                            </div>
                            {binsError && <p className="text-[11px] text-error">{binsError}</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {allLocations.filter(l => l.status === 'active').length === 0 && (
                  <p className="text-[12px] text-slate py-2">No locations yet — add your first one below.</p>
                )}
              </div>
            )}

            <div className="border-t border-[#f3f2ec] pt-4 flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-charcoal">Add a location</p>
              <input
                value={newLocationName}
                onChange={e => setNewLocationName(e.target.value)}
                placeholder="Location name (e.g. North Karachi)"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
              <input
                value={newLocationCity}
                onChange={e => setNewLocationCity(e.target.value)}
                placeholder="City (optional)"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNewLocationType('store')}
                  className={`flex-1 rounded-[8px] py-2 text-[12.5px] font-medium cursor-pointer border transition-colors ${newLocationType === 'store' ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'bg-white border-bone text-slate hover:bg-cream'}`}
                >
                  Store (retail/POS)
                </button>
                <button
                  onClick={() => setNewLocationType('warehouse')}
                  className={`flex-1 rounded-[8px] py-2 text-[12.5px] font-medium cursor-pointer border transition-colors ${newLocationType === 'warehouse' ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'bg-white border-bone text-slate hover:bg-cream'}`}
                >
                  Warehouse (fulfillment)
                </button>
              </div>
              <Button variant="secondary" onClick={handleAddLocation} loading={addingLocation}>Add Location</Button>
              {locationsError && <p className="text-[12px] text-error">{locationsError}</p>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
