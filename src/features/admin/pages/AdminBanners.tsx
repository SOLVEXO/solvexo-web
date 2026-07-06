import { useState } from 'react';
import { Plus, ImageIcon, Loader2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminBanners } from '@/hooks/admin/useAdminBanners';
import { apiCreateBannerFromUrl, apiUpdateBanner, apiDeleteBanner, type Banner } from '@/api/services/banner';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input } from '@/components/comman/ui/Input';
import { Toggle } from '@/components/comman/ui/Toggle';
import { ImageUpload } from '@/components/comman/ui/Upload';

const MAX_BANNERS = 4;

// ── Form modal ────────────────────────────────────────────────────────────────
function BannerFormModal({
  banner, currentCount, onClose, onSaved,
}: {
  banner: Banner | null;
  currentCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!banner;
  const [images, setImages] = useState<string[]>(banner?.bannerImage ? [banner.bannerImage] : []);
  const [urlOnTap, setUrlOnTap] = useState(banner?.urlOnTap ?? '');
  const [order, setOrder] = useState(String(banner?.order ?? currentCount));
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!images[0]) { setError('Please upload a banner image.'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateBanner(banner._id, {
          bannerImage: images[0],
          urlOnTap: urlOnTap || undefined,
          order: Number(order) || 0,
          isActive,
        });
      } else {
        await apiCreateBannerFromUrl({
          bannerImage: images[0],
          urlOnTap: urlOnTap || undefined,
          order: Number(order) || 0,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Banner' : 'Add Banner'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Banner'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Banner Image</label>
          <ImageUpload value={images} onChange={setImages} maxFiles={1} />
        </div>
        <Input label="Link URL (optional)" placeholder="https://example.com/sale" value={urlOnTap} onChange={e => setUrlOnTap(e.target.value)} />
        <Input label="Display Order" type="number" min={0} value={order} onChange={e => setOrder(e.target.value)} />
        {isEdit && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-charcoal">Active</span>
            <Toggle checked={isActive} onChange={setIsActive} />
          </div>
        )}
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminBanners() {
  usePageTitle('Banners');
  const { banners, loading, error, refetch } = useAdminBanners();
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);

  async function handleDelete(banner: Banner) {
    if (!window.confirm('Delete this banner? This cannot be undone.')) return;
    try {
      await apiDeleteBanner(banner._id);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete banner.');
    }
  }

  const isFull = banners.length >= MAX_BANNERS;

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Banners</h1>
          <p className="text-[12px] text-slate mt-[2px]">Manage homepage promotional banners ({banners.length}/{MAX_BANNERS} used).</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')} disabled={isFull}>
          Add Banner
        </Button>
      </div>

      <div className="px-7 pt-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-brand-orange" /></div>
        ) : error ? (
          <p className="text-[13px] text-error text-center py-8">{error}</p>
        ) : banners.length === 0 ? (
          <div className="bg-white border border-bone rounded-[10px] flex flex-col items-center justify-center py-16 gap-3">
            <ImageIcon size={28} className="text-slate" />
            <p className="text-[13px] text-slate">No banners yet. Add one to feature it on the homepage.</p>
            <Button icon={<Plus size={14} />} onClick={() => setEditing('new')}>Add Banner</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...banners].sort((a, b) => a.order - b.order).map(b => (
              <div key={b._id} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                <div className="aspect-[16/9] bg-cream">
                  <img loading="lazy" decoding="async" src={b.bannerImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="px-[8px] py-[2px] rounded-[5px] text-[11px] font-semibold"
                      style={{ background: b.isActive ? '#EAF7EF' : '#F0EEE6', color: b.isActive ? '#1E7A3C' : '#5A5852' }}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[11px] text-slate">Order {b.order}</span>
                  </div>
                  {b.urlOnTap && (
                    <a href={b.urlOnTap} target="_blank" rel="noreferrer" className="text-[11px] text-brand-orange truncate flex items-center gap-1">
                      <ExternalLink size={10} /> {b.urlOnTap}
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <button onClick={() => setEditing(b)} className="flex-1 px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium text-charcoal bg-cream border border-bone cursor-pointer flex items-center justify-center gap-1">
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => handleDelete(b)} className="flex-1 px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium text-error bg-error-bg border border-[#FECACA] cursor-pointer flex items-center justify-center gap-1">
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <BannerFormModal
          banner={editing === 'new' ? null : editing}
          currentCount={banners.length}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}
