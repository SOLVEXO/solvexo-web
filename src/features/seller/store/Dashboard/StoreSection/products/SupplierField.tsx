import { useEffect, useState } from 'react';
import { Field, Select } from '@/components/comman/ui';
import { apiListSuppliers } from '@/api/services/purchaseOrders';

/** Preferred supplier of a physical product. Reorder suggestions group low stock by it. Hidden until the store has a supplier. */
export function SupplierField({ storeId, value, onChange }: { storeId: string; value: string; onChange: (supplierId: string) => void }) {
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    apiListSuppliers(storeId).then(res => { if (!cancelled) setSuppliers(res.data.filter(s => s.status === 'active' || s._id === value)); }).catch(() => { /* the field just stays hidden */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);
  if (suppliers.length === 0) return null;
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone"><p className="text-[13px] font-bold text-charcoal">Supplier</p></div>
      <div className="px-5 py-4">
        <Field label="Preferred supplier" hint="Reorder suggestions for this product go to this supplier. Manage suppliers under Inventory → Suppliers.">
          <Select value={value} onChange={e => onChange(e.target.value)} aria-label="Preferred supplier">
            <option value="">None</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </Field>
      </div>
    </div>
  );
}
