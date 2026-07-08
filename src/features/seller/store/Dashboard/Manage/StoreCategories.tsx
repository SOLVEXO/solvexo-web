import { useState } from 'react';
import { Loader2, FolderTree, Tag, Plus } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { useStoreSubcategories } from '@/hooks/store/useStoreSubcategories';
import { apiAddCategory } from '@/api/services/categories';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';

// A store's main category is fixed at creation (assertValidRootCategory on
// the backend) — sellers can never change it or see other main categories
// here. The only action available is adding subcategories under it.
function AddSubcategoryModal({ mainCategoryId, onClose, onCreated }: {
  mainCategoryId: string; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  async function submit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiAddCategory({ name: name.trim(), parentId: mainCategoryId, description: description.trim() || undefined, image: image.trim() || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subcategory.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Subcategory"
      width={460}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ceramics"
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Description (optional)</label>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white resize-y" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Image URL (optional)</label>
          <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://…"
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

export default function StoreCategories() {
  const { store } = useStoreWorkspace();
  const { mainCategory, subcategories, loading, refetch } = useStoreSubcategories(store?.categoryId);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <StorePageHeader
        title="Categories"
        subtitle="Your store's main category and its subcategories."
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5 max-w-[640px]">

        {/* Main category */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#FBECE4] flex items-center justify-center shrink-0">
            <FolderTree size={19} style={{ color: '#D97757' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-0.5">Main Category</p>
            {!store ? (
              <div className="animate-pulse w-32 h-4 rounded bg-bone" />
            ) : (
              <p className="text-[15px] font-bold text-carbon truncate">{mainCategory?.name ?? '—'}</p>
            )}
          </div>
        </div>
        <p className="text-[12px] text-slate -mt-3">
          Set once when your store was created. To change it, contact Solvexo support.
        </p>

        {/* Subcategories */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-charcoal">Subcategories</p>
              <p className="text-[11px] text-slate mt-0.5">Used to tag your products more precisely.</p>
            </div>
            <Button icon={<Plus size={13} />} size="sm" onClick={() => setAdding(true)} disabled={!store?.categoryId}>
              Add Subcategory
            </Button>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-center"><Loader2 size={18} className="animate-spin text-brand-orange inline" /></div>
          ) : subcategories.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-slate">No subcategories yet.</p>
          ) : (
            <div className="flex flex-col">
              {subcategories.map(sub => (
                <div key={sub._id} className="flex items-center gap-2.5 px-5 py-3 border-b border-[#F0EEE6] last:border-b-0">
                  <Tag size={13} className="text-slate shrink-0" />
                  <span className="text-[13px] font-medium text-carbon flex-1">{sub.name}</span>
                  {sub.description && <span className="text-[11px] text-slate truncate max-w-[220px]">{sub.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {adding && store?.categoryId && (
        <AddSubcategoryModal
          mainCategoryId={store.categoryId}
          onClose={() => setAdding(false)}
          onCreated={() => { setAdding(false); refetch(); }}
        />
      )}
    </>
  );
}
