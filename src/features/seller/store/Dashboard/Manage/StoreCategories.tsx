import { useState } from 'react';
import { FolderTree, Tag, Plus } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { apiAddCategory, type CategoryNode } from '@/api/services/categories';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, ImageUpload } from '@/components/comman/ui';

// A store now owns its own category tree entirely — created freely by the
// seller, at their own discretion (no admin gate, unlike the old fixed
// "main category chosen at onboarding" model). `parentId` set → this adds a
// subcategory under that root; omitted → this adds a new root category.
function AddCategoryModal({ storeId, parentId, onClose, onCreated }: {
  storeId: string; parentId?: string; onClose: () => void; onCreated: () => void;
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
      await apiAddCategory({
        name: name.trim(), storeId, parentId,
        description: description.trim() || undefined, image: image.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={parentId ? 'Add Subcategory' : 'Add Category'}
      width={460}
      onClose={onClose}
      mobileSheet
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
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Description (optional)</label>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white resize-y transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Image (optional)</label>
          <ImageUpload value={image ? [image] : []} onChange={urls => setImage(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

function CategoryCard({ category, onAddSub }: {
  category: CategoryNode; onAddSub: (parentId: string) => void;
}) {
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-[14px] border-b border-bone flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
            <FolderTree size={16} style={{ color: '#D97757' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-carbon truncate">{category.name}</p>
            {category.description && <p className="text-[11px] text-slate truncate max-w-[320px]">{category.description}</p>}
          </div>
        </div>
        <Button icon={<Plus size={13} />} size="sm" variant="outline" onClick={() => onAddSub(category._id)} className="shrink-0">
          Add Subcategory
        </Button>
      </div>

      {category.children.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12.5px] text-slate">No subcategories yet.</p>
      ) : (
        <div className="flex flex-col">
          {category.children.map(sub => (
            <div key={sub._id} className="flex items-center gap-2.5 px-5 py-3 border-b border-[#f0eee6] last:border-b-0 transition-colors duration-150 hover:bg-cream">
              <Tag size={13} className="text-slate shrink-0" />
              <span className="text-[13px] font-medium text-carbon flex-1 truncate">{sub.name}</span>
              {sub.description && <span className="hidden sm:inline text-[11px] text-slate truncate max-w-[220px]">{sub.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoreCategories() {
  const { store } = useStoreWorkspace();
  const { tree, loading, refetch } = useStoreCategoryTree(store?._id);
  // undefined = closed, null = adding a root category, string = adding a
  // subcategory under that root's id.
  const [adding, setAdding] = useState<string | null | undefined>(undefined);

  return (
    <>
      <StorePageHeader
        title="Categories"
        subtitle="Your store's own categories — organize your products however makes sense to you."
        actions={
          <Button icon={<Plus size={14} />} size="sm" onClick={() => setAdding(null)} disabled={!store}>
            Add Category
          </Button>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-4 max-w-[640px]">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-bone rounded-[10px] px-5 py-4 flex items-center gap-3">
                <SkeletonBox width={36} height={36} rounded="10px" />
                <SkeletonBox height={14} width={140} rounded="4px" />
              </div>
            ))}
          </div>
        ) : tree.length === 0 ? (
          <div className="bg-white border border-bone rounded-[10px] px-5 py-10 text-center">
            <FolderTree size={22} className="text-slate mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-carbon mb-1">No categories yet</p>
            <p className="text-[12px] text-slate mb-4">Create your first category to start organizing products.</p>
            <Button icon={<Plus size={13} />} size="sm" onClick={() => setAdding(null)} disabled={!store} className="mx-auto">
              Add Category
            </Button>
          </div>
        ) : (
          tree.map(cat => (
            <CategoryCard key={cat._id} category={cat} onAddSub={id => setAdding(id)} />
          ))
        )}
      </div>

      {adding !== undefined && store && (
        <AddCategoryModal
          storeId={store._id}
          parentId={adding ?? undefined}
          onClose={() => setAdding(undefined)}
          onCreated={() => { setAdding(undefined); refetch(); }}
        />
      )}
    </>
  );
}
