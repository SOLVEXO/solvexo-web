import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Boxes, ArrowUp, ArrowDown } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Button, Table, type TableColumn, Modal, Input, Select, Field, Badge, EmptyState,
} from '@/components/comman/ui';
import {
  apiListMetaobjectDefinitions, apiCreateMetaobjectDefinition, apiDeleteMetaobjectDefinition,
  type MetaobjectDefinitionSummary, type MetaobjectFieldDefinition,
} from '@/api/services/metaobjects';
import { METAFIELD_TYPES, METAFIELD_TYPE_LABELS, type MetafieldType } from '@/api/services/metafields';

const EMPTY_FIELD: MetaobjectFieldDefinition = { key: '', name: '', type: 'single_line_text_field', required: false };
const sanitizeSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]/g, '');

function CreateTypeModal({ storeId, onClose, onCreated }: { storeId: string; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState('');
  // Once the seller types into Type directly, stop auto-deriving it from
  // Name — same "smart default until the user takes control" pattern real
  // slug fields use everywhere else in this app (e.g. product/category
  // slugs). Before this fix, Type's auto-slug preview was ONLY a
  // placeholder — it looked filled but the real value stayed empty, so
  // clicking "Create Type" always failed with a confusing "Name and type
  // are required" even though both fields visibly had text in them.
  const [typeTouched, setTypeTouched] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<MetaobjectFieldDefinition[]>([{ ...EMPTY_FIELD }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateField = (i: number, patch: Partial<MetaobjectFieldDefinition>) =>
    setFields(prev => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const addField = () => setFields(prev => [...prev, { ...EMPTY_FIELD }]);
  const removeField = (i: number) => setFields(prev => prev.filter((_, j) => j !== i));
  const moveField = (i: number, dir: -1 | 1) =>
    setFields(prev => {
      const target = i + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });

  const handleSave = async () => {
    if (!name.trim() || !type.trim()) { setError('Name and type are required.'); return; }
    const cleanFields = fields.filter(f => f.name.trim() && f.key.trim());
    if (cleanFields.length === 0) { setError('Add at least one field — a content type with no fields has nothing to store.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiCreateMetaobjectDefinition(storeId, {
        type: type.trim(), name: name.trim(), description: description.trim() || undefined, fieldDefinitions: cleanFields,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this content type.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="New Content Type">
      <div className="flex flex-col gap-3">
        <Field label="Name" hint='What you see, e.g. "Team Member".'>
          <Input
            value={name}
            onChange={e => {
              const v = e.target.value;
              setName(v);
              if (!typeTouched) setType(sanitizeSlug(v.replace(/\s+/g, '_')));
            }}
            placeholder="Team Member"
          />
        </Field>
        <Field label="Type" hint="Stable identifier — lowercase, no spaces. Cannot change once set.">
          <Input value={type} onChange={e => { setType(sanitizeSlug(e.target.value)); setTypeTouched(true); }} placeholder="team_member" />
        </Field>
        <Field label="Description (optional)">
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="A person on your team" />
        </Field>

        <div className="flex flex-col gap-2 mt-1">
          <p className="text-[12px] font-semibold text-charcoal">Fields</p>
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 border border-bone rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Field name (Name)"
                  value={f.name}
                  onChange={e => {
                    const v = e.target.value;
                    // Same auto-derive-until-touched fix as the Type field
                    // above — Key's placeholder used to just be static
                    // example text, never actually filled, so a field with
                    // only its Name typed silently failed the "add at least
                    // one field" check (empty key = filtered out on save).
                    updateField(i, f.key.trim() === '' ? { name: v, key: sanitizeSlug(v.replace(/\s+/g, '_')) } : { name: v });
                  }}
                />
                <Input placeholder="field_key" value={f.key} onChange={e => updateField(i, { key: sanitizeSlug(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Select className="flex-1" value={f.type} onChange={e => updateField(i, { type: e.target.value as MetafieldType })}>
                  {METAFIELD_TYPES.map(t => <option key={t} value={t}>{METAFIELD_TYPE_LABELS[t]}</option>)}
                </Select>
                <label className="flex items-center gap-1.5 text-[12px] text-charcoal cursor-pointer shrink-0 whitespace-nowrap">
                  <input type="checkbox" checked={f.required} onChange={e => updateField(i, { required: e.target.checked })} />
                  Required
                </label>
                <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0}
                  className="text-slate bg-transparent border-none cursor-pointer p-1 disabled:opacity-30" aria-label="Move field up">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}
                  className="text-slate bg-transparent border-none cursor-pointer p-1 disabled:opacity-30" aria-label="Move field down">
                  <ArrowDown size={14} />
                </button>
                <button type="button" onClick={() => removeField(i)} disabled={fields.length === 1}
                  className="text-error bg-transparent border-none cursor-pointer p-1 disabled:opacity-30" aria-label="Remove field">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={addField}>Add Field</Button>
        </div>

        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Create Type</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Seller-facing manager for Metaobject "definitions" — the type/schema half
 *  of the Metaobjects system (a genuinely new kind of resource, e.g. "Team
 *  Member", distinct from Metafields which only attach extra fields to an
 *  EXISTING resource — see `MetafieldDefinitionsPage.tsx`). The other half,
 *  each definition's real entries, is `MetaobjectEntriesPage`, reached by
 *  clicking a row here. */
export function MetaobjectTypesPage() {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const [definitions, setDefinitions] = useState<MetaobjectDefinitionSummary[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<MetaobjectDefinitionSummary | null>(null);

  const load = useCallback(() => {
    apiListMetaobjectDefinitions(storeId).then(res => setDefinitions(res.data)).catch(() => setDefinitions([]));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    await apiDeleteMetaobjectDefinition(storeId, deleting._id);
    setDeleting(null);
    load();
  };

  const columns: TableColumn<MetaobjectDefinitionSummary>[] = [
    { key: 'name', header: 'Content Type', render: d => <span className="font-semibold text-charcoal">{d.name}</span> },
    { key: 'type', header: 'Type', render: d => <Badge className="font-mono">{d.type}</Badge> },
    { key: 'fields', header: 'Fields', render: d => d.fieldDefinitions.length },
    { key: 'entryCount', header: 'Entries', render: d => d.entryCount },
    {
      key: 'actions', header: '', render: d => (
        <button
          type="button" onClick={e => { e.stopPropagation(); setDeleting(d); }}
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
        title="Content Types"
        subtitle="Define your own custom content — Team Members, Size Guides, anything with no product or category of its own."
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            New Type
          </Button>
        )}
      />

      {definitions === null ? null : definitions.length === 0 ? (
        <EmptyState
          icon={<Boxes size={28} />}
          title="No content types yet"
          description='Create one — like "Team Member" (name, photo, role) or "Size Guide" (size, chest, waist) — then add real entries to it.'
          action={{ label: 'New Type', icon: <Plus size={14} />, onClick: () => setModalOpen(true) }}
        />
      ) : (
        <Table columns={columns} data={definitions} keyExtractor={d => d._id} onRowClick={d => navigate(`/store/${storeId}/metaobjects/${d._id}`)} />
      )}

      {modalOpen && (
        <CreateTypeModal storeId={storeId} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); load(); }} />
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete this content type?">
          <p className="text-[13px] text-slate mb-4">
            "{deleting.name}" and all {deleting.entryCount} of its {deleting.entryCount === 1 ? 'entry' : 'entries'} will be permanently deleted. This can't be undone.
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
