import { Users, Clock } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

export default function StoreCustomers() {
  const { store, loading } = useStoreWorkspace();
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <StorePageHeader
        title="Customers"
        subtitle={loading ? '' : store?.name ?? ''}
      />
      <div style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FAF9F5', border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Users size={28} style={{ color: '#D97757', opacity: 0.6 }} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 6 }}>Customer list coming soon</p>
        <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 360, textAlign: 'center' }}>
          View and manage your customer base, track purchase history, and send targeted messages.
        </p>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#8C8A82' }}>
          <Clock size={13} />
          <span style={{ fontSize: 12 }}>In development</span>
        </div>
      </div>
    </div>
  );
}
