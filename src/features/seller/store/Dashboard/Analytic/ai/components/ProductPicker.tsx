import { Select } from '@/components/comman/ui/Input';
import { useStoreProductPicker } from '@/hooks/seller/useStoreProductPicker';

interface ProductPickerProps {
  storeId: string;
  value: string;
  onChange: (productId: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}

export function ProductPicker({ storeId, value, onChange, allowNone = true, noneLabel = '— No product (freeform) —' }: ProductPickerProps) {
  const { products, loading } = useStoreProductPicker(storeId);

  return (
    <Select value={value} disabled={loading} onChange={e => onChange(e.target.value)}>
      {allowNone && <option value="">{noneLabel}</option>}
      {products.map(p => (
        <option key={p.productId} value={p.productId}>{p.name}</option>
      ))}
    </Select>
  );
}
