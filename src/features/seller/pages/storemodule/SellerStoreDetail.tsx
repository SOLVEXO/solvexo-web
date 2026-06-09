import { useParams, useNavigate } from 'react-router-dom';
import {
  Store, Pencil, AlertTriangle,
  ArrowLeft, Package, Zap, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useGetStore } from '@/hooks/store/useGetStore';
import type { ProductType, StoreData } from '@/api/store';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRODUCT_TYPE_OPTIONS: { id: ProductType; label: string }[] = [
  { id: 'physical_products', label: 'Physical Products'   },
  { id: 'digital_downloads', label: 'Digital Downloads'   },
  { id: 'services',          label: 'Services / Bookings' },
  { id: 'in_person_pos',     label: 'In-Person / POS'    },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#E3F4EA', color: '#1E7A3C' },
  inactive: { bg: '#F0EEE6', color: '#8C8A82' },
  pending:  { bg: '#FFF0E0', color: '#B36200' },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StoreSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="animate-pulse" style={{ width: 72, height: 72, borderRadius: 14, background: '#EDEBE2', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="animate-pulse" style={{ width: 180, height: 18, borderRadius: 6, background: '#EDEBE2' }} />
          <div className="animate-pulse" style={{ width: 90,  height: 12, borderRadius: 4, background: '#EDEBE2' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[64, 52, 72].map((w, i) => (
              <div key={i} className="animate-pulse" style={{ width: w, height: 22, borderRadius: 20, background: '#EDEBE2' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#E8E6DC' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #E8E6DC', background: '#FAF9F5' }}>
            <div className="animate-pulse" style={{ width: 80, height: 11, borderRadius: 3, background: '#EDEBE2', marginBottom: 10 }} />
            <div className="animate-pulse" style={{ width: 48, height: 20, borderRadius: 4, background: '#EDEBE2' }} />
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: '#E8E6DC' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[130, 80, 200, 200, 72, 72].map((w, i) => (
          <div key={i}>
            <div className="animate-pulse" style={{ width: 55, height: 9, borderRadius: 3, background: '#EDEBE2', marginBottom: 7 }} />
            <div className="animate-pulse" style={{ width: w, height: 13, borderRadius: 4, background: '#EDEBE2' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Store Info View ───────────────────────────────────────────────────────────
function StoreInfoView({ store }: { store: StoreData }) {
  const st = STATUS_STYLE[store.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 14, flexShrink: 0,
          background: '#FBECE4', border: '1px solid #EDEBE2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {store.logo
            ? <img src={store.logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Store size={28} style={{ color: '#D97757' }} />}
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#141413', fontFamily: "'Poppins', sans-serif" }}>
            {store.name}
          </p>
          <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 2, fontFamily: "'Poppins', sans-serif" }}>
            /{store.slug}
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
              {store.status}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#EAF0FB', color: '#2156A8' }}>
              {store.plan}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F0EEE6', color: '#5A5852' }}>
              {store.sellerType}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#E8E6DC' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatBox Icon={Zap}        label="AI Credits"    value={String(store.aiCredits ?? 0)} />
        <StatBox Icon={Package}    label="Product Types" value={String(store.productTypes?.length ?? 0)} />
        <StatBox Icon={CreditCard} label="Plan"          value={store.plan} />
      </div>

      <div style={{ height: 1, background: '#E8E6DC' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <InfoRow label="Category"    value={store.categoryId  || '—'} />
        <InfoRow label="Seller Type" value={store.sellerType} />
        <InfoRow label="Store ID"    value={store._id}        mono />
        <InfoRow label="Seller ID"   value={store.sellerId}   mono />
        <InfoRow label="Created"     value={store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'} />
        <InfoRow label="Updated"     value={store.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : '—'} />
      </div>

      {store.description && (
        <>
          <div style={{ height: 1, background: '#E8E6DC' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: "'Poppins', sans-serif" }}>Description</p>
            <p style={{ fontSize: 13, color: '#4A4945', lineHeight: 1.6, fontFamily: "'Poppins', sans-serif" }}>{store.description}</p>
          </div>
        </>
      )}

      {store.productTypes?.length > 0 && (
        <>
          <div style={{ height: 1, background: '#E8E6DC' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: "'Poppins', sans-serif" }}>Product Types</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {store.productTypes.map(pt => (
                <span key={pt} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#FBECE4', color: '#B95A3A', fontFamily: "'Poppins', sans-serif" }}>
                  {PRODUCT_TYPE_OPTIONS.find(o => o.id === pt)?.label ?? pt}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({ Icon, label, value }: { Icon: typeof Store; label: string; value: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #E8E6DC', background: '#FAF9F5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={14} style={{ color: '#D97757' }} />
        <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', fontFamily: "'Poppins', sans-serif" }}>{label}</p>
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#141413', fontFamily: "'Poppins', sans-serif" }}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>{label}</p>
      <p style={{ fontSize: 13, color: '#2C2A28', wordBreak: 'break-all', fontFamily: mono ? "'Courier New', monospace" : "'Poppins', sans-serif" }}>{value}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SellerStoreDetail() {
  const { id = '' }  = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { store: fetched, loading, error } = useGetStore(id);

  return (
    <>
      <SellerPageHeader
        title={loading ? 'Store' : (fetched?.name ?? 'Store')}
        subtitle={loading ? 'Loading…' : (fetched ? `/${fetched.slug}` : 'Could not load store.')}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ArrowLeft size={14} /> Back
              </span>
            </Button>
            {!loading && fetched && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/seller/stores/${id}/edit`)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Pencil size={13} /> Edit Store
                </span>
              </Button>
            )}
          </>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8E6DC',
          borderRadius: 12, padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {loading && <StoreSkeleton />}

          {!loading && (error || !fetched) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#C13030' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
                {error || 'Store not found.'}
              </span>
            </div>
          )}

          {!loading && fetched && <StoreInfoView store={fetched} />}
        </div>
      </div>
    </>
  );
}
