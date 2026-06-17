import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { POSTopBar } from './components/POSTopBar';
import { SaleTab }    from './components/sale/SaleTab';
import { OrdersTab }  from './components/OrdersTab';
import { ProductsTab } from './components/ProductsTab';
import { SummaryTab } from './components/SummaryTab';
import type { ActiveTab } from './pos.types';

export function POSRegister() {
  usePageTitle('POS Register');
  const [activeTab, setActiveTab] = useState<ActiveTab>('sale');

  return (
    <div className="flex flex-col h-screen bg-pos-bg">
      <POSTopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'sale'     && <SaleTab />}
        {activeTab === 'orders'   && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'summary'  && <SummaryTab />}
      </div>
    </div>
  );
}
