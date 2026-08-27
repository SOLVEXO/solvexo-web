import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { ImageUpload } from '@/components/comman/ui';
import { apiAddCategory, type CategoryNode } from '@/api/services/categories';

const selCls = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none cursor-pointer disabled:opacity-60';

interface Props {
  storeId:          string;
  /** This store's own category tree (roots + their children) — created
   *  freely by the seller from the Categories page, entirely their own
   *  choice, no admin-curated root any more. */
  tree:             CategoryNode[];
  loading:          boolean;
  categoryId:       string;
  subCategoryId:    string;
  onCategoryChange:    (id: string) => void;
  onSubCategoryChange: (id: string) => void;
  refetch:          () => void;
}

export function SubcategoryField({ storeId, tree, loading, categoryId, subCategoryId, onCategoryChange, onSubCategoryChange, refetch }: Props) {
  const [addingCategory, setAddingCategory]       = useState(false);
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const selectedCategory = tree.find(c => c._id === categoryId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold text-graphite">Category</label>
          <button type="button" onClick={() => setAddingCategory(true)}
            className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer flex items-center gap-1">
            <Plus size={11} /> Add Category
          </button>
        </div>
        <select value={categoryId} onChange={e => onCategoryChange(e.target.value)} disabled={loading} className={selCls}>
          <option value="">{loading ? 'Loading…' : 'No category'}</option>
          {tree.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold text-graphite">Subcategory</label>
          <button type="button" onClick={() => setAddingSubcategory(true)} disabled={!categoryId}
            className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={11} /> Add Subcategory
          </button>
        </div>
        <select value={subCategoryId} onChange={e => onSubCategoryChange(e.target.value)} disabled={loading || !categoryId} className={selCls}>
          <option value="">{!categoryId ? 'Pick a category first' : 'No subcategory'}</option>
          {(selectedCategory?.children ?? []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {addingCategory && (
        <AddCategoryModal
          storeId={storeId}
          title="Add Category"
          onClose={() => setAddingCategory(false)}
          onCreated={id => { setAddingCategory(false); refetch(); onCategoryChange(id); }}
        />
      )}
      {addingSubcategory && categoryId && (
        <AddCategoryModal
          storeId={storeId}
          parentId={categoryId}
          title="Add Subcategory"
          onClose={() => setAddingSubcategory(false)}
          onCreated={id => { setAddingSubcategory(false); refetch(); onSubCategoryChange(id); }}
        />
      )}
    </div>
  );
}

function AddCategoryModal({ storeId, parentId, title, onClose, onCreated }: {
  storeId: string; parentId?: string; title: string; onClose: () => void; onCreated: (id: string) => void;
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
      const res = await apiAddCategory({
        name: name.trim(), storeId, parentId,
        description: description.trim() || undefined, image: image.trim() || undefined,
      });
      onCreated(res.data._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={title}
      width={440}
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
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Image (optional)</label>
          <ImageUpload value={image ? [image] : []} onChange={urls => setImage(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
