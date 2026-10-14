import { useId, useState } from 'react';
import { FolderTree, Tag, Plus, ArrowUp, ArrowDown, ChevronDown, Search, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { apiAddCategory, apiUpdateCategory, apiDeleteCategory, type CategoryNode } from '@/api/services/categories';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { can } from '@/hooks/auth/useCan';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, ImageUpload, Toggle } from '@/components/comman/ui';
import { ActionMenu, type ActionMenuItem } from '@/components/comman/ui/ActionMenu';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

// Flat look: no drop shadow on panels or buttons (same scoped classes as NotificationsHub), header buttons included.
const NO_SHADOWS = '[&_.surface-panel]:!shadow-none [&_.surface-panel:hover]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none';

// A store now owns its own category tree entirely — created freely by the
// seller, at their own discretion (no admin gate, unlike the old fixed
// "main category chosen at onboarding" model). `parentId` set → this adds a
// subcategory under that root; omitted → this adds a new root category.
// `category` present → editing that existing category instead of creating a
// new one (name/description/image only — `parentId` never changes once set).
function CategoryFormModal({ storeId, parentId, category, onClose, onSaved }: {
  storeId: string; parentId?: string; category?: CategoryNode | null; onClose: () => void; onSaved: () => void;
}) {
  const uid = useId();
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
          <label htmlFor={`${uid}-name`} className="text-[12px] font-medium text-charcoal block mb-1.5">Name</label>
          <input id={`${uid}-name`} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ceramics"
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label htmlFor={`${uid}-desc`} className="text-[12px] font-medium text-charcoal block mb-1.5">Description (optional)</label>
          <textarea id={`${uid}-desc`} rows={2} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white resize-y transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-charcoal block mb-1.5">Image (optional)</p>
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

const isHidden = (c: CategoryNode) => c.status === 'inactive';

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'warn' }) {
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={tone === 'warn' ? { background: '#FEF3C7', color: '#92400E' } : { background: '#F1EFE7', color: '#6B6960' }}
    >
      {children}
    </span>
  );
}

const COLLAPSED_SUBS = 5;

function CategoryCard({ category, subs, searching, busy, readOnly, onAddSub, onEdit, onDelete, onMoveUp, onMoveDown, onReorderSub }: {
  category: CategoryNode;
  /** The subcategories to show — all of them, or only the ones matching the search. */
  subs: CategoryNode[];
  searching: boolean;
  busy: boolean;
  /** A staff role that may look but not change categories (no `categories.manage`). */
  readOnly: boolean;
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
  const [expanded, setExpanded] = useState(false);
  const rootActions: ActionMenuItem[] = [
    { label: 'Edit', onClick: () => onEdit(category) },
    { label: 'Delete', danger: true, onClick: () => onDelete(category) },
  ];
  const visibleSubs = expanded || searching ? subs : subs.slice(0, COLLAPSED_SUBS);
  const hiddenCount = subs.length - visibleSubs.length;
  const total = category.children.length;

  return (
    <div className="bg-white border border-bone rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-bone flex items-start gap-3">
        {!readOnly && <ReorderButtons onUp={busy ? undefined : onMoveUp} onDown={busy ? undefined : onMoveDown} />}
        <div className="w-11 h-11 rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0 overflow-hidden">
          {category.image
            ? <img src={category.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            : <FolderTree size={18} style={{ color: '#D97757' }} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold text-carbon break-words min-w-0">{category.name}</p>
            {isHidden(category) && <Pill tone="warn">Hidden</Pill>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <Pill>{total} {total === 1 ? 'subcategory' : 'subcategories'}</Pill>
            {typeof category.productCount === 'number' && <Pill>{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</Pill>}
          </div>
          {category.description && <p className="text-[11.5px] text-slate mt-1.5 line-clamp-2 break-words">{category.description}</p>}
        </div>
        {!readOnly && <ActionMenu items={rootActions} />}
      </div>

      {total === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-[12.5px] text-slate">No subcategories yet.</p>
          {!readOnly && <button type="button" onClick={() => onAddSub(category._id)} className="mt-1.5 text-[12.5px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer">
            Add the first one
          </button>}
        </div>
      ) : (
        <div className="flex flex-col">
          {visibleSubs.map(sub => {
            const subActions: ActionMenuItem[] = [
              { label: 'Edit', onClick: () => onEdit(sub) },
              { label: 'Delete', danger: true, onClick: () => onDelete(sub) },
            ];
            const i = category.children.findIndex(c => c._id === sub._id);
            const reorderable = !searching && !busy;
            return (
              <div key={sub._id} className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 border-b border-[#f0eee6] last:border-b-0 transition-colors duration-150 hover:bg-cream">
                {!readOnly && <ReorderButtons
                  onUp={reorderable && i > 0 ? () => onReorderSub(category.children, i, 'up') : undefined}
                  onDown={reorderable && i < total - 1 ? () => onReorderSub(category.children, i, 'down') : undefined}
                />}
                <Tag size={13} className="text-slate shrink-0" />
                <span className="text-[13px] font-medium text-carbon flex-1 truncate">{sub.name}</span>
                {isHidden(sub) && <Pill tone="warn">Hidden</Pill>}
                {typeof sub.productCount === 'number' && <span className="hidden sm:inline text-[11.5px] text-slate shrink-0">{sub.productCount} {sub.productCount === 1 ? 'product' : 'products'}</span>}
                {!readOnly && <ActionMenu items={subActions} />}
              </div>
            );
          })}
          {!searching && subs.length > COLLAPSED_SUBS && (
            <button
              type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 border-t border-[#f0eee6] bg-transparent border-x-0 border-b-0 text-[12px] font-semibold text-brand-orange cursor-pointer hover:bg-cream"
            >
              {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
              <ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          )}
        </div>
      )}

      {total > 0 && !readOnly && (
        <button
          type="button" onClick={() => onAddSub(category._id)}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 border-0 border-t border-bone bg-cream/60 text-[12.5px] font-semibold text-brand-orange cursor-pointer hover:bg-cream"
        >
          <Plus size={13} /> Add subcategory
        </button>
      )}
    </div>
  );
}

export default function StoreCategories() {
  const { store } = useStoreWorkspace();
  const toast = useToast();
  const { tree, loading, error, refetch } = useStoreCategoryTree(store?._id);
  // undefined = closed, null = adding a root category, string = adding a
  // subcategory under that root's id.
  const [adding, setAdding] = useState<string | null | undefined>(undefined);
  const canManage = can('categories.manage');
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [reordering, setReordering] = useState(false);
  const [query, setQuery] = useState('');

  async function handleReorder(siblings: CategoryNode[], index: number, direction: 'up' | 'down') {
    if (!store || reordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const a = siblings[index];
    const b = siblings[targetIndex];
    setReordering(true);
    try {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change the order. Try again.');
      refetch();
    } finally {
      setReordering(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !store) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDeleteCategory(pendingDelete._id, store._id);
      toast.success(`"${pendingDelete.name}" deleted.`);
      setPendingDelete(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  }

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const rows = tree
    .map(cat => {
      const rootMatches = cat.name.toLowerCase().includes(q);
      const matchingSubs = cat.children.filter(s => s.name.toLowerCase().includes(q));
      return { cat, subs: rootMatches ? cat.children : matchingSubs, show: !searching || rootMatches || matchingSubs.length > 0 };
    })
    .filter(r => r.show);
  const subTotal = tree.reduce((n, c) => n + c.children.length, 0);

  return (
    <div className={NO_SHADOWS}>
      <StorePageHeader
        title="Categories"
        subtitle="Your store's own categories — organize your products however makes sense to you."
        actions={
          <div className="flex items-center gap-2">
            {store && canManage && (
              <BulkImportButton
                entityLabel="categories"
                basePath={`/api/categories/store/${store._id}`}
                onImported={refetch}
                notes={[
                  'A category that already exists under the same parent (same name) is skipped, not duplicated.',
                  'Parent must be a main category — list it earlier in the file or create it first. Only one level of nesting is allowed.',
                ]}
              />
            )}
            {canManage && <Button icon={<Plus size={14} />} size="sm" onClick={() => setAdding(null)} disabled={!store}>
              Add Category
            </Button>}
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-4 w-full">
        {!loading && !error && tree.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full sm:w-[340px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
              <input
                value={query} onChange={e => setQuery(e.target.value)} placeholder="Search categories" aria-label="Search categories"
                className="w-full pl-9 pr-8 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50"
              />
              {searching && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none cursor-pointer text-slate hover:text-charcoal">
                  <X size={13} />
                </button>
              )}
            </div>
            <p className="text-[12px] text-slate">
              <b className="text-charcoal">{tree.length}</b> {tree.length === 1 ? 'category' : 'categories'} · <b className="text-charcoal">{subTotal}</b> {subTotal === 1 ? 'subcategory' : 'subcategories'}
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))]" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-bone rounded-xl px-5 py-4 flex items-center gap-3">
                <SkeletonBox width={44} height={44} rounded="10px" />
                <div className="flex flex-col gap-2">
                  <SkeletonBox height={14} width={140} rounded="4px" />
                  <SkeletonBox height={10} width={90} rounded="4px" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="bg-white border border-bone rounded-xl p-4 flex items-center gap-3 text-[13px] text-error">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={refetch} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bone bg-white text-[12px] font-semibold text-charcoal cursor-pointer">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div className="bg-white border border-bone rounded-xl px-5 py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-pale-orange flex items-center justify-center mx-auto mb-3">
              <FolderTree size={22} style={{ color: '#D97757' }} />
            </div>
            <p className="text-[14px] font-semibold text-carbon mb-1">No categories yet</p>
            <p className="text-[12.5px] text-slate mb-4 max-w-[380px] mx-auto">Create your first category to organize products, or import many at once from a CSV file.</p>
            {canManage && <Button icon={<Plus size={13} />} size="sm" onClick={() => setAdding(null)} disabled={!store} className="mx-auto">
              Add Category
            </Button>}
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-bone rounded-xl px-5 py-12 text-center">
            <p className="text-[13.5px] font-semibold text-carbon mb-1">No matches for &quot;{query.trim()}&quot;</p>
            <button type="button" onClick={() => setQuery('')} className="text-[12.5px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer">Clear search</button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] items-start">
            {rows.map(({ cat, subs }) => {
              const i = tree.findIndex(c => c._id === cat._id);
              return (
                <CategoryCard
                  key={cat._id}
                  category={cat}
                  subs={subs}
                  searching={searching}
                  busy={reordering}
                  readOnly={!canManage}
                  onAddSub={id => setAdding(id)}
                  onEdit={c => setEditing(c)}
                  onDelete={c => { setDeleteError(''); setPendingDelete(c); }}
                  onMoveUp={!searching && i > 0 ? () => handleReorder(tree, i, 'up') : undefined}
                  onMoveDown={!searching && i < tree.length - 1 ? () => handleReorder(tree, i, 'down') : undefined}
                  onReorderSub={handleReorder}
                />
              );
            })}
          </div>
        )}
      </div>

      {adding !== undefined && store && (
        <CategoryFormModal
          storeId={store._id}
          parentId={adding ?? undefined}
          onClose={() => setAdding(undefined)}
          onSaved={() => { setAdding(undefined); toast.success('Category saved.'); refetch(); }}
        />
      )}

      {editing && store && (
        <CategoryFormModal
          storeId={store._id}
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); toast.success('Category updated.'); refetch(); }}
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
          {typeof pendingDelete.productCount === 'number' && pendingDelete.productCount > 0 && (
            <p className="text-[12px] text-slate mt-2">It still has {pendingDelete.productCount} {pendingDelete.productCount === 1 ? 'product' : 'products'}. Move them to another category first if the delete is refused.</p>
          )}
          {deleteError && <p className="text-[12px] text-error mt-2">{deleteError}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
