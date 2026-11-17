import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from '@/components/comman/ui/TabBar';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { NAV, hasNavPermission, hasNavEntitlement } from '@/components/layouts/navConfig';

// Shopify's Customers area is one place with tabs. The pages keep their own routes (old URLs still work);
// this layout only adds a tab strip above Customers / Companies (wholesale) / Khata, filtered by permission and plan.
const TABS = [
  { id: 'customers', label: 'Customers' },
  { id: 'wholesale', label: 'Companies' },
  { id: 'khata', label: 'Khata' },
];

export default function CustomersHubLayout() {
  const { storeId, entitlements } = useStoreWorkspace();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const items = NAV.flatMap((g) => g.items);
  const visible = TABS.flatMap((t) => {
    const item = items.find((i) => i.id === t.id);
    if (!item) return [];
    if (!hasNavPermission(user as never, item.requiredPermission) || !hasNavEntitlement(entitlements, item.requiredEntitlement)) return [];
    return [{ ...t, path: item.path }];
  });
  const active = visible.find((t) => pathname.endsWith(`/${t.path}`) || pathname.includes(`/${t.path}/`))?.id ?? '';
  return (
    <>
      {visible.length > 1 && (
        <div className="px-4 lg:px-7 pt-3 bg-white border-b border-bone" role="navigation" aria-label="Customers sections">
          <TabBar tabs={visible} active={active} onChange={(id) => { const t = visible.find((v) => v.id === id); if (t) navigate(`/store/${storeId}/${t.path}`); }} />
        </div>
      )}
      <Outlet />
    </>
  );
}
