import { useMemo } from 'react';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { flattenCategories } from './specVisibility';

/** "This spec is for ..." — the store's categories as checkboxes. Nothing ticked = every product. */
export function SpecCategoryPicker({ storeId, selected, onChange }: { storeId: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const { tree, loading, error } = useStoreCategoryTree(storeId);
  const options = useMemo(() => flattenCategories(tree), [tree]);
  if (loading) return <p className="m-0 text-[12px] text-slate">Loading categories…</p>;
  if (error) return <p className="m-0 text-[12px] text-error">{error}</p>;
  if (options.length === 0) return <p className="m-0 text-[12px] text-slate">You have no categories yet, so this spec is for every product.</p>;
  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Categories this spec is for">
      <p className="m-0 mb-1 text-[12px] text-slate">{selected.length === 0 ? 'Nothing ticked: every product gets this spec.' : 'Only products in the ticked categories get this spec.'}</p>
      <div className="max-h-[260px] overflow-y-auto rounded-lg border border-bone px-3 py-2">
        {options.map(o => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-charcoal" style={{ paddingLeft: o.depth * 18 }}>
            <input type="checkbox" checked={selected.includes(o.id)} onChange={e => onChange(e.target.checked ? [...selected, o.id] : selected.filter(x => x !== o.id))} />
            {o.name}
          </label>
        ))}
      </div>
    </div>
  );
}
