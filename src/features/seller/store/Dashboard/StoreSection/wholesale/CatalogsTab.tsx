import { useEffect, useState } from 'react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { apiGetMyProductById, apiGetStoreInventory, type InventoryProduct, type ProductVariant } from '@/api/services/product';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Input, Select, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from './ErrorLine';
import type { CatalogRow } from './CompaniesTab';
import { PAGE_SIZE, usePaged } from './wholesaleUtils';

interface Catalog extends CatalogRow { defaultAdjustmentPercent: number | null; includeAllProducts: boolean; itemCount: number }
interface Item {
  _id: string; productId: string; variantId: string; available: boolean; fixedPrice: number | null; adjustmentPercent: number | null;
  minQty: number | null; maxQty: number | null; increment: number | null; priceBreaks: { minQty: number; price: number }[];
}

export function CatalogsTab({ storeId, catalogs, reload }: { storeId: string; catalogs: Catalog[] | undefined; reload: () => void }) {
  const base = `/api/b2b/${storeId}`;
  const canEdit = can('b2b.manage');
  const toast = useToast();
  const [editing, setEditing] = useState<Catalog | 'new' | null>(null);
  const [itemsFor, setItemsFor] = useState<Catalog | null>(null);

  async function remove(c: Catalog) {
    try { await client.delete(`${base}/catalogs/${c._id}`); toast.success('Catalog deleted'); reload(); } catch (e) { toast.error(errorMessage(e)); }
  }
  const columns: TableColumn<Catalog>[] = [
    { key: 'name', header: 'Catalog', render: (c) => <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-carbon underline-offset-2 hover:underline" onClick={() => setItemsFor(c)}>{c.name}</button> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
    { key: 'items', header: 'Variants', render: (c) => (c.includeAllProducts ? `${c.itemCount} set · all products available` : String(c.itemCount)) },
    { key: 'pct', header: 'Default price change', render: (c) => (c.defaultAdjustmentPercent == null ? '—' : `${c.defaultAdjustmentPercent > 0 ? '+' : ''}${c.defaultAdjustmentPercent}%`) },
    { key: 'a', header: 'Actions', align: 'right', render: (c) => (canEdit ? (
      <div className="flex justify-end gap-2"><Button size="xs" variant="outline" onClick={() => setEditing(c)}>Edit</Button><Button size="xs" variant="outline" onClick={() => void remove(c)}>Delete</Button></div>
    ) : null) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <p className="m-0 flex-1 text-[13px] text-slate">A catalog sets which products a company can buy, at what price and in what quantities. Assign it to a company or a single location.</p>
        {canEdit && <Button size="sm" onClick={() => setEditing('new')}>Add catalog</Button>}
      </div>
      <Table columns={columns} data={catalogs ?? []} keyExtractor={(c) => c._id} loading={!catalogs}
        emptyState={{ title: 'No catalogs yet', description: 'Create a catalog, add variants with wholesale prices, then assign it to a company.' }} />
      {editing && <CatalogModal base={base} catalog={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {itemsFor && <ItemsModal base={base} storeId={storeId} catalog={itemsFor} canEdit={canEdit} onClose={() => { setItemsFor(null); reload(); }} />}
    </div>
  );
}

function CatalogModal({ base, catalog, onClose, onSaved }: { base: string; catalog: Catalog | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: catalog?.name ?? '', status: catalog?.status ?? 'active', pct: catalog?.defaultAdjustmentPercent != null ? String(catalog.defaultAdjustmentPercent) : '', all: catalog?.includeAllProducts ?? false });
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!f.name.trim()) { toast.error('Catalog name is required'); return; }
    setBusy(true);
    const body = { name: f.name.trim(), status: f.status, defaultAdjustmentPercent: f.pct === '' ? null : Number(f.pct), includeAllProducts: f.all };
    try { if (catalog) await client.patch(`${base}/catalogs/${catalog._id}`, body); else await client.post(`${base}/catalogs`, body); toast.success('Catalog saved'); onSaved(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={catalog ? 'Edit catalog' : 'Add catalog'} onClose={onClose} width={480}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void save()}>Save</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label="Name" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Select label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="active">Active</option><option value="draft">Draft (companies see retail prices)</option></Select>
        <Input label="Default price change % (e.g. -20 = 20% cheaper, empty = none)" type="number" min={-100} max={1000} value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} />
        <label className="flex items-start gap-2 text-[13px] text-carbon"><input type="checkbox" className="mt-0.5" checked={f.all} onChange={(e) => setF({ ...f, all: e.target.checked })} /> Every product is available. Variants you add below only change the price or rules. Untick to sell only the variants you list.</label>
      </div>
    </Modal>
  );
}

function ItemsModal({ base, storeId, catalog, canEdit, onClose }: { base: string; storeId: string; catalog: Catalog; canEdit: boolean; onClose: () => void }) {
  const toast = useToast();
  const list = usePaged<Item>(`${base}/catalogs/${catalog._id}/items`, {});
  const [adding, setAdding] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const productIds = [...new Set(list.rows.map((r) => r.productId))].join(',');
  useEffect(() => {
    let cancelled = false;
    const ids = productIds ? productIds.split(',') : [];
    void Promise.all(ids.filter((id) => !(`v:${id}` in names)).map(async (id) => {
      try {
        const r = await apiGetMyProductById(id);
        return { id, product: r.data.product.name, variants: r.data.variants };
      } catch { return { id, product: 'Deleted product', variants: [] as ProductVariant[] }; }
    })).then((res) => {
      if (cancelled || res.length === 0) return;
      setNames((prev) => {
        const next = { ...prev };
        for (const p of res) { next[`v:${p.id}`] = p.product; for (const v of p.variants) next[v._id] = `${p.product}${v.options?.length ? ` — ${v.options.map((o) => o.value).join(' / ')}` : ''}${v.sku ? ` (${v.sku})` : ''}`; }
        return next;
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds]);

  const columns: TableColumn<Item>[] = [
    { key: 'v', header: 'Variant', render: (i) => names[i.variantId] ?? '…' },
    { key: 'av', header: 'Available', render: (i) => (i.available ? <Badge color="green" size="sm">Yes</Badge> : <Badge color="red" size="sm">No</Badge>) },
    { key: 'price', header: 'Price', render: (i) => (i.fixedPrice != null ? i.fixedPrice.toLocaleString() : i.adjustmentPercent != null ? `${i.adjustmentPercent > 0 ? '+' : ''}${i.adjustmentPercent}%` : 'Catalog default') },
    { key: 'rules', header: 'Quantity rule', render: (i) => (i.minQty || i.maxQty || i.increment ? `min ${i.minQty ?? 1} · max ${i.maxQty ?? '∞'} · step ${i.increment ?? 1}` : '—') },
    { key: 'br', header: 'Volume prices', render: (i) => (i.priceBreaks.length ? i.priceBreaks.map((b) => `${b.minQty}+ → ${b.price}`).join(', ') : '—') },
    { key: 'a', header: 'Actions', align: 'right', render: (i) => (canEdit ? (
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="outline" onClick={() => setEditItem(i)}>Edit</Button>
        <Button size="xs" variant="outline" onClick={() => void client.delete(`${base}/catalogs/${catalog._id}/items/${i.variantId}`).then(() => list.reload()).catch((e) => toast.error(errorMessage(e)))}>Remove</Button>
      </div>
    ) : null) },
  ];

  return (
    <Modal title={`${catalog.name}: variants`} onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        {canEdit && <div><Button size="sm" onClick={() => setAdding(true)}>Add variants</Button></div>}
        {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
          <Table columns={columns} data={list.rows} keyExtractor={(i) => i._id} loading={list.loading}
            pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'variants' }}
            emptyState={{ title: 'No variants in this catalog', description: catalog.includeAllProducts ? 'Every product is available at the default price. Add variants to give them their own price or rules.' : 'Add the variants this catalog sells.' }} />
        )}
      </div>
      {adding && <AddVariantsModal base={base} storeId={storeId} catalogId={catalog._id} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); list.reload(); }} />}
      {editItem && <ItemEditModal base={base} catalogId={catalog._id} item={editItem} label={names[editItem.variantId] ?? ''} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); list.reload(); }} />}
    </Modal>
  );
}

function AddVariantsModal({ base, storeId, catalogId, onClose, onAdded }: { base: string; storeId: string; catalogId: string; onClose: () => void; onAdded: () => void }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<InventoryProduct[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<{ id: string; name: string; variants: ProductVariant[] } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      apiGetStoreInventory(storeId, 1, 8, { q, status: 'active' })
        .then((r) => { if (!cancelled) { setProducts(r.data.products); setErr(''); } })
        .catch((e) => { if (!cancelled) setErr(errorMessage(e)); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, storeId]);

  async function openProduct(p: InventoryProduct) {
    try { const r = await apiGetMyProductById(p.productId); setOpen({ id: p.productId, name: p.name, variants: r.data.variants }); setPicked([]); } catch (e) { toast.error(errorMessage(e)); }
  }
  async function add() {
    setBusy(true);
    try { await client.put(`${base}/catalogs/${catalogId}/items`, { items: picked.map((variantId) => ({ variantId, available: true })) }); toast.success(`${picked.length} variant(s) added`); onAdded(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title="Add variants" onClose={onClose} width={560}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={picked.length === 0} onClick={() => void add()}>Add {picked.length || ''}</Button></>}>
      <div className="flex flex-col gap-3">
        {open ? (
          <>
            <button type="button" className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[13px] text-carbon underline" onClick={() => setOpen(null)}>← Back to products</button>
            <strong className="text-[14px] text-carbon">{open.name}</strong>
            {open.variants.map((v) => (
              <label key={v._id} className="flex items-center gap-2 text-[13px] text-carbon">
                <input type="checkbox" checked={picked.includes(v._id)} onChange={() => setPicked(picked.includes(v._id) ? picked.filter((x) => x !== v._id) : [...picked, v._id])} />
                {v.options?.length ? v.options.map((o) => o.value).join(' / ') : 'Default'} <span className="text-slate">{v.sku} · {v.price.toLocaleString()}</span>
              </label>
            ))}
          </>
        ) : (
          <>
            <Input label="Search products" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Product name or SKU" />
            {err ? <ErrorLine message={err} onRetry={() => setQ(q + ' ')} /> : !products ? <p className="m-0 text-[13px] text-slate">Loading…</p> : products.length === 0 ? <p className="m-0 text-[13px] text-slate">No products found.</p> : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {products.map((p) => <li key={p.productId}><button type="button" className="w-full cursor-pointer rounded-md border border-border bg-white px-3 py-2 text-left text-[13px] text-carbon hover:bg-surface" onClick={() => void openProduct(p)}>{p.name}</button></li>)}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function ItemEditModal({ base, catalogId, item, label, onClose, onSaved }: { base: string; catalogId: string; item: Item; label: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    available: item.available, fixed: item.fixedPrice != null ? String(item.fixedPrice) : '', pct: item.adjustmentPercent != null ? String(item.adjustmentPercent) : '',
    min: item.minQty != null ? String(item.minQty) : '', max: item.maxQty != null ? String(item.maxQty) : '', inc: item.increment != null ? String(item.increment) : '',
    breaks: item.priceBreaks.map((b) => ({ minQty: String(b.minQty), price: String(b.price) })),
  });
  const [busy, setBusy] = useState(false);
  const num = (s: string) => (s === '' ? null : Number(s));
  async function save() {
    setBusy(true);
    try {
      await client.put(`${base}/catalogs/${catalogId}/items`, { items: [{
        variantId: item.variantId, available: f.available, fixedPrice: num(f.fixed), adjustmentPercent: num(f.pct), minQty: num(f.min), maxQty: num(f.max), increment: num(f.inc),
        priceBreaks: f.breaks.filter((b) => b.minQty !== '' || b.price !== '').map((b) => ({ minQty: Number(b.minQty), price: Number(b.price) })),
      }] });
      toast.success('Saved'); onSaved();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={label || 'Variant'} onClose={onClose} width={520}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void save()}>Save</Button></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-[13px] text-carbon sm:col-span-2"><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} /> Available to companies with this catalog</label>
        <Input label="Fixed price (wins over %)" type="number" min={0} value={f.fixed} onChange={(e) => setF({ ...f, fixed: e.target.value })} />
        <Input label="Price change %" type="number" min={-100} max={1000} value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} />
        <Input label="Minimum quantity" type="number" min={1} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />
        <Input label="Maximum quantity" type="number" min={1} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} />
        <Input label="Increment (multiples of)" type="number" min={1} value={f.inc} onChange={(e) => setF({ ...f, inc: e.target.value })} />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 sm:col-span-2">
          <legend className="mb-1 text-[13px] font-semibold text-carbon">Volume prices (up to 10)</legend>
          {f.breaks.map((b, i) => (
            <div key={i} className="flex items-end gap-2">
              <Input label="From quantity" type="number" min={2} value={b.minQty} onChange={(e) => setF({ ...f, breaks: f.breaks.map((x, j) => (j === i ? { ...x, minQty: e.target.value } : x)) })} />
              <Input label="Price each" type="number" min={0} value={b.price} onChange={(e) => setF({ ...f, breaks: f.breaks.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })} />
              <Button size="xs" variant="outline" onClick={() => setF({ ...f, breaks: f.breaks.filter((_, j) => j !== i) })}>Remove</Button>
            </div>
          ))}
          {f.breaks.length < 10 && <div><Button size="xs" variant="outline" onClick={() => setF({ ...f, breaks: [...f.breaks, { minQty: '', price: '' }] })}>Add price break</Button></div>}
          <p className="m-0 text-xs text-slate">A larger quantity cannot cost more per unit. A volume price replaces the fixed price or % at that quantity.</p>
        </fieldset>
      </div>
    </Modal>
  );
}
