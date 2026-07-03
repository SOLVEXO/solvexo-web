import { usePOSSale } from '../../hooks/usePOSSale';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';

export function SaleTab() {
  const sale = usePOSSale();

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
      <ProductGrid sale={sale} />
      <CartPanel sale={sale} />
    </div>
  );
}
