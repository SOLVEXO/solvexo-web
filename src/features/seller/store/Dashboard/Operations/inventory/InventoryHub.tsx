import { useState } from 'react';
import {
  Boxes, Truck, AlertTriangle, ClipboardCheck, TrendingUp, CalendarClock, Undo2, ScanLine, Building2,
} from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { BarcodeScanModal } from './BarcodeScanModal';
import ExpiryTab from './tabs/ExpiryTab';
import SupplierReturnsTab from './tabs/SupplierReturnsTab';
import SuppliersTab from './tabs/SuppliersTab';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useRouteTabs } from '@/hooks/useRouteTabs';
import { NoTabAccess } from '@/components/comman/ui/NoTabAccess';
import { Navigate } from 'react-router-dom';

import { StoreInventory } from './Inventory';
import InventoryReports from './InventoryReports';
import StockCountsTab from './tabs/StockCountsTab';
import PurchaseOrdersList from '../../StoreSection/purchaseOrders/PurchaseOrdersList';
import ReorderSuggestions from '../../StoreSection/purchaseOrders/ReorderSuggestions';

const TABS: Tab[] = [
  { id: 'stock',           label: 'Stock',            icon: <Boxes size={13} /> },
  { id: 'purchase-orders', label: 'Purchase Orders',  icon: <Truck size={13} /> },
  { id: 'reorder',         label: 'Reorder',          icon: <AlertTriangle size={13} /> },
  { id: 'counts',          label: 'Stock Counts',     icon: <ClipboardCheck size={13} /> },
  { id: 'suppliers',       label: 'Suppliers',        icon: <Building2 size={13} /> },
  { id: 'returns',         label: 'Supplier Returns', icon: <Undo2 size={13} /> },
  { id: 'expiry',          label: 'Expiry',           icon: <CalendarClock size={13} /> },
  { id: 'reports',         label: 'Reports',          icon: <TrendingUp size={13} /> },
];

/** Single tabbed "Inventory" hub — Analytics/SEO-Center-style consolidation
 *  of what used to be 5 separate top-level pages/routes (Inventory,
 *  Purchase Orders, Reorder Suggestions, Inventory Reports, plus the new
 *  Stock Counts history). Each tab reuses its original component as-is (via
 *  an `embedded` prop that skips its own duplicate `StorePageHeader`) — no
 *  logic was rebuilt, only the page shell. The old standalone routes
 *  (`/purchase-orders`, `/reorder-suggestions`, `/inventory/reports`) are
 *  still reachable by direct URL (this project's established "disconnect,
 *  don't delete" convention) — only the sidebar NAV was consolidated down
 *  to this one "Inventory" entry. Detail/session pages
 *  (`/purchase-orders/:poId`, `/inventory/count/:countId`) stay their own
 *  separate routes, exactly like Purchase Orders' own list→detail split
 *  already worked. **Staff management previously lived as a 6th tab
 *  here — moved out to its own top-level page (`Staff.tsx`, Settings nav
 *  group) since Staff permissions now gate nearly every store section
 *  (Orders/Products/Finance/Settings/etc), not just Inventory — burying
 *  its management inside this one module's tab bar was a real
 *  architectural mismatch, not just a UI nicety.** */
const TAB_PERMS: Record<string, string[]> = {
  stock: ['inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.transfer', 'settings.locations.manage'],
  'purchase-orders': ['purchase_orders.manage'],
  reorder: ['purchase_orders.manage'],
  counts: ['inventory.count', 'inventory.approve'],
  suppliers: ['purchase_orders.manage'],
  returns: ['purchase_orders.manage'],
  expiry: ['inventory.view'],
  reports: ['inventory.view'],
};

/** `forcedTab`: legacy /inventory/reports route renders the hub pinned to Reports. */
export function InventoryHub({ forcedTab }: { forcedTab?: string } = {}) {
  const { visibleTabs, activeTab, openTab: setActiveTab, isVisited, paneClassName, redirectTo, blocked } = useRouteTabs({
    tabs: TABS, base: 'inventory', permissions: TAB_PERMS, forcedTab,
  });
  const { storeId } = useStoreWorkspace();
  const [scanning, setScanning] = useState(false);
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  if (blocked) return <NoTabAccess title="Inventory" />;

  return (
    <>
      <StorePageHeader
        title="Inventory" subtitle="Stock, purchasing, counts, and reports — all in one place."
        actions={<Button size="sm" variant="secondary" icon={<ScanLine size={14} />} onClick={() => setScanning(true)}>Scan</Button>}
      />
      {scanning && <BarcodeScanModal storeId={storeId} onClose={() => setScanning(false)} />}

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={visibleTabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Each tab stays mounted (hidden via CSS) once visited, instead of
         unmounting on switch — a repeat visit is instant, no refetch/skeleton. */}
      {isVisited('stock')           && <div className={paneClassName('stock')}><StoreInventory embedded /></div>}
      {isVisited('purchase-orders') && <div className={paneClassName('purchase-orders')}><PurchaseOrdersList embedded /></div>}
      {isVisited('reorder')         && <div className={paneClassName('reorder')}><ReorderSuggestions embedded /></div>}
      {isVisited('counts')          && <div className={paneClassName('counts')}><StockCountsTab /></div>}
      {isVisited('suppliers')       && <div className={paneClassName('suppliers')}><SuppliersTab /></div>}
      {isVisited('returns')         && <div className={paneClassName('returns')}><SupplierReturnsTab /></div>}
      {isVisited('expiry')          && <div className={paneClassName('expiry')}><ExpiryTab /></div>}
      {isVisited('reports')         && <div className={paneClassName('reports')}><InventoryReports embedded /></div>}
    </>
  );
}
