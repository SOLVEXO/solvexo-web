import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, MoreVertical, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useMyStores } from '@/hooks/store/useMyStores';
import { usePageTitle } from '@/hooks/usePageTitle';

const statusColors: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#E3F4EA', color: '#1E7A3C' },
  inactive: { bg: '#F0EEE6', color: '#8C8A82' },
  pending:  { bg: '#FFF0E0', color: '#B36200' },
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#F5F4EF]">
      {/* S.No */}
      <td className="px-[18px] py-[11px]">
        <div className="animate-pulse w-4 h-[13px] rounded bg-[#EDEBE2]" />
      </td>
      {/* Store col: logo + name */}
      <td className="px-[18px] py-[11px]">
        <div className="flex items-center gap-[10px]">
          <div className="animate-pulse w-8 h-8 rounded-lg bg-[#EDEBE2] shrink-0" />
          <div className="animate-pulse w-[110px] h-[13px] rounded bg-[#EDEBE2]" />
        </div>
      </td>
      {[80, 60, 55, 45, 75, 28].map((w, i) => (
        <td key={i} className="px-[18px] py-[11px]">
          <div className="animate-pulse bg-[#EDEBE2]" style={{ width: w, height: i === 2 ? 22 : 13, borderRadius: i === 2 ? 5 : 4 }} />
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
      className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none cursor-pointer text-[12px] font-medium rounded-[6px] text-left"
      style={{ color: danger ? '#C13030' : '#2C2A28' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FFF2F2' : '#FAF9F5')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={13} />
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-[30px] h-[30px] rounded-[7px] cursor-pointer flex items-center justify-center transition-all duration-150"
        style={{
          border: `1px solid ${open ? '#D97757' : '#E8E6DC'}`,
          background: open ? '#FBECE4' : '#FFFFFF',
        }}
      >
        <MoreVertical size={14} style={{ color: open ? '#D97757' : '#8C8A82' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-[60] bg-white border border-bone rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.10)] min-w-[140px] p-1">
          {item(Eye,    'View',       () => { navigate(`/seller/store/${storeId}/dashboard`); setOpen(false); })}
          {item(Pencil, 'Edit Store', () => { navigate(`/seller/store/${storeId}/settings`);  setOpen(false); })}
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
            <Plus size={14} className="mr-1 inline align-middle" />
            New Store
          </Button>
        }
      />

      <div className="px-7 py-6">

        {/* Empty state — only when done loading */}
        {!loading && !error && stores.length === 0 && (
          <div className="text-center px-5 py-[60px] bg-white border border-bone rounded-xl">
            <div className="w-14 h-14 rounded-[14px] bg-brand-pale-orange flex items-center justify-center mx-auto mb-4">
              <Store size={28} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-[#141413] mb-2">No stores yet</h2>
            <p className="text-[13px] text-[#8C8A82] max-w-[320px] mx-auto mb-6">
              Create your first store and start selling digital products, courses, and more.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
              Create Your First Store
            </Button>
          </div>
        )}

        {/* Table */}
        {(loading || stores.length > 0) && (
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-t border-b border-bone">
                    {['S.No', 'Store', 'URL', 'Status', 'Plan', 'AI Credits', 'Type', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] px-[18px] py-[10px]"
                      >
                        {h}
                      </th>
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
                            className="transition-[background] duration-[120ms]"
                            style={{ borderBottom: i < stores.length - 1 ? '1px solid #F5F4EF' : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {/* S.No */}
                            <td className="px-[18px] py-[11px] font-semibold text-[#8C8A82] text-[12px]">
                              {i + 1}
                            </td>

                            {/* Store */}
                            <td className="px-[18px] py-[11px]">
                              <div className="flex items-center gap-[10px]">
                                <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0 overflow-hidden border border-[#EDEBE2]">
                                  {store.logo
                                    ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                    : <Store size={15} className="text-brand-orange" />}
                                </div>
                                <span className="font-semibold text-[#141413]">{store.name}</span>
                              </div>
                            </td>

                            {/* URL */}
                            <td className="px-[18px] py-[11px] text-slate">/{store.slug}</td>

                            {/* Status */}
                            <td className="px-[18px] py-[11px]">
                              <span
                                className="inline-block text-[11px] font-semibold px-[10px] py-[3px] rounded-[5px]"
                                style={{ background: st.bg, color: st.color }}
                              >
                                {store.status}
                              </span>
                            </td>

                            {/* Plan */}
                            <td className="px-[18px] py-[11px] text-slate">
                              {store.plan ?? 'Starter'}
                            </td>

                            {/* AI Credits */}
                            <td className="px-[18px] py-[11px] font-semibold text-[#141413]">
                              {store.aiCredits != null ? store.aiCredits : '—'}
                            </td>

                            {/* Type */}
                            <td className="px-[18px] py-[11px] text-slate capitalize">
                              {store.sellerType?.replace(/_/g, ' ') ?? '—'}
                            </td>

                            {/* Actions — 3-dot menu */}
                            <td className="px-[18px] py-[11px]">
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
