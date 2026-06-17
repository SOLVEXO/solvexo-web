import { usePOSSale } from '../../hooks/usePOSSale';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';

export function SaleTab() {
  const sale = usePOSSale();

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProductGrid
        cart={sale.cart}
        addItem={sale.addItem}
        searchQuery={sale.searchQuery}
        setSearchQuery={sale.setSearchQuery}
        activeCategory={sale.activeCategory}
        setActiveCategory={sale.setActiveCategory}
        categories={sale.categories}
        filtered={sale.filtered}
      />
      <CartPanel sale={sale} />
    </div>
  );
}
