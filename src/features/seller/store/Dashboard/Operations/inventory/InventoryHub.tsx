import { useState } from 'react';
import {
  Boxes, Truck, AlertTriangle, ClipboardCheck, TrendingUp, Users,
} from 'lucide-react';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';

import { StoreInventory } from './Inventory';
import InventoryReports from './InventoryReports';
import StockCountsTab from './tabs/StockCountsTab';
import StaffTab from './tabs/StaffTab';
import PurchaseOrdersList from '../../StoreSection/purchaseOrders/PurchaseOrdersList';
import ReorderSuggestions from '../../StoreSection/purchaseOrders/ReorderSuggestions';

const TABS: Tab[] = [
  { id: 'stock',           label: 'Stock',            icon: <Boxes size={13} /> },
  { id: 'purchase-orders', label: 'Purchase Orders',  icon: <Truck size={13} /> },
  { id: 'reorder',         label: 'Reorder',          icon: <AlertTriangle size={13} /> },
  { id: 'counts',          label: 'Stock Counts',     icon: <ClipboardCheck size={13} /> },
  { id: 'reports',         label: 'Reports',          icon: <TrendingUp size={13} /> },
  { id: 'staff',           label: 'Staff',            icon: <Users size={13} /> },
];

/** Single tabbed "Inventory" hub — Analytics/SEO-Center-style consolidation
 *  of what used to be 6 separate top-level pages/routes (Inventory,
 *  Purchase Orders, Reorder Suggestions, Inventory Reports, plus the new
 *  Stock Counts history and Staff management). Each tab reuses its
 *  original component as-is (via an `embedded` prop that skips its own
 *  duplicate `StorePageHeader`) — no logic was rebuilt, only the page
 *  shell. The old standalone routes (`/purchase-orders`, `/reorder-
 *  suggestions`, `/inventory/reports`) are still reachable by direct URL
 *  (this project's established "disconnect, don't delete" convention) —
 *  only the sidebar NAV was consolidated down to this one "Inventory"
 *  entry. Detail/session pages (`/purchase-orders/:poId`,
 *  `/inventory/count/:countId`) stay their own separate routes, exactly
 *  like Purchase Orders' own list→detail split already worked. */
export function InventoryHub() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <>
      <StorePageHeader title="Inventory" subtitle="Stock, purchasing, counts, and staff — all in one place." />

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'stock'           && <StoreInventory embedded />}
      {activeTab === 'purchase-orders' && <PurchaseOrdersList embedded />}
      {activeTab === 'reorder'         && <ReorderSuggestions embedded />}
      {activeTab === 'counts'          && <StockCountsTab />}
      {activeTab === 'reports'         && <InventoryReports embedded />}
      {activeTab === 'staff'           && <StaffTab />}
    </>
  );
}
