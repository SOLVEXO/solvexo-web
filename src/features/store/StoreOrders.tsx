import { Package, Clock } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

export default function StoreOrders() {
  const { store, loading } = useStoreWorkspace();
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <StorePageHeader
        title="Orders"
        subtitle={loading ? '' : store?.name ?? ''}
      />
      <div style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FAF9F5', border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Package size={28} style={{ color: '#D97757', opacity: 0.6 }} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 6 }}>Orders coming soon</p>
        <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 360, textAlign: 'center' }}>
          Order management for this store will be available here. You'll be able to view, process, and manage all orders.
        </p>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#8C8A82' }}>
          <Clock size={13} />
          <span style={{ fontSize: 12 }}>In development</span>
        </div>
      </div>
    </div>
  );
}
