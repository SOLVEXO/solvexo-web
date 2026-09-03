import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Button, Table, type TableColumn, Modal, Input, Select, Field, Badge, EmptyState,
} from '@/components/comman/ui';
import {
  apiListMetafieldDefinitions, apiCreateMetafieldDefinition, apiDeleteMetafieldDefinition,
  METAFIELD_TYPES, METAFIELD_TYPE_LABELS, METAFIELD_OWNER_RESOURCES,
  type MetafieldDefinition, type MetafieldType, type MetafieldOwnerResource,
} from '@/api/services/metafields';

const RESOURCE_LABELS: Record<MetafieldOwnerResource, string> = {
  product: 'Products', category: 'Categories', collection: 'Collections', page: 'Pages',
};

function CreateDefinitionModal({ storeId, onClose, onCreated }: { storeId: string; onClose: () => void; onCreated: () => void }) {
  const [ownerResource, setOwnerResource] = useState<MetafieldOwnerResource>('product');
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<MetafieldType>('single_line_text_field');
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) { setError('Name and key are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiCreateMetafieldDefinition(storeId, { ownerResource, key: key.trim(), name: name.trim(), type, required });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this field.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="New Custom Field">
      <div className="flex flex-col gap-3">
        <Field label="Applies to">
          <Select value={ownerResource} onChange={e => setOwnerResource(e.target.value as MetafieldOwnerResource)}>
            {METAFIELD_OWNER_RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="Field name" hint="What the seller sees, e.g. &quot;Fabric&quot; or &quot;Launch Date&quot;.">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Fabric" />
        </Field>
        <Field label="Key" hint="Stable identifier — lowercase, no spaces. Cannot change once set.">
          <Input value={key} onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="fabric" />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={e => setType(e.target.value as MetafieldType)}>
            {METAFIELD_TYPES.map(t => <option key={t} value={t}>{METAFIELD_TYPE_LABELS[t]}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-charcoal cursor-pointer">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
          Required
        </label>
        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Create Field</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Seller-facing manager for the "what custom fields exist" half of the
 *  Metafields system — the other half (`MetafieldsEditor`) is where a
 *  seller actually fills in a value on one product/category/etc. Reachable
 *  from Settings (see `StoreLayout.tsx`'s NAV). */
export function MetafieldDefinitionsPage() {
  const { storeId } = useStoreWorkspace();
  const [definitions, setDefinitions] = useState<MetafieldDefinition[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<MetafieldDefinition | null>(null);

  const load = useCallback(() => {
    apiListMetafieldDefinitions(storeId).then(res => setDefinitions(res.data)).catch(() => setDefinitions([]));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    await apiDeleteMetafieldDefinition(storeId, deleting._id);
    setDeleting(null);
    load();
  };

  const columns: TableColumn<MetafieldDefinition>[] = [
    { key: 'name', header: 'Field', render: d => <span className="font-semibold text-charcoal">{d.name}</span> },
    { key: 'ownerResource', header: 'Applies to', render: d => <Badge>{RESOURCE_LABELS[d.ownerResource]}</Badge> },
    { key: 'type', header: 'Type', render: d => METAFIELD_TYPE_LABELS[d.type] },
    { key: 'required', header: 'Required', render: d => d.required ? 'Yes' : '—' },
    {
      key: 'actions', header: '', render: d => (
        <button
          type="button" onClick={() => setDeleting(d)}
          className="text-error bg-transparent border-none cursor-pointer p-1"
          aria-label={`Delete ${d.name}`}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StorePageHeader
        title="Custom Fields"
        subtitle="Add your own fields to products, categories, collections, or pages — no developer needed."
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            New Field
          </Button>
        )}
      />

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

      {modalOpen && (
        <CreateDefinitionModal storeId={storeId} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); load(); }} />
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete this field?">
          <p className="text-[13px] text-slate mb-4">
            "{deleting.name}" and every value set on it will be permanently removed. This can't be undone.
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
