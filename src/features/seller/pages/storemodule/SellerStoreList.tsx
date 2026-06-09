import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, MoreVertical, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useMyStores } from '@/hooks/store/useMyStores';
import { usePageTitle } from '@/hooks/usePageTitle';

const statusColors: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#E3F4EA', color: '#1E7A3C' },
  inactive: { bg: '#F0EEE6', color: '#8C8A82' },
  pending:  { bg: '#FFF0E0', color: '#B36200' },
};

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: '#8C8A82', textTransform: 'uppercase',
  letterSpacing: '0.05em', padding: '10px 18px',
  fontFamily: "'Poppins', sans-serif",
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F5F4EF' }}>
      {/* S.No */}
      <td style={{ padding: '11px 18px' }}>
        <div className="animate-pulse" style={{ width: 16, height: 13, borderRadius: 4, background: '#EDEBE2' }} />
      </td>
      {/* Store col: logo + name */}
      <td style={{ padding: '11px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: 8, background: '#EDEBE2', flexShrink: 0 }} />
          <div className="animate-pulse" style={{ width: 110, height: 13, borderRadius: 4, background: '#EDEBE2' }} />
        </div>
      </td>
      {[80, 60, 55, 45, 75, 28].map((w, i) => (
        <td key={i} style={{ padding: '11px 18px' }}>
          <div className="animate-pulse" style={{ width: w, height: i === 2 ? 22 : 13, borderRadius: i === 2 ? 5 : 4, background: '#EDEBE2' }} />
        </td>
      ))}
    </tr>
  );
}

// ── 3-dot Actions Dropdown ────────────────────────────────────────────────────
function StoreActionsMenu({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const item = (Icon: React.ElementType, label: string, onClick: () => void, danger = false) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 12px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 500,
        color: danger ? '#C13030' : '#2C2A28',
        fontFamily: "'Poppins', sans-serif",
        borderRadius: 6, textAlign: 'left',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FFF2F2' : '#FAF9F5')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={13} />
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: 30, height: 30, borderRadius: 7,
          border: `1px solid ${open ? '#D97757' : '#E8E6DC'}`,
          background: open ? '#FBECE4' : '#FFFFFF',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        <MoreVertical size={14} style={{ color: open ? '#D97757' : '#8C8A82' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 60,
          background: '#FFFFFF', border: '1px solid #E8E6DC', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.10)', minWidth: 140, padding: 4,
        }}>
          {item(Eye,    'View',       () => { navigate(`/seller/stores/${storeId}`);            setOpen(false); })}
          {item(Pencil, 'Edit Store', () => { navigate(`/seller/stores/${storeId}?edit=true`); setOpen(false); })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SellerStoreList() {
  const navigate = useNavigate();
  const { stores, loading, error } = useMyStores();
  usePageTitle('My Stores');

  return (
    <>
      <SellerPageHeader
        title="My Stores"
        subtitle="Manage all your stores from one place."
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
            <Plus size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
            New Store
          </Button>
        }
      />

      <div style={{ padding: '24px 28px', fontFamily: "'Poppins', sans-serif" }}>

        {/* Empty state — only when done loading */}
        {!loading && !error && stores.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#FFFFFF', border: '1px solid #E8E6DC', borderRadius: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#FBECE4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Store size={28} style={{ color: '#D97757' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 8 }}>No stores yet</h2>
            <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 320, margin: '0 auto 24px' }}>
              Create your first store and start selling digital products, courses, and more.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
              Create Your First Store
            </Button>
          </div>
        )}

        {/* Table */}
        {(loading || stores.length > 0) && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #E8E6DC', borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #E8E6DC', borderBottom: '1px solid #E8E6DC' }}>
                    {['S.No', 'Store', 'URL', 'Status', 'Plan', 'AI Credits', 'Type', 'Actions'].map(h => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
                    : stores.map((store, i) => {
                        const st = statusColors[store.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                        return (
                          <tr
                            key={store._id}
                            style={{
                              borderBottom: i < stores.length - 1 ? '1px solid #F5F4EF' : 'none',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {/* S.No */}
                            <td style={{ padding: '11px 18px', fontWeight: 600, color: '#8C8A82', fontSize: 12 }}>
                              {i + 1}
                            </td>

                            {/* Store */}
                            <td style={{ padding: '11px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, background: '#FBECE4',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, overflow: 'hidden', border: '1px solid #EDEBE2',
                                }}>
                                  {store.logo
                                    ? <img src={store.logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Store size={15} style={{ color: '#D97757' }} />}
                                </div>
                                <span style={{ fontWeight: 600, color: '#141413' }}>{store.name}</span>
                              </div>
                            </td>

                            {/* URL */}
                            <td style={{ padding: '11px 18px', color: '#4A4945' }}>/{store.slug}</td>

                            {/* Status */}
                            <td style={{ padding: '11px 18px' }}>
                              <span style={{
                                display: 'inline-block', background: st.bg, color: st.color,
                                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
                              }}>
                                {store.status}
                              </span>
                            </td>

                            {/* Plan */}
                            <td style={{ padding: '11px 18px', color: '#4A4945' }}>
                              {store.plan ?? 'Starter'}
                            </td>

                            {/* AI Credits */}
                            <td style={{ padding: '11px 18px', fontWeight: 600, color: '#141413' }}>
                              {store.aiCredits != null ? store.aiCredits : '—'}
                            </td>

                            {/* Type */}
                            <td style={{ padding: '11px 18px', color: '#4A4945', textTransform: 'capitalize' }}>
                              {store.sellerType?.replace(/_/g, ' ') ?? '—'}
                            </td>

                            {/* Actions — 3-dot menu */}
                            <td style={{ padding: '11px 18px' }}>
                              <StoreActionsMenu storeId={store._id} />
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
