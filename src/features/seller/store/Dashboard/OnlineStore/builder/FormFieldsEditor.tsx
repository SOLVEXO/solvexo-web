import { useId, useState, type ReactNode } from 'react';
import { SavedFormsPanel } from './SavedFormsPanel';
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import {
  CONDITION_OPS, CONTACT_FIELD_TYPES, FIELD_WIDTHS, FILE_KIND_OPTIONS, MAX_CHOICES, MAX_CONTACT_FIELDS, MAX_FILE_MB, conditionSources, contactFormProblem, hasChoices, isStaticField,
  labelLimit, newContactField, newFieldId, resolveContactFields,
  type ContactFieldType, type ContactFormField,
} from '@/features/storefront-themes/core/forms/contactFormFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';
const iconBtn = 'inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent text-slate cursor-pointer hover:bg-cream disabled:opacity-30 disabled:cursor-default';
const typeLabel = (t: ContactFieldType) => CONTACT_FIELD_TYPES.find(x => x.value === t)?.label ?? t;
const GROUPS = ['Text', 'Choices', 'More', 'Layout'] as const;

/** Types that take a placeholder / a starting value / a length limit. */
const TYPING = new Set<ContactFieldType>(['name', 'text', 'textarea', 'email', 'phone', 'url', 'number']);
const PLACEHOLDER = new Set<ContactFieldType>([...TYPING, 'dropdown', 'country']);

function TypeOptions() {
  return (
    <>
      {GROUPS.map(g => (
        <optgroup key={g} label={g}>
          {CONTACT_FIELD_TYPES.filter(t => t.group === g).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </optgroup>
      ))}
    </>
  );
}

function Labeled({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-charcoal">{label}</label>
      {children}
      {hint && <p className="m-0 mt-1 text-[11px] text-slate">{hint}</p>}
    </div>
  );
}

/** The choices of a dropdown / radio / checkbox field, one per line (kept as typed, empty lines dropped when saved). */
function ChoicesInput({ id, options, onChange, hint }: { id: string; options: string[]; onChange: (next: string[]) => void; hint: string }) {
  const [raw, setRaw] = useState(options.join('\n'));
  return (
    <Labeled id={id} label="Choices" hint={`${hint} Up to ${MAX_CHOICES} choices.`}>
      <textarea
        id={id} rows={4} className={`${inp} resize-y`} value={raw} placeholder={'One choice per line\nOption 1\nOption 2'}
        onChange={e => {
          setRaw(e.target.value);
          const list = e.target.value.split('\n').map(l => l.trim().slice(0, 60)).filter(Boolean);
          onChange(Array.from(new Set(list)).slice(0, MAX_CHOICES));
        }}
      />
    </Labeled>
  );
}

/** "Show this field only if [field above] [is / is not / contains / is filled in / is empty] [answer]". */
function ConditionEditor({ field, sources, onChange }: { field: ContactFormField; sources: ContactFormField[]; onChange: (showIf: ContactFormField['showIf']) => void }) {
  const uid = useId();
  const cond = field.showIf;
  const source = sources.find(s => s.id === cond?.fieldId);
  const op = CONDITION_OPS.find(o => o.value === cond?.op);
  const answers = source?.options?.length ? source.options : null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bone bg-cream px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-charcoal">Show only if…</span>
        <Toggle checked={!!cond} onChange={on => onChange(on ? { fieldId: sources[0]?.id ?? '', op: 'filled' } : undefined)} />
      </div>
      {!!cond && (sources.length === 0
        ? <p className="m-0 text-[11px] text-slate">Put this field below another field to make it depend on that answer.</p>
        : (
          <>
            <select aria-label="Field this depends on" className={inp} value={cond.fieldId} onChange={e => onChange({ fieldId: e.target.value, op: cond.op, value: undefined })}>
              {sources.map(s => <option key={s.id} value={s.id}>{s.label || 'Untitled field'}</option>)}
            </select>
            <select aria-label="Condition" className={inp} value={cond.op} onChange={e => onChange({ ...cond, op: e.target.value as NonNullable<typeof cond>['op'] })}>
              {CONDITION_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {op?.needsValue && (answers && cond.op !== 'contains' ? (
              <select aria-label="Answer" id={`${uid}-ans`} className={inp} value={cond.value ?? ''} onChange={e => onChange({ ...cond, value: e.target.value })}>
                <option value="">Choose the answer…</option>
                {answers.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input aria-label="Answer" id={`${uid}-ans`} className={inp} value={cond.value ?? ''} maxLength={200} placeholder="The answer" onChange={e => onChange({ ...cond, value: e.target.value })} />
            ))}
          </>
        ))}
    </div>
  );
}

function FieldCard({ field, index, total, open, sources, onToggle, onChange, onMove, onDuplicate, onRemove, canAddMore }: {
  field: ContactFormField; index: number; total: number; open: boolean; sources: ContactFormField[]; onToggle: () => void;
  onChange: (patch: Partial<ContactFormField>) => void; onMove: (dir: -1 | 1) => void; onDuplicate: () => void; onRemove: () => void; canAddMore: boolean;
}) {
  const uid = useId();
  const type = field.type;
  const isStatic = isStaticField(type);
  const isHidden = type === 'hidden';
  const collects = !isStatic && !isHidden;
  const num = (v: string) => (v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
  const hiddenKind = field.defaultValue === '{page_url}' || field.defaultValue === '{page_title}' ? field.defaultValue : 'custom';
  return (
    <div className="rounded-lg border border-bone bg-white">
      <div className="flex items-center gap-1 pr-1">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${uid}-panel`}
          className="flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent px-3 py-2.5 text-left cursor-pointer">
          <ChevronDown size={14} className={`shrink-0 text-slate transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-charcoal">{field.label || 'Untitled field'}{field.required ? <span className="text-brand-orange"> *</span> : null}</span>
            <span className="block text-[11px] text-slate">{typeLabel(type)}{field.width && field.width !== 'full' ? ` · ${field.width === 'half' ? '50%' : field.width === 'third' ? '33%' : '25%'} width` : ''}{field.showIf ? ' · conditional' : ''}</span>
          </span>
        </button>
        <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${field.label} up`}><ChevronUp size={14} /></button>
        <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${field.label} down`}><ChevronDown size={14} /></button>
        <button type="button" className={iconBtn} onClick={onDuplicate} disabled={!canAddMore} aria-label={`Duplicate ${field.label}`} title={canAddMore ? 'Duplicate' : `A form can have ${MAX_CONTACT_FIELDS} fields`}><Copy size={13} /></button>
        <button type="button" className={`${iconBtn} hover:text-error`} onClick={onRemove} aria-label={`Delete ${field.label}`}><Trash2 size={13} /></button>
      </div>

      {open && (
        <div id={`${uid}-panel`} className="flex flex-col gap-3 border-t border-bone px-3 py-3">
          <Labeled id={`${uid}-type`} label="Type" hint={CONTACT_FIELD_TYPES.find(t => t.value === type)?.hint}>
            <select id={`${uid}-type`} className={inp} value={type}
              onChange={e => {
                const next = e.target.value as ContactFieldType;
                onChange({
                  type: next,
                  // what no longer applies to the new type is dropped, so nothing odd stays hidden in the saved form
                  options: hasChoices(next) ? (next === 'checkbox' ? field.options : (field.options?.length ? field.options : ['Option 1', 'Option 2'])) : undefined,
                  min: next === 'number' ? field.min : undefined, max: next === 'number' ? field.max : undefined,
                  minLength: next === 'text' || next === 'textarea' ? field.minLength : undefined, maxLength: next === 'text' || next === 'textarea' ? field.maxLength : undefined,
                  defaultValue: undefined,
                  fileKinds: next === 'file' ? field.fileKinds : undefined, maxSizeMb: next === 'file' ? field.maxSizeMb : undefined,
                  subscribes: next === 'consent' ? field.subscribes : undefined,
                  ...(isStaticField(next) ? { required: false, helpText: undefined, placeholder: undefined, errorMessage: undefined, showIf: undefined } : {}),
                  ...(next === 'hidden' ? { required: false, defaultValue: '{page_url}' } : {}),
                });
              }}>
              <TypeOptions />
            </select>
          </Labeled>

          <Labeled id={`${uid}-label`} label={type === 'paragraph' ? 'Text' : type === 'heading' ? 'Heading' : type === 'step' ? 'Step title (shown above the fields of this page)' : type === 'consent' ? 'Sentence next to the tick box' : 'Label'}>
            {type === 'paragraph' || type === 'consent'
              ? <textarea id={`${uid}-label`} rows={3} className={`${inp} resize-y`} value={field.label} maxLength={labelLimit(type)} onChange={e => onChange({ label: e.target.value })} />
              : <input id={`${uid}-label`} className={inp} value={field.label} maxLength={labelLimit(type)} onChange={e => onChange({ label: e.target.value })} />}
          </Labeled>

          {PLACEHOLDER.has(type) && (
            <Labeled id={`${uid}-ph`} label="Placeholder">
              <input id={`${uid}-ph`} className={inp} value={field.placeholder ?? ''} maxLength={80} onChange={e => onChange({ placeholder: e.target.value })} />
            </Labeled>
          )}
          {collects && (
            <Labeled id={`${uid}-help`} label="Help text" hint="A small note under the field.">
              <input id={`${uid}-help`} className={inp} value={field.helpText ?? ''} maxLength={150} onChange={e => onChange({ helpText: e.target.value })} />
            </Labeled>
          )}

          {hasChoices(type) && (
            <ChoicesInput
              key={field.id + type} id={`${uid}-choices`} options={field.options ?? []} onChange={options => onChange({ options })}
              hint={type === 'checkbox' ? 'Leave empty for one single tick box (the label is its text).' : 'Visitors can pick one.'}
            />
          )}

          {(TYPING.has(type) && type !== 'email' && type !== 'phone') && (
            <Labeled id={`${uid}-def`} label="Starting value" hint="Filled in when the form opens. The visitor can change it.">
              <input id={`${uid}-def`} className={inp} value={field.defaultValue ?? ''} maxLength={200} onChange={e => onChange({ defaultValue: e.target.value || undefined })} />
            </Labeled>
          )}
          {(type === 'dropdown' || type === 'radio') && (field.options?.length ?? 0) > 0 && (
            <Labeled id={`${uid}-def`} label="Starting choice">
              <select id={`${uid}-def`} className={inp} value={field.defaultValue ?? ''} onChange={e => onChange({ defaultValue: e.target.value || undefined })}>
                <option value="">None</option>
                {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Labeled>
          )}
          {isHidden && (
            <>
              <Labeled id={`${uid}-hid`} label="Saved with every answer" hint="The visitor never sees this field.">
                <select id={`${uid}-hid`} className={inp} value={hiddenKind} onChange={e => onChange({ defaultValue: e.target.value === 'custom' ? 'My text' : e.target.value })}>
                  <option value="{page_url}">The page address</option>
                  <option value="{page_title}">The page title</option>
                  <option value="custom">A fixed text</option>
                </select>
              </Labeled>
              {hiddenKind === 'custom' && (
                <Labeled id={`${uid}-hidtext`} label="Fixed text">
                  <input id={`${uid}-hidtext`} className={inp} value={field.defaultValue ?? ''} maxLength={200} onChange={e => onChange({ defaultValue: e.target.value })} />
                </Labeled>
              )}
            </>
          )}

          {type === 'number' && (
            <div className="grid grid-cols-2 gap-2">
              <Labeled id={`${uid}-min`} label="Minimum"><input id={`${uid}-min`} type="number" className={inp} value={field.min ?? ''} onChange={e => onChange({ min: num(e.target.value) })} /></Labeled>
              <Labeled id={`${uid}-max`} label="Maximum"><input id={`${uid}-max`} type="number" className={inp} value={field.max ?? ''} onChange={e => onChange({ max: num(e.target.value) })} /></Labeled>
            </div>
          )}
          {(type === 'text' || type === 'textarea') && (
            <div className="grid grid-cols-2 gap-2">
              <Labeled id={`${uid}-minl`} label="Minimum length"><input id={`${uid}-minl`} type="number" min={0} max={3000} className={inp} value={field.minLength ?? ''} onChange={e => onChange({ minLength: num(e.target.value) })} /></Labeled>
              <Labeled id={`${uid}-maxl`} label="Maximum length"><input id={`${uid}-maxl`} type="number" min={0} max={3000} className={inp} value={field.maxLength ?? ''} onChange={e => onChange({ maxLength: num(e.target.value) })} /></Labeled>
            </div>
          )}

          {type === 'file' && (
            <div className="grid grid-cols-2 gap-2">
              <Labeled id={`${uid}-kinds`} label="Accepted files" hint={FILE_KIND_OPTIONS.find(o => o.value === (field.fileKinds ?? 'both'))?.hint}>
                <select id={`${uid}-kinds`} className={inp} value={field.fileKinds ?? 'both'} onChange={e => onChange({ fileKinds: e.target.value as ContactFormField['fileKinds'] })}>
                  {FILE_KIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Labeled>
              <Labeled id={`${uid}-mb`} label="Largest file (MB)" hint={`Up to ${MAX_FILE_MB} MB.`}>
                <input id={`${uid}-mb`} type="number" min={1} max={MAX_FILE_MB} className={inp} value={field.maxSizeMb ?? MAX_FILE_MB} onChange={e => onChange({ maxSizeMb: Math.min(MAX_FILE_MB, Math.max(1, Math.round(Number(e.target.value) || MAX_FILE_MB))) })} />
              </Labeled>
            </div>
          )}
          {type === 'consent' && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-charcoal">Also sign the visitor up for my email marketing when ticked<span className="block text-[11px] text-slate">Needs an Email field. People who unsubscribed before are never added again.</span></span>
              <Toggle checked={!!field.subscribes} onChange={v => onChange({ subscribes: v || undefined })} />
            </div>
          )}
          {collects && (
            <Labeled id={`${uid}-err`} label="Your own error message" hint="Shown when this field is missing or wrong. Leave empty for the standard message.">
              <input id={`${uid}-err`} className={inp} value={field.errorMessage ?? ''} maxLength={120} onChange={e => onChange({ errorMessage: e.target.value || undefined })} />
            </Labeled>
          )}
          {collects && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-charcoal">Required</span>
              <Toggle checked={!!field.required} onChange={v => onChange({ required: v })} />
            </div>
          )}
          {!isHidden && (
            <Labeled id={`${uid}-width`} label="Column width">
              <select id={`${uid}-width`} className={inp} value={field.width ?? 'full'} onChange={e => onChange({ width: e.target.value as ContactFormField['width'] })}>
                {FIELD_WIDTHS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </Labeled>
          )}
          {!isHidden && <ConditionEditor field={field} sources={sources} onChange={showIf => onChange({ showIf })} />}
        </div>
      )}
    </div>
  );
}

/**
 * The form builder: add, edit, reorder, duplicate and delete the fields visitors fill in, with conditional logic.
 * Shopify Forms' rules (field types, up to 31 fields, an Email or Phone field must be required) with a WordPress-style editor.
 * A section saved before this existed shows its old fixed form as an editable list.
 */
export function FormFieldsEditor({ settings, set, storeId }: { settings: Record<string, any>; set: (patch: Record<string, any>) => void; storeId?: string }) {
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
    // A field may only depend on fields ABOVE it: moving one up past its cause (or a cause down past it) drops that condition.
    const pos = new Map(next.map((f, k) => [f.id, k]));
    commit(next.map((f, k) => (f.showIf && !((pos.get(f.showIf.fieldId) ?? Infinity) < k) ? { ...f, showIf: undefined } : f)));
  };
  const remove = (id: string) => commit(fields.filter(f => f.id !== id).map(f => (f.showIf?.fieldId === id ? { ...f, showIf: undefined } : f)));
  const problem = contactFormProblem(fields);
  const canAddMore = fields.length < MAX_CONTACT_FIELDS;
  const confirming = fields.find(f => f.id === confirmId);

  return (
    <div className="flex flex-col gap-2">
      {storeId && <SavedFormsPanel storeId={storeId} settings={settings} set={set} />}
      {fields.length === 0 && <p className="m-0 rounded-lg border border-dashed border-bone px-3 py-4 text-center text-[12px] text-slate">The form is empty. Add the fields you want to ask for.</p>}
      {fields.map((f, i) => (
        <FieldCard
          key={f.id} field={f} index={i} total={fields.length} open={openId === f.id} canAddMore={canAddMore} sources={conditionSources(fields, i)}
          onToggle={() => setOpenId(openId === f.id ? null : f.id)}
          onChange={p => patch(f.id, p)}
          onMove={dir => move(i, dir)}
          onDuplicate={() => { const copy = { ...f, id: newFieldId(), label: `${f.label} (copy)`.slice(0, labelLimit(f.type)), showIf: f.showIf }; const next = fields.slice(); next.splice(i + 1, 0, copy); commit(next); setOpenId(copy.id); }}
          onRemove={() => setConfirmId(f.id)}
        />
      ))}

      {confirming && (
        <div role="alertdialog" aria-label="Delete field" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error-border bg-error-bg px-3 py-2">
          <span className="text-[12px] text-charcoal">Delete "{confirming.label}"? Answers already received keep their text.</span>
          <span className="flex gap-2">
            <button type="button" className="rounded-md border border-bone bg-white px-2.5 py-1 text-[12px] cursor-pointer" onClick={() => setConfirmId(null)}>Keep</button>
            <button type="button" className="rounded-md border-none bg-error px-2.5 py-1 text-[12px] font-semibold text-white cursor-pointer" onClick={() => { remove(confirming.id); setConfirmId(null); }}>Delete</button>
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
          <TypeOptions />
        </select>
        <span className="shrink-0 text-[11px] text-slate">{fields.length} / {MAX_CONTACT_FIELDS}</span>
      </div>
      {problem && <p role="alert" className="m-0 text-[12px] text-error">{problem}</p>}
    </div>
  );
}
