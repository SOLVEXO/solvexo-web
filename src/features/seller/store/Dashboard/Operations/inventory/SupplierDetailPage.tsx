import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { TokenStorage } from '@/api/services/auth';
import { apiGetSupplierDetail, type SupplierDetail } from '@/api/services/purchaseOrders';
import { SupplierDetailBody } from './SupplierDetailBody';

/** One supplier: contact details, what was bought from it and its returns (`/store/:id/inventory/suppliers/:supplierId`). */
export default function SupplierDetailPage() {
  const { storeId, store } = useStoreWorkspace();
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['purchase_orders.manage']);
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supplierId) return;
    let cancelled = false;
    apiGetSupplierDetail(storeId, supplierId)
      .then(res => { if (!cancelled) { setDetail(res.data); setError(''); } })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this supplier.'); });
    return () => { cancelled = true; };
  }, [storeId, supplierId, attempt]);

  const back = () => navigate(`/store/${storeId}/inventory/suppliers`);
  const s = detail?.supplier;
  return (
    <>
      <StorePageHeader
        title={s?.name ?? 'Supplier'}
        subtitle={s ? (s.status === 'archived' ? 'Archived supplier' : 'Supplier') : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={<ArrowLeft size={13} />} onClick={back}>All suppliers</Button>
            {canManage && s && <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/inventory/suppliers`, { state: { editSupplierId: s._id } })}>Edit</Button>}
            {s && <Button size="sm" onClick={() => navigate(`/store/${storeId}/purchase-orders/new`, { state: { supplierId: s._id, supplierName: s.name, items: [] } })}>New purchase order</Button>}
          </div>
        }
      />
      <div className="px-4 lg:px-7 pt-5 pb-10 max-w-[900px]">
        {error ? (
          <div role="alert" className="rounded-xl border border-bone p-4 flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-error">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => { setError(''); setAttempt(a => a + 1); }}>Retry</Button>
          </div>
        ) : !detail ? (
          <div className="flex flex-col gap-2"><SkeletonBox height={56} rounded="10px" /><SkeletonBox height={160} rounded="10px" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-bone p-5">
            <SupplierDetailBody detail={detail} currency={store?.baseCurrency ?? 'USD'} onOpenPo={id => navigate(`/store/${storeId}/purchase-orders/${id}`)} />
          </div>
        )}
      </div>
    </>
  );
}
