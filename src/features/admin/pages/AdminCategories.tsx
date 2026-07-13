import { useEffect, useState } from 'react';
import { Plus, ChevronRight, FolderTree, Tag } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { apiGetCategoryTree, apiAddCategory, type CategoryNode } from '@/api/services/categories';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input, Textarea, Select } from '@/components/comman/ui/Input';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';

// ── Add Category modal ───────────────────────────────────────────────────────
// Admins can create either a main category (no parent) or a subcategory under
// an existing main category — never deeper than one level (server-enforced).
function AddCategoryModal({ mainCategories, onClose, onSaved }: {
  mainCategories: CategoryNode[]; onClose: () => void; onSaved: () => void;
}) {
  const [parentId,    setParentId]    = useState('');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [image,       setImage]       = useState('');
  const [sortOrder,   setSortOrder]   = useState('0');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  async function submit() {
    if (!name.trim()) { setError('Category name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiAddCategory({
        name: name.trim(),
        parentId: parentId || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Category"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create Category</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Parent Category" value={parentId} onChange={e => setParentId(e.target.value)}>
          <option value="">None — create as a main category</option>
          {mainCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="Name" placeholder="e.g. Electronics" value={name} onChange={e => setName(e.target.value)} />
        <Textarea label="Description (optional)" rows={3} placeholder="Describe this category…" value={description} onChange={e => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Image URL (optional)" placeholder="https://…" value={image} onChange={e => setImage(e.target.value)} />
          <Input label="Sort Order" type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Tree row ──────────────────────────────────────────────────────────────────
function CategoryRow({ node, depth }: { node: CategoryNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-[10px] border-b border-[#F0EEE6] hover:bg-cream cursor-pointer transition-colors duration-150"
        style={{ paddingLeft: 16 + depth * 24 }}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {hasChildren ? (
          <ChevronRight size={13} className="text-slate shrink-0 transition-transform duration-150" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }} />
        ) : (
          <span className="w-[13px] shrink-0" />
        )}
        {depth === 0
          ? <FolderTree size={14} className="text-brand-orange shrink-0" />
          : <Tag size={12} className="text-slate shrink-0" />}
        <span className={depth === 0 ? 'text-[13px] font-semibold text-charcoal' : 'text-[13px] text-graphite'}>{node.name}</span>
        {node.createdByRole && (
          <span className="text-[10px] text-slate capitalize ml-1">· added by {node.createdByRole}</span>
        )}
        {!hasChildren && depth === 0 && (
          <span className="text-[11px] text-slate ml-1">· no subcategories</span>
        )}
      </div>
      {expanded && node.children.map(child => (
        <CategoryRow key={child._id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminCategories() {
  usePageTitle('Categories');
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    apiGetCategoryTree()
      .then(res => setTree(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load categories.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const countAll = (nodes: CategoryNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countAll(n.children), 0);

  const totalMain = tree.length;
  const totalSubs = countAll(tree) - totalMain;

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Categories</h1>
          <p className="text-[12px] text-slate mt-[2px]">{totalMain} main categories · {totalSubs} subcategories</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setAdding(true)}>Add Category</Button>
      </div>

      <div className="px-7 pt-5 pb-8">
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          {loading ? (
            <div className="px-4 py-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-6 w-full" />)}
            </div>
          ) : error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={<FolderTree size={28} className="text-slate" />}
              title="No categories yet"
              description="Create the first main category to get started."
            />
          ) : (
            tree.map(cat => <CategoryRow key={cat._id} node={cat} depth={0} />)
          )}
        </div>

        <p className="text-[12px] text-slate mt-4 leading-[1.6] max-w-[640px]">
          Main categories are the curated top-level taxonomy sellers choose from when creating a store.
          Subcategories can be nested one level under a main category — sellers may also add their own
          subcategories from their dashboard. Editing and deleting categories isn't supported yet.
        </p>
      </div>

      {adding && (
        <AddCategoryModal
          mainCategories={tree}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); load(); }}
        />
      )}
    </div>
  );
}
