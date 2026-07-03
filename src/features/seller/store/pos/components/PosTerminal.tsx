import { useState } from 'react';
import { usePosSession } from '../context/PosSessionContext';
import { POSTopBar } from './POSTopBar';
import { SaleTab }    from './sale/SaleTab';
import { OrdersTab }  from './OrdersTab';
import { ProductsTab } from './ProductsTab';
import { SummaryTab } from './SummaryTab';
import { ManageTab }  from './ManageTab';
import type { ActiveTab } from '../pos.types';

interface PosTerminalProps {
  onShiftClosed: () => void;
}

export function PosTerminal({ onShiftClosed }: PosTerminalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sale');
  const { storeId, mode } = usePosSession();

  return (
    <>
      <POSTopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'sale'     && <SaleTab />}
        {activeTab === 'orders'   && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'summary'  && <SummaryTab onShiftClosed={onShiftClosed} />}
        {activeTab === 'manage'   && mode === 'owner' && <ManageTab storeId={storeId} />}
      </div>
    </>
  );
}
