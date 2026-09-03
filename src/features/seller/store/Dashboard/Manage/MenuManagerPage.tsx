import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Menu as MenuIcon } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Modal, Field, Toggle, EmptyState } from '@/components/comman/ui';
import { LinkTargetFields, type LinkTarget } from '@/features/seller/store/Dashboard/OnlineStore/builder/LinkTargetFields';
import { SortableList } from '@/features/seller/store/Dashboard/OnlineStore/builder/Sortable';
import { apiListStorePages } from '@/api/services/storePages';
import {
  apiListMenus, apiCreateMenu, apiUpdateMenu, apiDeleteMenu,
  type Menu, type MenuItem, type MenuItemChild,
} from '@/api/services/menus';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function newItem(): MenuItem {
  return { id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: '', linkType: 'home', children: [] };
}

/** One top-level item — label + link target + highlight + its own (single-
 *  level) dropdown children, the exact same shape/depth `nav_link` blocks
 *  already support in the Header/Footer editor. Kept as its own component
 *  since it recurses one level for children, reusing `LinkTargetFields`/
 *  `SortableList` rather than a bespoke duplicate editor. */
function MenuItemEditor({ item, onChange, onRemove, pageOptions, storeId }: {
  item: MenuItem;
  onChange: (next: MenuItem) => void;
  onRemove: () => void;
  pageOptions: { slug: string; title: string }[];
  storeId: string;
}) {
  const children = item.children ?? [];
  return (
    <div className="border border-bone rounded-lg p-3 bg-white relative">
      <button type="button" onClick={onRemove}
        className="absolute top-2 right-2 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
      <div className="flex flex-col gap-2 pr-14">
        <Field label="Label"><input className={inp} value={item.label} onChange={e => onChange({ ...item, label: e.target.value })} /></Field>
        <LinkTargetFields value={item as LinkTarget} onChange={next => onChange({ ...item, ...next })} pageOptions={pageOptions} storeId={storeId} />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-charcoal">Highlight as button</span>
          <Toggle checked={!!item.highlight} onChange={v => onChange({ ...item, highlight: v })} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-bone">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Dropdown items</p>
        {children.length === 0 && <p className="text-[12px] text-slate">No dropdown — this link goes straight to its target above.</p>}
        <SortableList<MenuItemChild> items={children} keyFor={c => c.id} onReorder={next => onChange({ ...item, children: next })}>
          {(child, i) => (
            <div className="border border-bone rounded-lg p-2 relative bg-cream/40">
              <button type="button" onClick={() => onChange({ ...item, children: children.filter((_, j) => j !== i) })}
                className="absolute top-1 right-1 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
              <Field label="Label"><input className={inp} value={child.label} onChange={e => onChange({ ...item, children: children.map((c, j) => j === i ? { ...c, label: e.target.value } : c) })} /></Field>
              <LinkTargetFields value={child} onChange={next => onChange({ ...item, children: children.map((c, j) => j === i ? { ...c, ...next } : c) })} pageOptions={pageOptions} storeId={storeId} />
            </div>
          )}
        </SortableList>
        {children.length < 8 && (
          <button type="button" onClick={() => onChange({ ...item, children: [...children, { id: `new-${Date.now()}`, label: '', linkType: 'home' }] })}
            className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add dropdown item</button>
        )}
      </div>
    </div>
  );
}

function MenuEditorModal({ storeId, menu, pageOptions, onClose, onSaved }: {
  storeId: string;
  menu: Menu | null; // null = creating a new menu
  pageOptions: { slug: string; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(menu?.name ?? '');
  const [items, setItems] = useState<MenuItem[]>(menu?.items ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Menu name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (menu) await apiUpdateMenu(storeId, menu._id, { name: name.trim(), items });
      else await apiCreateMenu(storeId, { name: name.trim(), items });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this menu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={menu ? 'Edit Menu' : 'New Menu'} width={560}>
      <div className="flex flex-col gap-3">
        <Field label="Menu name"><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Main menu" /></Field>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Items</p>
          <SortableList<MenuItem> items={items} keyFor={i => i.id} onReorder={setItems}>
            {(item, i) => (
              <MenuItemEditor
                item={item}
                storeId={storeId}
                pageOptions={pageOptions}
                onChange={next => setItems(items.map((it, j) => j === i ? next : it))}
                onRemove={() => setItems(items.filter((_, j) => j !== i))}
              />
            )}
          </SortableList>
          {items.length < 50 && (
            <button type="button" onClick={() => setItems([...items, newItem()])}
              className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add item</button>
          )}
        </div>

        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save Menu</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Seller-facing manager for standalone, reusable Menus — the real gap
 *  this closes: nav links previously lived only embedded inside the
 *  Header/Footer editor, one-off, with no way to build a menu independent
 *  of "the Header's own blocks." Header attachment (see
 *  `AtelierHeaderFooterPage.tsx`'s "Navigation source" picker) is the
 *  first real consumer — a store's public navbar renders an attached
 *  menu's real items, resolved server-side. */
export function MenuManagerPage() {
  const { storeId } = useStoreWorkspace();
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [pageOptions, setPageOptions] = useState<{ slug: string; title: string }[]>([]);
  const [editing, setEditing] = useState<Menu | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Menu | null>(null);

  const load = useCallback(() => {
    apiListMenus(storeId).then(res => setMenus(res.data)).catch(() => setMenus([]));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiListStorePages(storeId).then(res => setPageOptions(res.data.map(p => ({ slug: p.slug, title: p.title })))).catch(() => setPageOptions([]));
  }, [storeId]);

  const handleDelete = async () => {
    if (!deleting) return;
    await apiDeleteMenu(storeId, deleting._id);
    setDeleting(null);
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <StorePageHeader
        title="Menus"
        subtitle="Build reusable navigation menus, then attach one to your storefront's header."
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setEditing('new')}>
            New Menu
          </Button>
        )}
      />

      {menus === null ? null : menus.length === 0 ? (
        <EmptyState
          icon={<MenuIcon size={28} />}
          title="No menus yet"
          description="Create one, then attach it to your header from the Header tab in Themes → Customize."
          action={{ label: 'New Menu', icon: <Plus size={14} />, onClick: () => setEditing('new') }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {menus.map(m => (
            <div key={m._id} className="flex items-center gap-3 bg-white border border-bone rounded-lg px-4 py-3">
              <span className="text-[13px] font-semibold text-charcoal flex-1">{m.name}</span>
              <span className="text-[12px] text-slate">{m.items.length} item{m.items.length === 1 ? '' : 's'}</span>
              <button type="button" onClick={() => setEditing(m)}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer">
                Edit
              </button>
              <button type="button" onClick={() => setDeleting(m)} aria-label={`Delete ${m.name}`}
                className="text-error bg-transparent border-none cursor-pointer p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MenuEditorModal
          storeId={storeId}
          menu={editing === 'new' ? null : editing}
          pageOptions={pageOptions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete this menu?">
          <p className="text-[13px] text-slate mb-4">
            "{deleting.name}" will be permanently removed. If it's attached to your header, the header falls back to its own saved links.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
