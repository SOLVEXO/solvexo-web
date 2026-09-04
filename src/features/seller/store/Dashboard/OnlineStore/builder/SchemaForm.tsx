import { useState, useEffect } from 'react';
import { Field, ImageUpload, Toggle } from '@/components/comman/ui';
import { EntityPickerModal, type EntityPickerMode } from './EntityPickerModal';
import { LinkTargetFields, type LinkTarget } from './LinkTargetFields';
import type { PageOption } from './BlockFields';
import { apiGetPublicMetaobjectDefinitions, type PublicMetaobjectDefinition } from '@/api/services/metaobjects';

/**
 * The schema-driven settings engine — this is the piece that was entirely
 * missing before: every section/block type used to need its own hand-written
 * `if (type === '…')` branch in `SectionFields.tsx`/`BlockFields.tsx`. Now a
 * section or block type just DECLARES an array of `FieldSchema` (see
 * `sectionRegistry.ts`'s `settingsSchema`/`BLOCK_SCHEMAS`) and this one
 * generic form renders it — adding a new field to an existing type, or even
 * a whole new type, means editing the schema array, never this file.
 *
 * Scope: this drives a section's OWN settings and a block's OWN settings —
 * both are flat `Record<string, any>` objects. `nav_link`/`footer_column`
 * are the one deliberate, disclosed exception (recursive nested-link-list
 * editors, not flat settings) and stay hand-written in `BlockFields.tsx`,
 * matching this codebase's own established convention for those two types.
 *
 * Backend validation (`section-settings.validator.ts`) is NOT derived from
 * this schema — the frontend (React) and backend (NestJS) are separate
 * codebases with no shared runtime/package, so there is no single file that
 * drives both the way a Shopify section's `{% schema %}` block does. This
 * schema is the single source of truth for the EDITOR; the validator stays
 * its own explicit, hand-maintained source of truth for what the SERVER
 * accepts. Keep the two in sync by hand when either changes.
 */

export type FieldKind =
  | 'text' | 'textarea' | 'number' | 'select' | 'checkbox'
  | 'image' | 'url' | 'link' | 'datetime'
  | 'categoryPicker' | 'collectionPicker' | 'categoryMultiPicker' | 'productMultiPicker'
  | 'metaobjectTypePicker'
  | 'itemList';

export interface FieldOption { value: string; label: string }

export interface FieldSchema {
  /** The key this field reads/writes on the settings object — `settings.ctaLink`, `product.categoryId`, etc. */
  key: string;
  kind: FieldKind;
  label: string;
  hint?: string;
  required?: boolean;
  /** Applied once, the first time this field is ever rendered for a fresh settings object — NOT re-applied on every render (see `sectionRegistry.ts`'s `defaultSettings`/`defaultBlockSettings`, which is what actually seeds a new section/block; this is just what an empty input shows). */
  placeholder?: string;
  options?: FieldOption[]; // 'select'
  min?: number; max?: number; step?: number; // 'number'
  maxLength?: number; // 'text' | 'textarea'
  rows?: number; // 'textarea'
  /** Renders this field as half-width, paired with the next `half: true` field into one row — mirrors the old hand-written `grid grid-cols-2` layouts (e.g. testimonial's Author name/Author role). */
  half?: boolean;
  /** 'select' only — store the chosen option as a Number (e.g. `columns`), not the raw string the <select> element gives back. */
  numeric?: boolean;
  /** Other settings keys to null out when this field changes — e.g. picking a category clears a previously-picked collection on the same "filter to" slot, matching the old hand-written mutual-exclusivity behavior. */
  clears?: string[];
  /** Conditional visibility — reads the section/block's OTHER settings, e.g. `s => s.source === 'category'`. Replaces what used to be an inline `{settings.x === 'y' && …}` JSX guard. */
  showIf?: (settings: Record<string, any>) => boolean;
}

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const ta  = `${inp} resize-y min-h-[80px]`;

function EntityPickerField({ mode, multiple, value, onPick, label, storeId }: {
  mode: EntityPickerMode;
  multiple: boolean;
  value: string | string[] | undefined;
  onPick: (ids: string[]) => void;
  label: string;
  storeId: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = multiple ? (Array.isArray(value) ? value : []) : (value ? [value as string] : []);
  const countLabel = multiple
    ? (selectedIds.length > 0 ? `${selectedIds.length} selected — change` : label)
    : (selectedIds.length > 0 ? 'Change selection' : label);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="text-left px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white cursor-pointer">
        {countLabel}
      </button>
      {open && (
        <EntityPickerModal
          open={open}
          onClose={() => setOpen(false)}
          mode={mode}
          storeId={storeId}
          multiple={multiple}
          initialSelectedIds={selectedIds}
          onConfirm={ids => { onPick(ids); setOpen(false); }}
        />
      )}
    </>
  );
}

// Metaobject types are entirely seller-created and open-ended (unlike
// categories/collections/products, which already have `EntityPickerModal`'s
// searchable-modal infrastructure) — but the value this field actually
// stores is the definition's stable `type` slug, not a Mongo `_id`, so
// routing it through that id-shaped picker would need translating between
// the two on every read/write. A plain dynamically-populated `<select>` is
// simpler and matches what's normally a short, hand-curated list of content
// types (Team Member, Size Guide, …), not something that needs search/paging.
function MetaobjectTypePickerField({ value, storeId, onChange }: { value: string | undefined; storeId: string; onChange: (type: string) => void }) {
  const [defs, setDefs] = useState<PublicMetaobjectDefinition[] | null>(null);

  useEffect(() => {
    apiGetPublicMetaobjectDefinitions(storeId).then(res => setDefs(res.data)).catch(() => setDefs([]));
  }, [storeId]);

  if (defs === null) return <div className={inp}>Loading content types…</div>;
  if (defs.length === 0) return <div className={`${inp} text-slate`}>No content types yet — create one under "Content Types" in the sidebar first.</div>;

  return (
    <select className={inp} value={value ?? ''} onChange={e => onChange(e.target.value)}>
      <option value="" disabled>Choose a content type…</option>
      {defs.map(d => <option key={d._id} value={d.type}>{d.name}</option>)}
    </select>
  );
}

function ItemListField({ items, onChange, max = 20 }: { items: string[]; onChange: (next: string[]) => void; max?: number }) {
  const list = items.length > 0 ? items : [''];
  return (
    <div className="flex flex-col gap-2">
      {list.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={inp} value={item} onChange={e => onChange(list.map((it, j) => j === i ? e.target.value : it))} />
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-error bg-transparent border-none cursor-pointer px-2">×</button>
        </div>
      ))}
      {list.length < max && (
        <button type="button" onClick={() => onChange([...list, ''])} className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add item</button>
      )}
    </div>
  );
}

function renderField(field: FieldSchema, settings: Record<string, any>, setRaw: (patch: Record<string, any>) => void, storeId: string, pageOptions: PageOption[]) {
  const value = settings[field.key];
  // Wraps `set` so every field's change also nulls out whatever `clears`
  // declares — one mechanism for every "picking A un-picks B" case (source
  // switches, mutually-exclusive category/collection filters) instead of a
  // bespoke onChange per field like the old hand-written forms had.
  const set = (patch: Record<string, any>) => {
    if (!field.clears?.length) return setRaw(patch);
    setRaw({ ...patch, ...Object.fromEntries(field.clears.map(k => [k, undefined])) });
  };

  switch (field.kind) {
    case 'text':
      return <input className={inp} maxLength={field.maxLength} placeholder={field.placeholder} value={value ?? ''} onChange={e => set({ [field.key]: e.target.value })} />;

    case 'url':
      return <input className={inp} type="url" placeholder={field.placeholder ?? 'https://…'} value={value ?? ''} onChange={e => set({ [field.key]: e.target.value })} />;

    case 'textarea':
      return <textarea className={ta} rows={field.rows} maxLength={field.maxLength} placeholder={field.placeholder} value={value ?? ''} onChange={e => set({ [field.key]: e.target.value })} />;

    case 'number':
      return (
        <input
          type="number" className={inp} min={field.min} max={field.max} step={field.step ?? 1}
          value={value ?? ''}
          onChange={e => set({ [field.key]: e.target.value === '' ? undefined : Number(e.target.value) })}
        />
      );

    case 'select':
      return (
        <select
          className={inp}
          value={String(value ?? field.options?.[0]?.value ?? '')}
          onChange={e => set({ [field.key]: field.numeric ? Number(e.target.value) : e.target.value })}
        >
          {(field.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );

    case 'checkbox':
      return (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-charcoal">{field.label}</span>
          <Toggle checked={value !== false} onChange={v => set({ [field.key]: v })} />
        </div>
      );

    case 'image':
      return <ImageUpload value={value ? [value] : []} onChange={urls => set({ [field.key]: urls[0] ?? '' })} maxFiles={1} storeId={storeId} />;

    case 'link':
      return (
        <LinkTargetFields
          value={(value as LinkTarget) ?? { linkType: 'home' }}
          onChange={next => set({ [field.key]: next })}
          pageOptions={pageOptions}
          storeId={storeId}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local" className={inp}
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={e => set({ [field.key]: e.target.value ? new Date(e.target.value).toISOString() : '' })}
        />
      );

    case 'categoryPicker':
      return <EntityPickerField mode="categories" multiple={false} value={value} storeId={storeId} label="Choose a category" onPick={ids => set({ [field.key]: ids[0] })} />;

    case 'collectionPicker':
      return <EntityPickerField mode="collections" multiple={false} value={value} storeId={storeId} label="Choose a collection" onPick={ids => set({ [field.key]: ids[0] })} />;

    case 'categoryMultiPicker':
      return <EntityPickerField mode="categories" multiple value={value} storeId={storeId} label="Choose categories" onPick={ids => set({ [field.key]: ids.slice(0, 12) })} />;

    case 'productMultiPicker':
      return <EntityPickerField mode="products" multiple value={value} storeId={storeId} label="Choose products" onPick={ids => set({ [field.key]: ids })} />;

    case 'metaobjectTypePicker':
      return <MetaobjectTypePickerField value={value} storeId={storeId} onChange={type => set({ [field.key]: type })} />;

    case 'itemList':
      return <ItemListField items={Array.isArray(value) ? value : []} onChange={next => set({ [field.key]: next })} max={field.max} />;

    default:
      return null;
  }
}

/** Generic renderer for any `FieldSchema[]` — powers both section settings and (non-recursive) block settings. */
export function SchemaForm({ schema, settings, onChange, storeId, pageOptions }: {
  schema: FieldSchema[];
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });
  const visible = schema.filter(f => !f.showIf || f.showIf(settings));

  const rows: FieldSchema[][] = [];
  for (let i = 0; i < visible.length; i++) {
    const f = visible[i];
    if (f.half && visible[i + 1]?.half) { rows.push([f, visible[i + 1]]); i++; }
    else rows.push([f]);
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={row.map(f => f.key).join('+') || i} className={row.length === 2 ? 'grid grid-cols-2 gap-2' : undefined}>
          {row.map(field => (
            field.kind === 'checkbox' ? (
              <div key={field.key}>{renderField(field, settings, set, storeId, pageOptions ?? [])}</div>
            ) : (
              <Field key={field.key} label={field.label} required={field.required} hint={field.hint}>
                {renderField(field, settings, set, storeId, pageOptions ?? [])}
              </Field>
            )
          ))}
        </div>
      ))}
    </div>
  );
}
