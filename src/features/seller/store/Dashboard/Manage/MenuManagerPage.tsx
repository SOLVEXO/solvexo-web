import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Menu as MenuIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Modal, Field, Toggle, EmptyState, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { LinkTargetFields, type LinkTarget } from '@/features/seller/store/Dashboard/OnlineStore/builder/LinkTargetFields';
import { SortableList } from '@/features/seller/store/Dashboard/OnlineStore/builder/Sortable';
import { MenuStyleField, MenuImageField } from '@/features/seller/store/Dashboard/OnlineStore/builder/MenuItemExtraFields';
import { apiListStorePages } from '@/api/services/storePages';
import {
  apiListMenus, apiCreateMenu, apiUpdateMenu, apiDeleteMenu,
  type Menu, type MenuItem, type MenuItemChild,
} from '@/api/services/menus';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function newItem(): MenuItem {
  return { id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: '', linkType: 'home', children: [] };
}

/** One menu item — label + link target + highlight + its own nested
 *  children (up to three levels, the exact same shape/depth `nav_link`
 *  blocks support in the Header/Footer editor). Top-level items choose how
 *  their children are shown (dropdown or mega menu); inside a mega menu each
 *  child/grandchild can carry a tile image. Recurses for children, reusing
 *  `LinkTargetFields`/`SortableList` rather than a bespoke duplicate editor. */
function MenuItemEditor({ item, onChange, onRemove, pageOptions, storeId, depth = 1, parentMega = false, bulk }: {
  item: MenuItem;
  onChange: (next: MenuItem) => void;
  onRemove: () => void;
  pageOptions: { slug: string; title: string }[];
  storeId: string;
  depth?: number;
  /** True when the top-level ancestor is a mega menu (enables the tile image field). */
  parentMega?: boolean;
  /** Collapse-all / expand-all request from the modal; `n` changes on every click. */
  bulk?: { open: boolean; n: number };
}) {
  const children = item.children ?? [];
  const mega = depth === 1 ? item.menuStyle === 'mega' : parentMega;
  // Freshly added items start open so the label can be typed straight away; saved ones start collapsed.
  const [open, setOpen] = useState(() => item.id.startsWith('new-'));
  useEffect(() => { if (bulk && bulk.n > 0) setOpen(bulk.open); }, [bulk]);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="border border-bone rounded-lg p-3 bg-white relative">
      <button type="button" onClick={onRemove}
        className="absolute top-2 right-2 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        aria-label={open ? 'Collapse item' : 'Expand item'}
        className="flex items-center gap-2 w-full pr-14 bg-transparent border-none cursor-pointer text-left p-0">
        <Chevron size={16} className="text-slate shrink-0" />
        <span className="text-[13px] font-semibold text-charcoal truncate">{item.label.trim() || '(no label)'}</span>
        {!open && (
          <span className="text-[11px] text-slate truncate">
            {item.linkType}{children.length > 0 ? ` · ${children.length} item${children.length === 1 ? '' : 's'}` : ''}
          </span>
        )}
      </button>
      {open && <>
      <div className="flex flex-col gap-2 pr-14 mt-2">
        <Field label="Label"><input className={inp} value={item.label} onChange={e => onChange({ ...item, label: e.target.value })} /></Field>
        <LinkTargetFields value={item as LinkTarget} onChange={next => onChange({ ...item, ...next })} pageOptions={pageOptions} storeId={storeId} />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-charcoal">Highlight as button</span>
          <Toggle checked={!!item.highlight} onChange={v => onChange({ ...item, highlight: v })} />
        </div>
        {depth === 1 && (
          <MenuStyleField value={item.menuStyle} onChange={menuStyle => onChange({ ...item, menuStyle })} hasChildren={children.length > 0} />
        )}
        {depth > 1 && mega && (
          <MenuImageField value={item.imageUrl} onChange={imageUrl => onChange({ ...item, imageUrl })} storeId={storeId} />
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-bone">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">{depth === 1 ? 'Dropdown items' : `Level ${depth + 1} items`}</p>
        {children.length === 0 && <p className="text-[12px] text-slate">No dropdown — this link goes straight to its target above.</p>}
        <SortableList<MenuItemChild> items={children} keyFor={c => c.id} onReorder={next => onChange({ ...item, children: next })}>
          {(child, i) => (
            <MenuItemEditor
              item={child}
              depth={depth + 1}
              parentMega={mega}
              bulk={bulk}
              storeId={storeId}
              pageOptions={pageOptions}
              onChange={next => onChange({ ...item, children: children.map((c, j) => j === i ? { ...c, ...next } : c) })}
              onRemove={() => onChange({ ...item, children: children.filter((_, j) => j !== i) })}
            />
          )}
        </SortableList>
        {depth < 3 && (
          <button type="button" onClick={() => onChange({ ...item, children: [...children, { id: `new-${Date.now()}`, label: '', linkType: 'home' }] })}
            className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add dropdown item</button>
        )}
      </div>
      </>}
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
  const [bulk, setBulk] = useState({ open: false, n: 0 });

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
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Items</p>
            {items.length > 0 && (
              <div className="flex gap-3">
                <button type="button" onClick={() => setBulk(b => ({ open: false, n: b.n + 1 }))}
                  className="text-[11px] text-slate bg-transparent border-none cursor-pointer">Collapse all</button>
                <button type="button" onClick={() => setBulk(b => ({ open: true, n: b.n + 1 }))}
                  className="text-[11px] text-slate bg-transparent border-none cursor-pointer">Expand all</button>
              </div>
            )}
          </div>
          <SortableList<MenuItem> items={items} keyFor={i => i.id} onReorder={setItems}>
            {(item, i) => (
              <MenuItemEditor
                item={item}
                bulk={bulk}
                storeId={storeId}
                pageOptions={pageOptions}
                onChange={next => setItems(items.map((it, j) => j === i ? next : it))}
                onRemove={() => setItems(items.filter((_, j) => j !== i))}
              />
            )}
          </SortableList>
          <button type="button" onClick={() => setItems([...items, newItem()])}
            className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add item</button>
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
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    setLoadError('');
    apiListMenus(storeId)
      .then(res => setMenus(res.data))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Could not load your menus.'));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiListStorePages(storeId).then(res => setPageOptions(res.data.map(p => ({ slug: p.slug, title: p.title })))).catch(() => setPageOptions([]));
  }, [storeId]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await apiDeleteMenu(storeId, deleting._id);
      setDeleting(null);
      toast.success('Menu deleted.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this menu.');
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <StorePageHeader
        title="Menus"
        subtitle="Build reusable navigation menus, then attach one to your storefront's header or footer."
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setEditing('new')}>
            New Menu
          </Button>
        )}
      />

      <div className="px-4 md:px-7 py-5">
      {loadError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-[13px] text-slate">{loadError}</p>
          <Button onClick={load}>Retry</Button>
        </div>
      ) : menus === null ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={52} rounded="10px" />)}</div>
      ) : menus.length === 0 ? (
        <EmptyState
          icon={<MenuIcon size={28} />}
          title="No menus yet"
          description="Create one, then attach it to your header or footer in Themes → Header & Footer."
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
      </div>

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
            <Button variant="danger" onClick={handleDelete} loading={deletingBusy}>Delete</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
