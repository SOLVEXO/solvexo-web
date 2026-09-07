import { useState } from 'react';
import { FolderTree, Tag, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { apiAddCategory, apiUpdateCategory, apiDeleteCategory, type CategoryNode } from '@/api/services/categories';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, ImageUpload, Toggle } from '@/components/comman/ui';
import { ActionMenu, type ActionMenuItem } from '@/components/comman/ui/ActionMenu';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';

// A store now owns its own category tree entirely — created freely by the
// seller, at their own discretion (no admin gate, unlike the old fixed
// "main category chosen at onboarding" model). `parentId` set → this adds a
// subcategory under that root; omitted → this adds a new root category.
// `category` present → editing that existing category instead of creating a
// new one (name/description/image only — `parentId` never changes once set).
function CategoryFormModal({ storeId, parentId, category, onClose, onSaved }: {
  storeId: string; parentId?: string; category?: CategoryNode | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName]               = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [image, setImage]             = useState(category?.image ?? '');
  // Real backend support for this already existed (UpdateCategoryPayload.isActive,
  // CategoriesService.updateCategory) — the only way to make a category
  // disappear was a hard delete (blocked outright if anything still
  // references it), with no way to just temporarily hide a seasonal one
  // and bring it back later. Found during the Catalog audit.
  const [isActive, setIsActive]       = useState(category ? category.status !== 'inactive' : true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  async function submit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      if (category) {
        await apiUpdateCategory(category._id, storeId, {
          name: name.trim(), description: description.trim() || undefined, image: image.trim() || undefined, isActive,
        });
      } else {
        await apiAddCategory({
          name: name.trim(), storeId, parentId,
          description: description.trim() || undefined, image: image.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={category ? 'Edit Category' : parentId ? 'Add Subcategory' : 'Add Category'}
      width={460}
      onClose={onClose}
      mobileSheet
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{category ? 'Save' : 'Create'}</Button>
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
        {category && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12.5px] font-medium text-charcoal">Active</p>
              <p className="text-[11px] text-slate">Hide this category from your storefront without deleting it.</p>
            </div>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel="Category active" />
          </div>
        )}
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

function ReorderButtons({ onUp, onDown }: { onUp?: () => void; onDown?: () => void }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button type="button" onClick={onUp} disabled={!onUp} aria-label="Move up"
        className="text-slate bg-transparent border-none cursor-pointer p-1 disabled:opacity-25 disabled:cursor-not-allowed hover:text-charcoal">
        <ArrowUp size={14} />
      </button>
      <button type="button" onClick={onDown} disabled={!onDown} aria-label="Move down"
        className="text-slate bg-transparent border-none cursor-pointer p-1 disabled:opacity-25 disabled:cursor-not-allowed hover:text-charcoal">
        <ArrowDown size={14} />
      </button>
    </div>
  );
}

function CategoryCard({ category, onAddSub, onEdit, onDelete, onMoveUp, onMoveDown, onReorderSub }: {
  category: CategoryNode;
  onAddSub: (parentId: string) => void;
  onEdit: (category: CategoryNode) => void;
  onDelete: (category: CategoryNode) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Reorders one of this category's own subcategories among its siblings —
   *  `sortOrder` existed on the schema all along but nothing ever read or
   *  wrote it from the UI (found during the Catalog audit). */
  onReorderSub: (siblings: CategoryNode[], index: number, direction: 'up' | 'down') => void;
}) {
  const rootActions: ActionMenuItem[] = [
    { label: 'Edit', onClick: () => onEdit(category) },
    { label: 'Delete', danger: true, onClick: () => onDelete(category) },
  ];

  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-[14px] border-b border-bone flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ReorderButtons onUp={onMoveUp} onDown={onMoveDown} />
          <div className="w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
            <FolderTree size={16} style={{ color: '#D97757' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-carbon truncate">{category.name}</p>
            {category.description && <p className="text-[11px] text-slate truncate max-w-[320px]">{category.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button icon={<Plus size={13} />} size="sm" variant="outline" onClick={() => onAddSub(category._id)}>
            Add Subcategory
          </Button>
          <ActionMenu items={rootActions} />
        </div>
      </div>

      {category.children.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12.5px] text-slate">No subcategories yet.</p>
      ) : (
        <div className="flex flex-col">
          {category.children.map((sub, i) => {
            const subActions: ActionMenuItem[] = [
              { label: 'Edit', onClick: () => onEdit(sub) },
              { label: 'Delete', danger: true, onClick: () => onDelete(sub) },
            ];
            return (
              <div key={sub._id} className="flex items-center gap-2.5 px-5 py-3 border-b border-[#f0eee6] last:border-b-0 transition-colors duration-150 hover:bg-cream">
                <ReorderButtons
                  onUp={i > 0 ? () => onReorderSub(category.children, i, 'up') : undefined}
                  onDown={i < category.children.length - 1 ? () => onReorderSub(category.children, i, 'down') : undefined}
                />
                <Tag size={13} className="text-slate shrink-0" />
                <span className="text-[13px] font-medium text-carbon flex-1 truncate">{sub.name}</span>
                {sub.description && <span className="hidden sm:inline text-[11px] text-slate truncate max-w-[220px]">{sub.description}</span>}
                <ActionMenu items={subActions} />
              </div>
            );
          })}
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
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleReorder(siblings: CategoryNode[], index: number, direction: 'up' | 'down') {
    if (!store) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const a = siblings[index];
    const b = siblings[targetIndex];
    // Swap by POSITION, not by each item's existing stored sortOrder value —
    // every pre-existing category defaults to sortOrder 0 (never previously
    // written from any UI), so swapping two identical 0s would silently do
    // nothing. Assigning each side the other's current array index always
    // produces a real, distinct change.
    await Promise.all([
      apiUpdateCategory(a._id, store._id, { sortOrder: targetIndex }),
      apiUpdateCategory(b._id, store._id, { sortOrder: index }),
    ]);
    refetch();
  }

  async function confirmDelete() {
    if (!pendingDelete || !store) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDeleteCategory(pendingDelete._id, store._id);
      setPendingDelete(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  }

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
          tree.map((cat, i) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              onAddSub={id => setAdding(id)}
              onEdit={c => setEditing(c)}
              onDelete={c => { setDeleteError(''); setPendingDelete(c); }}
              onMoveUp={i > 0 ? () => handleReorder(tree, i, 'up') : undefined}
              onMoveDown={i < tree.length - 1 ? () => handleReorder(tree, i, 'down') : undefined}
              onReorderSub={handleReorder}
            />
          ))
        )}
      </div>

      {adding !== undefined && store && (
        <CategoryFormModal
          storeId={store._id}
          parentId={adding ?? undefined}
          onClose={() => setAdding(undefined)}
          onSaved={() => { setAdding(undefined); refetch(); }}
        />
      )}

      {editing && store && (
        <CategoryFormModal
          storeId={store._id}
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${pendingDelete.name}"? This can't be undone.`}
          confirmLabel="Delete Category"
          loading={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        >
          {/* The original question above stays visible even after a failed
              attempt — it used to be fully REPLACED by the error text, so a
              seller re-reading the dialog after a failure lost the "are you
              sure" context entirely (found during the Catalog audit). */}
          {deleteError && <p className="text-[12px] text-error mt-2">{deleteError}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
