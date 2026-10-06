import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Plus, Download,
  AlertCircle, RefreshCw, TrendingUp,
  Eye, Pencil, Trash2, Copy,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader, hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import {
  Table,      type TableColumn, type TableSort,
  Badge,      StatusBadge,
  EmptyState,
  Card,
  SearchInput,
  FilterDropdown,
  SkeletonBox,
  ActionMenu,
  Modal,
  Button,
} from '@/components/comman/ui';
import {
  apiGetStoreInventory,
  apiDeleteProduct,
  apiDuplicateProduct,
  apiExportProductsCsv,
  type InventoryProduct,
} from '@/api/services/product';
import { currencySymbol } from '@/utils/currency';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { BulkActionsBar } from './BulkActionsBar';
import { BulkEditModal } from './BulkEditModal';
import { BULK_EDIT_MAX_PRODUCTS, type BulkTarget } from '@/api/services/productsBulk';
import { ProductCell, ProductStatsGrid } from '../../components/ProductListShared';

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoreProductList() {
  const navigate    = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const [products,      setProducts]      = useState<InventoryProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [stats,         setStats]         = useState<{ totalProducts: number; inStock: number; lowStock: number; outOfStock: number } | null>(null);
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [deleteTarget,  setDeleteTarget]  = useState<InventoryProduct | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const LIMIT = 25;
  const [refreshKey, setRefreshKey] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Search, status filter, pagination and the Product (title) sort are all
  // server-side. Other column sorts only reorder the loaded page.
  const [sort, setSort] = useState<TableSort | null>(null);
  const serverSort: 'title_asc' | 'title_desc' | undefined =
    sort?.key === 'name' ? (sort.direction === 'asc' ? 'title_asc' : 'title_desc') : undefined;

  // Bulk selection: explicit page ids, or "all matching" mode (selectAll).
  const [selected,  setSelected]  = useState<Set<string | number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const clearSelection = () => { setSelected(new Set()); setSelectAll(false); };
  const clearSelectionRef = useRef(clearSelection);
  clearSelectionRef.current = clearSelection;
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [editLimited, setEditLimited] = useState(false);

  const user = TokenStorage.getUser();
  const canEdit      = hasNavPermission(user, 'products.edit');
  const canEditPrice = hasNavPermission(user, 'products.edit_price');
  const canDelete    = hasNavPermission(user, 'products.delete');
  // Product creation is a seller-only route on the backend, so is import.
  const canImport    = user?.role !== 'staff';

  const handleSortChange = (key: string) => {
    clearSelection();
    setSort(prev => (prev && prev.key === key)
      ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  };

  useEffect(() => {
    if (search === debouncedSearch) return;
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      clearSelectionRef.current();
    }, 300);
    return () => clearTimeout(id);
  }, [search, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetStoreInventory(storeId, page, LIMIT, { q: debouncedSearch, status: statusFilter || undefined, sort: serverSort })
      .then(res => {
        if (cancelled) return;
        setProducts(res.data.products ?? []);
        setStats(res.data.stats);
        setTotalProducts(res.data.pagination.totalProducts);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, refreshKey, debouncedSearch, statusFilter, serverSort]);

  const goAdd    = () => navigate(`/store/${storeId}/products/add`);
  const goEdit   = (p: InventoryProduct) => navigate(`/store/${storeId}/products/edit/${p.productId}`);
  const goDetail = (p: InventoryProduct) => navigate(`/store/${storeId}/products/detail/${p.productId}`);

  const handlePageChange = (p: number) => {
    setLoading(true);
    setError('');
    clearSelection();
    setPage(p);
  };

  const handleStatusFilter = (v: string) => {
    clearSelection();
    setStatusFilter(v);
    setPage(1);
  };

  const bulkTarget: BulkTarget = selectAll
    ? { selectAll: true, filter: { q: debouncedSearch.trim() || undefined, status: statusFilter || undefined } }
    : { productIds: [...selected].map(String) };
  const bulkCount = selectAll ? totalProducts : selected.size;
  const pageAllSelected = products.length > 0 && products.every(p => selected.has(p.productId));

  const handleOpenEditor = async () => {
    if (!selectAll) { setEditLimited(false); setEditIds([...selected].map(String)); return; }
    const res = await apiGetStoreInventory(storeId, 1, BULK_EDIT_MAX_PRODUCTS, { q: debouncedSearch, status: statusFilter || undefined, sort: serverSort });
    setEditLimited(res.data.pagination.totalProducts > BULK_EDIT_MAX_PRODUCTS);
    setEditIds(res.data.products.map(p => p.productId));
  };

  const handleBulkDone = () => { clearSelection(); setRefreshKey(k => k + 1); };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRefreshKey(k => k + 1);
  };

  const [exporting, setExporting] = useState(false);
  const handleExportCsv = () => {
    setExporting(true);
    setError('');
    apiExportProductsCsv(storeId)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to export products.'))
      .finally(() => setExporting(false));
  };

  // Real "Duplicate" — was missing entirely (see the Catalog audit). Lands
  // the seller straight on the new draft's Edit page, same as clicking
  // "Duplicate" on Shopify's own product list does.
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const handleDuplicate = async (p: InventoryProduct) => {
    setDuplicatingId(p.productId);
    setError('');
    try {
      const res = await apiDuplicateProduct(p.productId);
      navigate(`/store/${storeId}/products/edit/${res.data._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate product.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDeleteProduct(deleteTarget.productId);
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const sorted = sort && sort.key !== 'name'
    ? [...products].sort((a, b) => {
        const av = a[sort.key as keyof InventoryProduct];
        const bv = b[sort.key as keyof InventoryProduct];
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''));
        return sort.direction === 'asc' ? cmp : -cmp;
      })
    : products;

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: TableColumn<InventoryProduct>[] = [
    {
      key: 'no', header: '#', width: '48px',
      render: (_, i) => (
        <span className="text-[12px] text-slate font-medium">
          {(page - 1) * LIMIT + i + 1}
        </span>
      ),
    },
    {
      key: 'name', header: 'Product', sortable: true,
      render: p => <ProductCell p={p} />,
    },
    {
      key: 'type', header: 'Type',
      render: p => (
        <Badge color={p.type === 'digital' ? 'blue' : 'orange'}>
          {p.type === 'digital' ? (p.productType === 'educational' ? 'Educational' : 'Digital') : 'Physical'}
        </Badge>
      ),
    },
    {
      key: 'price', header: 'Price', align: 'right', sortable: true,
      render: p => (
        <span className="font-semibold text-charcoal">
          {currencySymbol(store?.baseCurrency)}{p.price.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'stock', header: 'Stock', align: 'right', sortable: true,
      render: p => (
        <span className="text-[13px] text-carbon">
          {typeof p.stock === 'number' ? `${p.stock} units` : p.stock}
        </span>
      ),
    },
    {
      key: 'allTimeSales', header: 'Sales', align: 'right', sortable: true,
      render: p => (
        <div className="flex items-center justify-end gap-1 text-[12px] text-slate">
          <TrendingUp size={12} className="text-success shrink-0" />
          {p.allTimeSales}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: p => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions', header: 'Actions', align: 'center', width: '80px',
      render: p => (
        <ActionMenu
          align="right"
          items={[
            { label: 'View Detail',    onClick: () => goDetail(p),                icon: <Eye    size={13} /> },
            { label: 'Edit Product',   onClick: () => goEdit(p),                  icon: <Pencil size={13} /> },
            { label: duplicatingId === p.productId ? 'Duplicating…' : 'Duplicate', onClick: () => handleDuplicate(p), icon: <Copy size={13} />, disabled: duplicatingId === p.productId },
            { label: 'Delete Product', onClick: () => { setDeleteError(''); setDeleteTarget(p); }, icon: <Trash2 size={13} />, danger: true },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Products"
        subtitle={loading ? 'Loading…' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {canImport && (
              <>
                <BulkImportButton
                  entityLabel="products"
                  basePath={`/api/products/store-products/${storeId}`}
                  onImported={() => setRefreshKey(k => k + 1)}
                  notes={[
                    'SKU is the key: a row whose SKU already exists updates that product (blank cells are left unchanged; stock is never changed here).',
                    'Category must match one of your store categories. Status is active or draft.',
                    'To change stock use Inventory > Import. To add variants use Import variants.',
                  ]}
                />
                <BulkImportButton
                  label="Import variants"
                  entityLabel="variants"
                  basePath={`/api/products/store-products/${storeId}/variants`}
                  onImported={() => setRefreshKey(k => k + 1)}
                  notes={[
                    'Find the product by Product SKU (any existing variant SKU of it); Product Name is only a fallback and must be unique.',
                    'A new variant must use the same option names as the product already uses.',
                    'A variant SKU that already exists only gets its price / compare-at price updated.',
                  ]}
                />
              </>
            )}
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
            </button>
            <button
              onClick={goAdd}
              className="flex items-center gap-1.5 bg-brand-orange text-white border-none rounded-[9px] px-4 py-[9px] text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-brand-deep-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-2"
            >
              <Plus size={15} /> Add Product
            </button>
          </div>
        }
      />

      <div className="px-7 py-5 flex flex-col gap-5">

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <ProductStatsGrid stats={stats} loading={loading} />

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{error}</span>
            <button
              onClick={() => handleRetry()}
              className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer rounded-xs transition-opacity duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-1"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ── Table card ─────────────────────────────────────────────── */}
        {!error && (
          <Card padding="none">
            {/* Toolbar */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
              <p className="text-[14px] font-bold text-charcoal shrink-0">All Products</p>
              <div className="flex items-center gap-2 ml-auto">
                <FilterDropdown
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  placeholder="All statuses"
                  options={[
                    { value: 'active',   label: 'Active' },
                    { value: 'draft',    label: 'Draft' },
                    { value: 'inactive', label: 'Archived' },
                  ]}
                />
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search title, tag, SKU or barcode…"
                  className="w-[220px]"
                />
                <button
                  onClick={() => handleRetry()}
                  className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-[6px] transition-colors duration-150 hover:bg-bone shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-1"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </div>

            {/* Table or skeleton or empty */}
            {loading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-4 py-[13px]${i < 4 ? ' border-b border-[#f0eee6]' : ''}`}
                  >
                    <SkeletonBox width={32} height={32} rounded="8px" />
                    <SkeletonBox width="35%" height={13} />
                    <SkeletonBox width="10%" height={13} className="ml-auto" />
                    <SkeletonBox width="10%" height={13} />
                    <SkeletonBox width="8%"  height={13} />
                    <SkeletonBox width={60}  height={22} rounded="999px" />
                    <SkeletonBox width={80}  height={13} />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={30} className="text-brand-orange opacity-55" />}
                title={search || statusFilter ? 'No products match your search' : 'No products yet'}
                description={search || statusFilter ? 'Try a different search or filter.' : 'Add physical items, digital downloads, or services to start selling.'}
                action={search || statusFilter ? undefined : { label: 'Add Your First Product', onClick: goAdd, icon: <Plus size={15} /> }}
              />
            ) : (
              <>
              {selected.size > 0 && (
                <BulkActionsBar
                  storeId={storeId}
                  count={bulkCount}
                  target={bulkTarget}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEditProducts={handleOpenEditor}
                  onClear={clearSelection}
                  onDone={handleBulkDone}
                />
              )}
              {pageAllSelected && totalProducts > products.length && (
                <div className="px-5 py-2 text-[12px] text-charcoal bg-cream border-b border-bone text-center">
                  {selectAll ? (
                    <>All {totalProducts.toLocaleString()} products are selected.{' '}
                      <button type="button" className="text-brand-orange font-semibold underline bg-transparent border-0 cursor-pointer p-0" onClick={clearSelection}>Clear selection</button></>
                  ) : (
                    <>All {products.length} products on this page are selected.{' '}
                      <button type="button" className="text-brand-orange font-semibold underline bg-transparent border-0 cursor-pointer p-0" onClick={() => setSelectAll(true)}>Select all {totalProducts.toLocaleString()} products</button></>
                  )}
                </div>
              )}
              <Table
                columns={columns}
                data={sorted}
                keyExtractor={p => p.productId}
                sort={sort ?? undefined}
                onSortChange={handleSortChange}
                selectable={canEdit || canDelete}
                selectedKeys={selected}
                onSelectionChange={keys => { setSelectAll(false); setSelected(keys); }}
                pagination={{
                  page,
                  total:    totalProducts,
                  perPage:  LIMIT,
                  onChange: handlePageChange,
                  label:    'products',
                }}
              />
              </>
            )}
          </Card>
        )}

      </div>

      {editIds && (
        <BulkEditModal
          storeId={storeId}
          productIds={editIds}
          currencyLabel={currencySymbol(store?.baseCurrency)}
          canEditPrice={canEditPrice}
          limited={editLimited}
          onClose={() => setEditIds(null)}
          onSaved={handleBulkDone}
        />
      )}

      {deleteTarget && (
        <Modal title="Delete this product?" onClose={() => setDeleteTarget(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>Delete Product</Button>
          </>
        }>
          <p className="text-[13px] text-slate">
            <span className="font-semibold text-charcoal">{deleteTarget.name}</span> will be removed from your store and the marketplace. This can't be undone.
          </p>
          {deleteError && (
            <p className="text-[12px] text-error mt-3">{deleteError}</p>
          )}
        </Modal>
      )}

    </>
  );
}
