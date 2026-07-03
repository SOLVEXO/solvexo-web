import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/comman/ui/Badge';
import { apiGetPosProducts, apiSearchPosProducts, type PosProduct } from '@/api/commerce/posProducts';
import { usePosSession } from '../context/PosSessionContext';

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
  for (const p of products) {
    for (const v of p.variants) {
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
        ? apiSearchPosProducts(storeId, q).then(res => ({ items: res.data, totalPages: 1 }))
        : apiGetPosProducts(storeId, { page, limit: 30 }).then(res => ({ items: res.data.products, totalPages: res.data.pagination.totalPages }));

      request
        .then(({ items, totalPages: tp }) => { if (!cancelled) { setRows(flatten(items)); setTotalPages(tp); } })
        .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, q ? 300 : 0);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [storeId, page, search]);

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-5">
        <p className="text-[16px] font-bold text-white flex-1">Product Catalog</p>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search SKU or name..."
          className="bg-pos-surface border border-carbon rounded-lg px-[14px] py-2 text-[13px] text-white outline-none"
        />
        <button
          onClick={() => navigate(`/seller/store/${storeId}/products/add`)}
          className="px-4 py-2 bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
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
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[12px] text-pos-muted">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[12px] text-error">{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[12px] text-pos-muted">No products found.</td></tr>
            ) : rows.map(row => (
              <tr key={row.variantId} className="border-b border-carbon">
                <td className="px-4 py-[10px]">
                  <span className="text-[11px] font-mono text-pos-muted">{row.sku}</span>
                </td>
                <td className="px-4 py-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-carbon overflow-hidden shrink-0">
                      {row.image && <img src={row.image} alt="" className="w-full h-full object-cover" />}
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
                    className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
