import { useCallback, useState } from 'react';
import { Lock } from 'lucide-react';
import type { StaffPermission } from '@/api/services/staff';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { EmptyState, TabBar } from '@/components/comman/ui';
import { ApplicationsTab } from './ApplicationsTab';
import { CatalogsTab } from './CatalogsTab';
import { CompaniesTab, type CatalogRow } from './CompaniesTab';
import { ErrorLine } from './ErrorLine';
import { OrdersTab } from './OrdersTab';
import { useApi } from './wholesaleUtils';

type Tab = 'companies' | 'applications' | 'catalogs' | 'orders';
const TABS: { id: Tab; label: string }[] = [
  { id: 'companies', label: 'Companies' },
  { id: 'applications', label: 'Applications' },
  { id: 'catalogs', label: 'Catalogs' },
  { id: 'orders', label: 'Orders & balances' },
];

interface CatalogFull extends CatalogRow { defaultAdjustmentPercent: number | null; includeAllProducts: boolean; itemCount: number }

export default function WholesaleHub() {
  const { storeId } = useStoreWorkspace();
  const allowed = can('b2b.view' as StaffPermission);
  const [tab, setTab] = useState<Tab>('companies');
  const change = useCallback((id: string) => setTab(id as Tab), []);
  const catalogs = useApi<CatalogFull[]>(`/api/b2b/${storeId}/catalogs`);

  return (
    <>
      <StorePageHeader title="Wholesale" subtitle="Companies, catalogs, applications and payment terms" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {!allowed ? <EmptyState icon={<Lock size={22} />} title="No access" description="Your role does not include wholesale." /> : (
          <>
            <TabBar tabs={TABS} active={tab} onChange={change} />
            {catalogs.error && tab !== 'catalogs' && <ErrorLine message={errorMessage(catalogs.error)} onRetry={catalogs.reload} />}
            {tab === 'companies' && <CompaniesTab storeId={storeId} catalogs={catalogs.data ?? []} />}
            {tab === 'applications' && <ApplicationsTab storeId={storeId} catalogs={catalogs.data ?? []} />}
            {tab === 'catalogs' && <CatalogsTab storeId={storeId} catalogs={catalogs.error ? undefined : catalogs.data ?? undefined} reload={catalogs.reload} />}
            {tab === 'orders' && <OrdersTab storeId={storeId} />}
          </>
        )}
      </div>
    </>
  );
}
