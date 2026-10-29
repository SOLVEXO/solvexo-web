import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Layers } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import {
  Button, Table, type TableColumn, Modal, Input, Select, Field, Badge, EmptyState,
} from '@/components/comman/ui';
import {
  apiListMetafieldDefinitions, apiCreateMetafieldDefinition, apiUpdateMetafieldDefinition, apiDeleteMetafieldDefinition,
  METAFIELD_TYPES, METAFIELD_TYPE_LABELS, METAFIELD_OWNER_RESOURCES,
  type MetafieldDefinition, type MetafieldType, type MetafieldOwnerResource,
} from '@/api/services/metafields';

const RESOURCE_LABELS: Record<MetafieldOwnerResource, string> = {
  product: 'Products', category: 'Categories', collection: 'Collections', page: 'Pages', article: 'Blog Articles',
};

/** Create AND edit — `editing` switches Save to call
 *  apiUpdateMetafieldDefinition instead of create; "Applies to"/Key/Type
 *  all become read-only in that mode since the backend only accepts
 *  name/description/required on update (they're the stable identifier —
 *  same "immutable once set" precedent as Metaobjects' own Type field). */
function DefinitionFormModal({ storeId, editing, onClose, onSaved }: { storeId: string; editing?: MetafieldDefinition; onClose: () => void; onSaved: () => void }) {
  const [ownerResource, setOwnerResource] = useState<MetafieldOwnerResource>(editing?.ownerResource ?? 'product');
  const [key, setKey] = useState(editing?.key ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<MetafieldType>(editing?.type ?? 'single_line_text_field');
  const [required, setRequired] = useState(editing?.required ?? false);
  const [storefrontAccess, setStorefrontAccess] = useState(editing?.storefrontAccess ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) { setError('Name and key are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await apiUpdateMetafieldDefinition(storeId, editing._id, { name: name.trim(), required, storefrontAccess });
      } else {
        await apiCreateMetafieldDefinition(storeId, { ownerResource, key: key.trim(), name: name.trim(), type, required, storefrontAccess });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${editing ? 'save' : 'create'} this field.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={editing ? `Edit "${editing.name}"` : 'New Custom Field'}>
      <div className="flex flex-col gap-3">
        <Field label="Applies to">
          <Select value={ownerResource} disabled={!!editing} onChange={e => setOwnerResource(e.target.value as MetafieldOwnerResource)}>
            {METAFIELD_OWNER_RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="Field name" hint="What the seller sees, e.g. &quot;Fabric&quot; or &quot;Launch Date&quot;.">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Fabric" />
        </Field>
        <Field label="Key" hint="Stable identifier — lowercase, no spaces. Cannot change once set.">
          <Input value={key} disabled={!!editing} onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="fabric" />
        </Field>
        <Field label="Type">
          <Select value={type} disabled={!!editing} onChange={e => setType(e.target.value as MetafieldType)}>
            {METAFIELD_TYPES.map(t => <option key={t} value={t}>{METAFIELD_TYPE_LABELS[t]}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-charcoal cursor-pointer">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
          Required
        </label>
        <label className="flex items-start gap-2 text-[13px] text-charcoal cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={storefrontAccess} onChange={e => setStorefrontAccess(e.target.checked)} />
          <span>
            Storefronts
            <span className="block text-[12px] text-gray-500">Let your online store display this field's values. When off, the values stay private.</span>
          </span>
        </label>
        {error && <p className="text-[12px] text-error">{error}</p>}
        {/* Bottom sheet on a phone: stacked, primary on top, full-width. */}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create Field'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Seller-facing manager for the "what custom fields exist" half of the
 *  Metafields system — the other half (`MetafieldsEditor`) is where a
 *  seller actually fills in a value on one product/category/etc. Reachable
 *  from Settings (see `StoreLayout.tsx`'s NAV). */
export function MetafieldDefinitionsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId } = useStoreWorkspace();
  const [definitions, setDefinitions] = useState<MetafieldDefinition[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<MetafieldDefinition | null>(null);
  const [deleting, setDeleting] = useState<MetafieldDefinition | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    apiListMetafieldDefinitions(storeId).then(res => setDefinitions(res.data)).catch(() => setDefinitions([]));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await apiDeleteMetafieldDefinition(storeId, deleting._id);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this field.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns: TableColumn<MetafieldDefinition>[] = [
    { key: 'name', header: 'Field', render: d => <span className="font-semibold text-charcoal">{d.name}</span> },
    { key: 'ownerResource', header: 'Applies to', render: d => <Badge>{RESOURCE_LABELS[d.ownerResource]}</Badge> },
    { key: 'type', header: 'Type', render: d => METAFIELD_TYPE_LABELS[d.type] },
    { key: 'required', header: 'Required', render: d => d.required ? 'Yes' : '—' },
    {
      key: 'actions', header: '', render: d => (
        // p-1 around a 15px icon is a ~23px target — under half the 44px a thumb
        // needs. Bumped for coarse pointers only, so the dense desktop table's
        // action strip keeps its current size.
        <div className="flex items-center gap-1">
          <button
            type="button" onClick={() => setEditingDef(d)}
            className="text-slate bg-transparent border-none cursor-pointer p-1 rounded-lg hover:text-charcoal pointer-coarse:size-11 pointer-coarse:p-0 pointer-coarse:flex pointer-coarse:items-center pointer-coarse:justify-center"
            aria-label={`Edit ${d.name}`}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button" onClick={() => { setDeleteError(''); setDeleting(d); }}
            className="text-error bg-transparent border-none cursor-pointer p-1 rounded-lg pointer-coarse:size-11 pointer-coarse:p-0 pointer-coarse:flex pointer-coarse:items-center pointer-coarse:justify-center"
            aria-label={`Delete ${d.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const importButton = (
    <BulkImportButton
      entityLabel="custom fields"
      basePath={`/api/metafields/${storeId}/definitions`}
      onImported={load}
      notes={[
        'A field whose Owner Resource + Key already exists is skipped, not duplicated.',
        'Key must start with a lowercase letter and use only lowercase letters, numbers, - or _.',
      ]}
    />
  );

  return (
    <div className={embedded ? 'flex flex-col gap-5' : 'flex flex-col'}>
      {!embedded && (
        <StorePageHeader
          title="Custom Fields"
          subtitle="Add your own fields to products, categories, collections, or pages — no developer needed."
          actions={(
            // The header's right cluster is shrink-0 (these buttons + store
            // switcher + bell + avatar), so a labelled CTA here would widen the
            // page past a phone. Icon-only under `sm`, like BulkImportButton.
            <div className="flex items-center gap-2">
              {importButton}
              <Button variant="primary" icon={<Plus size={14} />} aria-label="New Field" onClick={() => setModalOpen(true)}>
                <span className="hidden sm:inline">New Field</span>
              </Button>
            </div>
          )}
        />
      )}

      {/* Standalone route: nothing above this pads the page, so the body owns
          its gutters. Inside SettingsHub the pane already pads it (`px-4
          lg:px-7 py-6`) — padding here too would double it. */}
      <div className={embedded ? 'flex flex-col gap-5' : 'px-4 md:px-7 pt-5 pb-8 flex flex-col gap-5'}>
        {embedded && definitions !== null && (
          <div className="flex items-center justify-end gap-2 overflow-x-auto scrollbar-hide overscroll-x-contain">
            {importButton}
            {definitions.length > 0 && (
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                New Field
              </Button>
            )}
          </div>
        )}

        {definitions === null ? null : definitions.length === 0 ? (
          <EmptyState
            icon={<Layers size={28} />}
            title="No custom fields yet"
            description="Create one to add data like Fabric, Care Instructions, or a Launch Date to your products."
            action={{ label: 'New Field', icon: <Plus size={14} />, onClick: () => setModalOpen(true) }}
          />
        ) : (
          <Table columns={columns} data={definitions} keyExtractor={d => d._id} />
        )}
      </div>

      {modalOpen && (
        <DefinitionFormModal storeId={storeId} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />
      )}

      {editingDef && (
        <DefinitionFormModal storeId={storeId} editing={editingDef} onClose={() => setEditingDef(null)} onSaved={() => { setEditingDef(null); load(); }} />
      )}

      {deleting && (
        <Modal onClose={() => { if (!deleteBusy) { setDeleting(null); setDeleteError(''); } }} title="Delete this field?">
          <p className="text-[13px] text-slate mb-4">
            "{deleting.name}" and every value set on it will be permanently removed. This can't be undone.
          </p>
          {deleteError && <p className="text-[12px] text-error mb-3">{deleteError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => { setDeleting(null); setDeleteError(''); }} disabled={deleteBusy}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteBusy}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
