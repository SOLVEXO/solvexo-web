import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Download,
  AlertCircle, RefreshCw,
  AlertTriangle, History, PlusCircle, MinusCircle,
  CheckCircle2, XCircle, Package, MapPin, ArrowLeftRight, Trash2,
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
  apiTransferStock,
  type LowStockSummaryData,
  type StockLine,
  type StockAdjustment,
  type StockAdjustmentReason,
  type StoreLocation,
  type VariantLocationBreakdown,
} from '@/api/services/product';
import { currencySymbol } from '@/utils/currency';

const STATUS_META: Record<StockLine['status'], { label: string; color: 'green' | 'orange' | 'red' | 'blue' }> = {
  in_stock:     { label: 'In Stock',     color: 'green'  },
  low_stock:    { label: 'Low Stock',    color: 'orange' },
  out_of_stock: { label: 'Out of Stock', color: 'red'    },
  unlimited:    { label: 'Unlimited',    color: 'blue'   },
};

const REASON_OPTIONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: 'restocked',  label: 'Restocked'          },
  { value: 'damaged',    label: 'Damaged'            },
  { value: 'return',     label: 'Return'             },
  { value: 'correction', label: 'Count Correction'   },
  { value: 'other',      label: 'Other'              },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export function StoreInventory() {
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

  const LIMIT = 20;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    apiGetStockLines(storeId, page, LIMIT, debouncedSearch)
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
  }, [storeId, page, refreshKey, debouncedSearch]);

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

  const handleAdjustSubmit = async () => {
    if (!adjustTarget) return;
    const qty = parseInt(adjustQty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError('Enter a quantity greater than 0');
      return;
    }
    if (hasMultipleLocations && !adjustLocationId) {
      setAdjustError('Select which location this stock change applies to');
      return;
    }
    const delta = adjustDirection === 'add' ? qty : -qty;
    setAdjusting(true);
    setAdjustError('');
    try {
      await apiAdjustStock(storeId, adjustTarget.variantId, delta, adjustReason, adjustNote, hasMultipleLocations ? adjustLocationId : undefined);
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
      await apiTransferStock(storeId, transferTarget.variantId, transferFrom, transferTo, qty, transferNote);
      setTransferTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : 'Failed to transfer stock.');
    } finally {
      setTransferring(false);
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
      await apiCreateLocation(storeId, { name: newLocationName.trim(), city: newLocationCity.trim() || undefined });
      setNewLocationName('');
      setNewLocationCity('');
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
          {/* Committed only shown when non-zero — the common case (no
              pending unshipped orders on this SKU) stays exactly as simple
              as before this existed. */}
          {!l.unlimitedStock && l.committedStock > 0 && (
            <p className="text-[10.5px] text-slate">{l.stock} on hand · {l.committedStock} reserved</p>
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
              title="Transfer between locations"
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
        </div>
      ),
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Inventory"
        subtitle={loading ? 'Loading…' : `${total} SKU${total !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              title="Manage Locations"
              onClick={openLocationsModal}
              className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
            >
              <MapPin size={14} />
              <span className="hidden sm:inline">Locations{activeLocations.length > 0 ? ` (${activeLocations.length})` : ''}</span>
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
          </div>
        }
      />

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

            {hasMultipleLocations && (
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

            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Quantity</label>
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
              <label className="text-[12px] font-medium text-graphite mb-1 block">Reason</label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value as StockAdjustmentReason)}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              >
                {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
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

      {/* ── Transfer stock modal (only reachable when 2+ locations) ─────── */}
      {transferTarget && (
        <Modal title="Transfer stock" onClose={() => setTransferTarget(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleTransferSubmit} loading={transferring}>Transfer</Button>
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

            {transferError && <p className="text-[12px] text-error">{transferError}</p>}
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
                  <div key={loc._id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-charcoal">
                        {loc.name}{loc.isDefault ? <span className="text-[10.5px] text-slate ml-1.5">(default)</span> : null}
                      </p>
                      {loc.city && <p className="text-[11px] text-slate">{loc.city}</p>}
                    </div>
                    <button
                      onClick={() => handleArchiveLocation(loc._id)}
                      title="Archive location"
                      className="flex items-center justify-center w-[26px] h-[26px] text-error border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                    >
                      <Trash2 size={13} />
                    </button>
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
              <Button variant="secondary" onClick={handleAddLocation} loading={addingLocation}>Add Location</Button>
              {locationsError && <p className="text-[12px] text-error">{locationsError}</p>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
