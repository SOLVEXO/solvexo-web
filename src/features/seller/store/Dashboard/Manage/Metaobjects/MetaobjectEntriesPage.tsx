import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Pencil, ArrowLeft, Boxes } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Button, Table, type TableColumn, Modal, Input, Field, EmptyState,
} from '@/components/comman/ui';
import {
  apiGetMetaobjectDefinition, apiListMetaobjectEntries, apiCreateMetaobjectEntry,
  apiUpdateMetaobjectEntry, apiDeleteMetaobjectEntry,
  type MetaobjectDefinition, type MetaobjectEntry, type MetaobjectFieldDefinition,
} from '@/api/services/metaobjects';
import type { MetafieldType } from '@/api/services/metafields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const ta  = `${inp} resize-y min-h-[70px]`;

/** Same per-type input-kind switch as `MetafieldsEditor.tsx`'s `ValueInput` —
 *  every value on the wire is a string regardless of `type`, only the INPUT
 *  shown to the seller varies. */
function FieldValueInput({ type, value, onChange }: { type: MetafieldType; value: string; onChange: (v: string) => void }) {
  switch (type) {
    case 'multi_line_text_field':
      return <textarea className={ta} value={value} onChange={e => onChange(e.target.value)} />;
    case 'number_integer':
      return <input type="number" step={1} className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'number_decimal':
      return <input type="number" step="any" className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'boolean':
      return (
        <select className={inp} value={value || 'false'} onChange={e => onChange(e.target.value)}>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    case 'date':
      return <input type="date" className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'url':
      return <input type="url" className={inp} placeholder="https://…" value={value} onChange={e => onChange(e.target.value)} />;
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded border border-bone cursor-pointer p-0.5" />
          <input className={inp} value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" />
        </div>
      );
    case 'json':
      return <textarea className={`${ta} font-mono text-[12px]`} value={value} onChange={e => onChange(e.target.value)} placeholder="{}" />;
    default:
      return <input className={inp} value={value} onChange={e => onChange(e.target.value)} />;
  }
}

function EntryFormModal({ storeId, definitionId, fieldDefs, entry, onClose, onSaved }: {
  storeId: string;
  definitionId: string;
  fieldDefs: MetaobjectFieldDefinition[];
  entry: MetaobjectEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(entry?.displayName ?? '');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fieldDefs.map(f => [f.key, entry?.fields.find(v => v.key === f.key)?.value ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setValue = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Display name is required.'); return; }
    setSaving(true);
    setError('');
    const fields = fieldDefs.map(f => ({ key: f.key, value: values[f.key] ?? '' }));
    try {
      if (entry) await apiUpdateMetaobjectEntry(storeId, entry._id, { displayName: displayName.trim(), fields });
      else await apiCreateMetaobjectEntry(storeId, definitionId, { displayName: displayName.trim(), fields });
      onSaved();
    } catch (err) {
      // Surfaces the backend's own message as-is — e.g. a rejected required
      // field or a bad `url`/`color` value — rather than re-deriving that
      // validation client-side.
      setError(err instanceof Error ? err.message : 'Could not save this entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={entry ? 'Edit Entry' : 'New Entry'}>
      <div className="flex flex-col gap-3">
        <Field label="Display name">
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </Field>
        {fieldDefs.map(f => (
          <Field key={f.key} label={f.name} required={f.required}>
            <FieldValueInput type={f.type} value={values[f.key] ?? ''} onChange={v => setValue(f.key, v)} />
          </Field>
        ))}
        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{entry ? 'Save Changes' : 'Create Entry'}</Button>
        </div>
      </div>
    </Modal>
  );
}

const truncate = (value: string, max = 60) => (value.length > max ? `${value.slice(0, max)}…` : value);

/** Real instances of one Metaobject type — e.g. every actual Team Member.
 *  The other half of the system, `MetaobjectTypesPage`, is where the type's
 *  field schema is declared; this page is reached by clicking a row there. */
export function MetaobjectEntriesPage() {
  const { storeId } = useStoreWorkspace();
  const { definitionId } = useParams<{ definitionId: string }>();
  const navigate = useNavigate();
  const [definition, setDefinition] = useState<MetaobjectDefinition | null>(null);
  const [entries, setEntries] = useState<MetaobjectEntry[] | null>(null);
  const [modalEntry, setModalEntry] = useState<MetaobjectEntry | 'new' | null>(null);
  const [deleting, setDeleting] = useState<MetaobjectEntry | null>(null);

  const load = useCallback(() => {
    if (!definitionId) return;
    apiGetMetaobjectDefinition(storeId, definitionId).then(res => setDefinition(res.data)).catch(() => setDefinition(null));
    apiListMetaobjectEntries(storeId, definitionId).then(res => setEntries(res.data)).catch(() => setEntries([]));
  }, [storeId, definitionId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    await apiDeleteMetaobjectEntry(storeId, deleting._id);
    setDeleting(null);
    load();
  };

  if (!definitionId) return null;

  const fieldDefs = definition?.fieldDefinitions ?? [];

  const columns: TableColumn<MetaobjectEntry>[] = [
    { key: 'displayName', header: 'Name', render: e => <span className="font-semibold text-charcoal">{e.displayName}</span> },
    ...fieldDefs.map((f): TableColumn<MetaobjectEntry> => ({
      key: f.key,
      header: f.name,
      render: e => {
        const v = e.fields.find(x => x.key === f.key)?.value ?? '';
        return <span className="text-slate">{v ? truncate(v) : '—'}</span>;
      },
    })),
    {
      key: 'actions', header: '', render: e => (
        <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
          <button type="button" onClick={() => setModalEntry(e)} className="text-slate bg-transparent border-none cursor-pointer p-1" aria-label={`Edit ${e.displayName}`}>
            <Pencil size={14} />
          </button>
          <button type="button" onClick={() => setDeleting(e)} className="text-error bg-transparent border-none cursor-pointer p-1" aria-label={`Delete ${e.displayName}`}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StorePageHeader
        title={definition?.name ?? 'Content Type'}
        subtitle={definition?.description || 'Real entries of this content type.'}
        actions={(
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/store/${storeId}/metaobjects`)}
              className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[9px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors"
            >
              <ArrowLeft size={13} /> Back to Content Types
            </button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalEntry('new')}>
              New Entry
            </Button>
          </div>
        )}
      />

      {entries === null ? null : entries.length === 0 ? (
        <EmptyState
          icon={<Boxes size={28} />}
          title="No entries yet"
          description={`Add your first ${definition?.name ?? 'entry'}.`}
          action={{ label: 'New Entry', icon: <Plus size={14} />, onClick: () => setModalEntry('new') }}
        />
      ) : (
        <Table columns={columns} data={entries} keyExtractor={e => e._id} />
      )}

      {modalEntry && (
        <EntryFormModal
          storeId={storeId}
          definitionId={definitionId}
          fieldDefs={fieldDefs}
          entry={modalEntry === 'new' ? null : modalEntry}
          onClose={() => setModalEntry(null)}
          onSaved={() => { setModalEntry(null); load(); }}
        />
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete this entry?">
          <p className="text-[13px] text-slate mb-4">"{deleting.displayName}" will be permanently deleted. This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
