import { Badge } from '@/components/comman/ui/Badge';
import { POS_PRODUCTS } from '../pos.data';

export function ProductsTab() {
  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-5">
        <p className="text-[16px] font-bold text-white flex-1">Product Catalog</p>
        <input
          placeholder="Search SKU or name..."
          className="bg-pos-surface border border-carbon rounded-lg px-[14px] py-2 text-[13px] text-white outline-none"
        />
        <button className="px-4 py-2 bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer">
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['SKU', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
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
            {POS_PRODUCTS.map(p => (
              <tr key={p.sku} className="border-b border-carbon">
                <td className="px-4 py-[10px]">
                  <span className="text-[11px] font-mono text-pos-muted">{p.sku}</span>
                </td>
                <td className="px-4 py-[10px]">
                  <div className="flex items-center gap-2">
                    <p.icon size={18} className="text-brand-orange shrink-0" />
                    <span className="text-[12px] font-medium text-white">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-[10px]">
                  <Badge color="gray">{p.category}</Badge>
                </td>
                <td className="px-4 py-[10px]">
                  <span className="text-[13px] font-semibold text-brand-orange">${p.price.toFixed(2)}</span>
                </td>
                <td className="px-4 py-[10px]">
                  <span className={
                    p.stock === 0 ? 'text-[12px] text-error' :
                    p.stock <= 8  ? 'text-[12px] text-warning' :
                                    'text-[12px] text-pos-faint'
                  }>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                  </span>
                </td>
                <td className="px-4 py-[10px]">
                  <Badge color={p.stock === 0 ? 'red' : p.stock <= 8 ? 'yellow' : 'green'}>
                    {p.stock === 0 ? 'Out of Stock' : p.stock <= 8 ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </td>
                <td className="px-4 py-[10px]">
                  <div className="flex gap-[6px]">
                    <button className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                      Edit
                    </button>
                    {p.stock <= 8 && (
                      <button className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] text-brand-orange cursor-pointer">
                        Restock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
