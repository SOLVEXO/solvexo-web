import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, PackageSearch, PackageX } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import { apiGetPosProducts, apiSearchPosProducts, type PosProduct } from '@/api/services/pos/posProducts';
import { usePosSession } from '../context/PosSessionContext';
import { DarkSkeleton, DarkEmptyState } from './manage/darkUi';

interface FlatRow {
  productId: string;
  variantId: string;
  name:      string;
  sku:       string;
  image:     string | null;
  price:     number;
  stock:     number;
}

function flatten(products: PosProduct[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const p of products ?? []) {
    for (const v of p.variants ?? []) {
      rows.push({ productId: p.productId, variantId: v.variantId, name: p.name, sku: v.sku, image: p.image, price: v.price, stock: v.stock });
    }
  }
  return rows;
}

export function ProductsTab() {
  const { storeId } = usePosSession();
  const navigate = useNavigate();

  const [rows, setRows]         = useState<FlatRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const q = search.trim();
    const timer = setTimeout(() => {
      const request = q
        ? apiSearchPosProducts(storeId, q).then(res => ({ items: res.data ?? [], totalPages: 1 }))
        : apiGetPosProducts(storeId, { page, limit: 30 }).then(res => ({ items: res.data.products ?? [], totalPages: res.data.pagination.totalPages }));

      request
        .then(({ items, totalPages: tp }) => { if (!cancelled) { setRows(flatten(items)); setTotalPages(tp); } })
        .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, q ? 300 : 0);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [storeId, page, search]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-[10px] mb-5">
        <p className="text-[16px] font-bold text-white flex-1">Product Catalog</p>
        <div className="relative w-full sm:w-auto">
          <Search size={13} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-pos-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search SKU or name..."
            className="w-full sm:w-auto bg-pos-surface border border-carbon rounded-lg pl-[30px] pr-[14px] py-2 text-[13px] text-white outline-none transition-colors focus:border-brand-orange"
          />
        </div>
        <button
          onClick={() => navigate(`/seller/store/${storeId}/products/add`)}
          className="flex items-center justify-center gap-[6px] px-4 py-2 bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-colors hover:bg-brand-deep-orange"
        >
          <Plus size={13} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['SKU', 'Product', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon text-pos-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-carbon">
                  <td className="px-4 py-[10px]"><DarkSkeleton height={12} className="w-14" /></td>
                  <td className="px-4 py-[10px]">
                    <div className="flex items-center gap-2">
                      <DarkSkeleton height={24} className="w-6 shrink-0" />
                      <DarkSkeleton height={12} className="w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-[10px]"><DarkSkeleton height={12} className="w-12" /></td>
                  <td className="px-4 py-[10px]"><DarkSkeleton height={12} className="w-16" /></td>
                  <td className="px-4 py-[10px]"><DarkSkeleton height={18} className="w-20 rounded-full" /></td>
                  <td className="px-4 py-[10px]"><DarkSkeleton height={22} className="w-12" /></td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={6}>
                <DarkEmptyState icon={<PackageX size={22} className="text-error" />} title="Couldn't load products" description={error} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6}>
                <DarkEmptyState
                  icon={<PackageSearch size={22} className="text-pos-muted" />}
                  title={search ? 'No products match your search' : 'No products yet'}
                  description={search ? 'Try a different SKU or name.' : 'Add your first product to start selling in-store.'}
                  action={search ? undefined : { label: 'Add Product', onClick: () => navigate(`/seller/store/${storeId}/products/add`) }}
                />
              </td></tr>
            ) : rows.map(row => (
              <tr key={row.variantId} className="pos-item-enter border-b border-carbon transition-colors hover:bg-carbon/40">
                <td className="px-4 py-[10px]">
                  <span className="text-[11px] font-mono text-pos-muted">{row.sku}</span>
                </td>
                <td className="px-4 py-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-carbon overflow-hidden shrink-0">
                      {row.image && <img loading="lazy" decoding="async" src={row.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-[12px] font-medium text-white">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-[10px]">
                  <span className="text-[13px] font-semibold text-brand-orange">${row.price.toFixed(2)}</span>
                </td>
                <td className="px-4 py-[10px]">
                  <span className={
                    row.stock === 0 ? 'text-[12px] text-error' :
                    row.stock <= 8  ? 'text-[12px] text-warning' :
                                      'text-[12px] text-pos-faint'
                  }>
                    {row.stock === 0 ? 'Out of stock' : `${row.stock} units`}
                  </span>
                </td>
                <td className="px-4 py-[10px]">
                  <Badge color={row.stock === 0 ? 'red' : row.stock <= 8 ? 'yellow' : 'green'}>
                    {row.stock === 0 ? 'Out of Stock' : row.stock <= 8 ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </td>
                <td className="px-4 py-[10px]">
                  <button
                    onClick={() => navigate(`/seller/store/${storeId}/products/edit/${row.productId}`)}
                    className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint transition-colors hover:text-white hover:bg-charcoal"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {!search && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-carbon">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-[11px] text-pos-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
