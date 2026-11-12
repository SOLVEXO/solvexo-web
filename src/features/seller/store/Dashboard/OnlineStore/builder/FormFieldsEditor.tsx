import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import {
  CONTACT_FIELD_TYPES, MAX_CHOICES, MAX_CONTACT_FIELDS, contactFormProblem, hasChoices, newContactField, newFieldId, resolveContactFields,
  type ContactFieldType, type ContactFormField,
} from '@/features/storefront-themes/core/forms/contactFormFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';
const iconBtn = 'inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent text-slate cursor-pointer hover:bg-cream disabled:opacity-30 disabled:cursor-default';
const typeLabel = (t: ContactFieldType) => CONTACT_FIELD_TYPES.find(x => x.value === t)?.label ?? t;

/** The choices of a dropdown / radio / checkbox field, one per line (kept as typed, empty lines dropped when saved). */
function ChoicesInput({ id, options, onChange, hint }: { id: string; options: string[]; onChange: (next: string[]) => void; hint: string }) {
  const [raw, setRaw] = useState(options.join('\n'));
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-charcoal">Choices</label>
      <textarea
        id={id} rows={4} className={`${inp} resize-y`} value={raw} placeholder={'One choice per line\nOption 1\nOption 2'}
        onChange={e => {
          setRaw(e.target.value);
          const list = e.target.value.split('\n').map(l => l.trim().slice(0, 60)).filter(Boolean);
          onChange(Array.from(new Set(list)).slice(0, MAX_CHOICES));
        }}
      />
      <p className="m-0 mt-1 text-[11px] text-slate">{hint} Up to {MAX_CHOICES} choices.</p>
    </div>
  );
}

function FieldCard({ field, index, total, open, onToggle, onChange, onMove, onDuplicate, onRemove, canAddMore }: {
  field: ContactFormField; index: number; total: number; open: boolean; onToggle: () => void;
  onChange: (patch: Partial<ContactFormField>) => void; onMove: (dir: -1 | 1) => void; onDuplicate: () => void; onRemove: () => void; canAddMore: boolean;
}) {
  const uid = useId();
  const choices = hasChoices(field.type);
  const noPlaceholder = field.type === 'radio' || field.type === 'checkbox' || field.type === 'date';
  return (
    <div className="rounded-lg border border-bone bg-white">
      <div className="flex items-center gap-1 pr-1">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${uid}-panel`}
          className="flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent px-3 py-2.5 text-left cursor-pointer">
          <ChevronDown size={14} className={`shrink-0 text-slate transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-charcoal">{field.label || 'Untitled field'}{field.required ? <span className="text-brand-orange"> *</span> : null}</span>
            <span className="block text-[11px] text-slate">{typeLabel(field.type)}{field.width === 'half' ? ' · half width' : ''}</span>
          </span>
        </button>
        <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${field.label} up`}><ChevronUp size={14} /></button>
        <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${field.label} down`}><ChevronDown size={14} /></button>
        <button type="button" className={iconBtn} onClick={onDuplicate} disabled={!canAddMore} aria-label={`Duplicate ${field.label}`} title={canAddMore ? 'Duplicate' : `A form can have ${MAX_CONTACT_FIELDS} fields`}><Copy size={13} /></button>
        <button type="button" className={`${iconBtn} hover:text-error`} onClick={onRemove} aria-label={`Delete ${field.label}`}><Trash2 size={13} /></button>
      </div>

      {open && (
        <div id={`${uid}-panel`} className="flex flex-col gap-3 border-t border-bone px-3 py-3">
          <div>
            <label htmlFor={`${uid}-type`} className="mb-1 block text-[12px] font-medium text-charcoal">Type</label>
            <select id={`${uid}-type`} className={inp} value={field.type}
              onChange={e => {
                const type = e.target.value as ContactFieldType;
                onChange({
                  type,
                  ...(hasChoices(type) ? {} : { options: undefined }),
                  ...((type === 'dropdown' || type === 'radio') && !(field.options?.length) ? { options: ['Option 1', 'Option 2'] } : {}),
                });
              }}>
              {CONTACT_FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p className="m-0 mt-1 text-[11px] text-slate">{CONTACT_FIELD_TYPES.find(t => t.value === field.type)?.hint}</p>
          </div>
          <div>
            <label htmlFor={`${uid}-label`} className="mb-1 block text-[12px] font-medium text-charcoal">Label</label>
            <input id={`${uid}-label`} className={inp} value={field.label} maxLength={60} onChange={e => onChange({ label: e.target.value })} />
          </div>
          {!noPlaceholder && (
            <div>
              <label htmlFor={`${uid}-ph`} className="mb-1 block text-[12px] font-medium text-charcoal">Placeholder</label>
              <input id={`${uid}-ph`} className={inp} value={field.placeholder ?? ''} maxLength={80} onChange={e => onChange({ placeholder: e.target.value })} />
            </div>
          )}
          {choices && (
            <ChoicesInput
              key={field.id + field.type} id={`${uid}-choices`} options={field.options ?? []} onChange={options => onChange({ options })}
              hint={field.type === 'checkbox' ? 'Leave empty for one single tick box (the label is its text).' : 'Visitors can pick one.'}
            />
          )}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-charcoal">Required</span>
            <Toggle checked={!!field.required} onChange={v => onChange({ required: v })} />
          </div>
          <div>
            <label htmlFor={`${uid}-width`} className="mb-1 block text-[12px] font-medium text-charcoal">Column width</label>
            <select id={`${uid}-width`} className={inp} value={field.width === 'half' ? 'half' : 'full'} onChange={e => onChange({ width: e.target.value === 'half' ? 'half' : 'full' })}>
              <option value="full">100% (full row)</option>
              <option value="half">50% (two fields side by side)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The contact form builder: add, edit, reorder, duplicate and delete the fields visitors fill in.
 * Shopify Forms' rules (field types, up to 31 fields, an Email or Phone field must be required) with a WordPress-style editor.
 * A section saved before this existed shows its old fixed form as an editable list.
 */
export function FormFieldsEditor({ settings, set }: { settings: Record<string, any>; set: (patch: Record<string, any>) => void }) {
  const fields = resolveContactFields(settings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const commit = (next: ContactFormField[]) => set({ fields: next });
  const patch = (id: string, p: Partial<ContactFormField>) => commit(fields.map(f => (f.id === id ? { ...f, ...p } : f)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = fields.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const problem = contactFormProblem(fields);
  const canAddMore = fields.length < MAX_CONTACT_FIELDS;
  const confirming = fields.find(f => f.id === confirmId);

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 && <p className="m-0 rounded-lg border border-dashed border-bone px-3 py-4 text-center text-[12px] text-slate">The form is empty. Add the fields you want to ask for.</p>}
      {fields.map((f, i) => (
        <FieldCard
          key={f.id} field={f} index={i} total={fields.length} open={openId === f.id} canAddMore={canAddMore}
          onToggle={() => setOpenId(openId === f.id ? null : f.id)}
          onChange={p => patch(f.id, p)}
          onMove={dir => move(i, dir)}
          onDuplicate={() => { const copy = { ...f, id: newFieldId(), label: `${f.label} (copy)`.slice(0, 60) }; const next = fields.slice(); next.splice(i + 1, 0, copy); commit(next); setOpenId(copy.id); }}
          onRemove={() => setConfirmId(f.id)}
        />
      ))}

      {confirming && (
        <div role="alertdialog" aria-label="Delete field" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error-border bg-error-bg px-3 py-2">
          <span className="text-[12px] text-charcoal">Delete "{confirming.label}"? Answers already received keep their text.</span>
          <span className="flex gap-2">
            <button type="button" className="rounded-md border border-bone bg-white px-2.5 py-1 text-[12px] cursor-pointer" onClick={() => setConfirmId(null)}>Keep</button>
            <button type="button" className="rounded-md border-none bg-error px-2.5 py-1 text-[12px] font-semibold text-white cursor-pointer" onClick={() => { commit(fields.filter(f => f.id !== confirming.id)); setConfirmId(null); }}>Delete</button>
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          aria-label="Add a field" className={inp} value="" disabled={!canAddMore}
          onChange={e => {
            const type = e.target.value as ContactFieldType;
            if (!type) return;
            const field = newContactField(type);
            commit([...fields, field]);
            setOpenId(field.id);
          }}>
          <option value="">+ Add field…</option>
          {CONTACT_FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="shrink-0 text-[11px] text-slate">{fields.length} / {MAX_CONTACT_FIELDS}</span>
      </div>
      {problem && <p role="alert" className="m-0 text-[12px] text-error">{problem}</p>}
    </div>
  );
}
