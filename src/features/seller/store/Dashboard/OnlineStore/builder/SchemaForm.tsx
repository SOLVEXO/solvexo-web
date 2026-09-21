import { useState, useEffect } from 'react';
import { Field, ImageUpload, Toggle } from '@/components/comman/ui';
import { EntityPickerModal, type EntityPickerMode } from './EntityPickerModal';
import { LinkTargetFields, type LinkTarget } from './LinkTargetFields';
import type { PageOption } from './BlockFields';
import { apiGetPublicMetaobjectDefinitions, type PublicMetaobjectDefinition } from '@/api/services/metaobjects';
import { apiListMetafieldDefinitions, type MetafieldDefinition, type MetafieldOwnerResource } from '@/api/services/metafields';

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
  | 'metaobjectTypePicker' | 'metafieldKeyPicker'
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
  /** 'metafieldKeyPicker' only — Phase 9, Dynamic Sources: the sibling
   *  field's `key` this picker overrides once a real custom field is
   *  connected (e.g. `paragraph`'s `dynamicSourceKey` row pairs with its
   *  own `text` row). `SchemaForm` dims that field and shows why, so the
   *  seller can always see which value is actually in control — see this
   *  field's own render logic below. */
  pairsWith?: string;
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

// "Dynamic Sources" — binds a field (a paragraph/heading block's `text`, or
// a rich_text section's own `heading`) to one of this store's own real
// custom fields instead of a static value (see
// AtelierContentBlocks.tsx/NovaContentBlocks.tsx's identical consumer
// side). Previously this was two raw text inputs (namespace + key) a
// seller had to type by hand, exact-match, with a silent no-op on any typo
// — found during the Catalog audit. A real dropdown of the store's own
// definitions removes that entire error class; namespace is always
// 'custom' today (see MetafieldDefinition's own doc comment), so this
// field only needs to store the key.
//
// Phase 9 — generalized beyond the original Product-only, paragraph-only
// MVP: `ownerResource` is now the real context of whatever's being edited
// (resolved by `AtelierCustomizePage.tsx` per scope — Product Template →
// 'product', Collection Template → 'collection', a custom Page → 'page',
// Blog Article Template → 'article'), not a hardcoded literal — a store's
// own Category-scoped fields are deliberately never offered here, since no
// Customize scope represents a single real Category to resolve one
// against. `json`-typed fields are filtered out — this field always feeds
// a plain-text-rendering setting, and a raw JSON blob pasted inline would
// be a real, visible footgun (matches the backend's own
// `DYNAMIC_SOURCE_INCOMPATIBLE_TYPES`, kept in sync by hand).
function MetafieldKeyPickerField({ value, storeId, ownerResource, onChange }: { value: string | undefined; storeId: string; ownerResource?: MetafieldOwnerResource | null; onChange: (key: string) => void }) {
  const [defs, setDefs] = useState<MetafieldDefinition[] | null>(null);

  useEffect(() => {
    if (!ownerResource) { setDefs([]); return; }
    setDefs(null);
    apiListMetafieldDefinitions(storeId, ownerResource).then(res => setDefs(res.data.filter(d => d.type !== 'json'))).catch(() => setDefs([]));
  }, [storeId, ownerResource]);

  if (!ownerResource) {
    return <div className={`${inp} text-slate`}>Dynamic sources aren't available in this context — there's no single real item here to bind a custom field to.</div>;
  }
  if (defs === null) return <div className={inp}>Loading custom fields…</div>;
  if (defs.length === 0) {
    return <div className={`${inp} text-slate`}>No {ownerResource} custom fields yet — create one under "Custom Fields" in the sidebar first.</div>;
  }

  const connected = defs.find(d => d.key === value);

  return (
    <div className="flex flex-col gap-1.5">
      <select className={inp} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">— Use the plain value above —</option>
        {defs.map(d => <option key={d._id} value={d.key}>{d.name}</option>)}
      </select>
      {connected && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-success">
          🔗 Connected — resolves to this {ownerResource}'s real "{connected.name}" value
        </p>
      )}
    </div>
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

function renderField(field: FieldSchema, settings: Record<string, any>, setRaw: (patch: Record<string, any>) => void, storeId: string, pageOptions: PageOption[], ownerResource?: MetafieldOwnerResource | null) {
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

    case 'metafieldKeyPicker':
      // Real, previously-latent bug found via end-to-end testing: this only
      // ever wrote `dynamicSourceKey`, never the sibling `dynamicSourceNamespace`
      // the backend's `assertDynamicSource` requires set together (see
      // `section-settings.validator.ts`) — every save through this picker
      // was rejected with a 400 the moment it was actually exercised.
      // Namespace is always 'custom' (no UI to choose another — see
      // `MetafieldDefinition`'s own doc comment), so it's set as a fixed
      // pair with the key, and cleared together too.
      return <MetafieldKeyPickerField value={value} storeId={storeId} ownerResource={ownerResource} onChange={key => set({ [field.key]: key, dynamicSourceNamespace: key ? 'custom' : '' })} />;

    case 'itemList':
      return <ItemListField items={Array.isArray(value) ? value : []} onChange={next => set({ [field.key]: next })} max={field.max} />;

    default:
      return null;
  }
}

/** Generic renderer for any `FieldSchema[]` — powers both section settings and (non-recursive) block settings. */
export function SchemaForm({ schema, settings, onChange, storeId, pageOptions, ownerResource }: {
  schema: FieldSchema[];
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
  /** Phase 9 — Dynamic Sources: the real resource type whatever's currently
   *  being edited belongs to (see `MetafieldKeyPickerField`'s own doc
   *  comment). `undefined`/`null` for any caller that never has a
   *  `metafieldKeyPicker` field in its schema at all — harmless either way,
   *  since that field kind is the only thing that reads it. */
  ownerResource?: MetafieldOwnerResource | null;
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });
  const visible = schema.filter(f => !f.showIf || f.showIf(settings));
  // Phase 9 — a field currently overridden by a connected dynamic source
  // (see `FieldSchema.pairsWith`) — dimmed below so it's always visually
  // clear which value (the static one, or the connected custom field) is
  // actually in control, rather than showing two live-looking inputs.
  const boundAwayKeys = new Set(
    schema.filter(f => f.kind === 'metafieldKeyPicker' && f.pairsWith && !!settings[f.key]).map(f => f.pairsWith as string),
  );

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
          {row.map(field => {
            const dimmed = boundAwayKeys.has(field.key);
            return field.kind === 'checkbox' ? (
              <div key={field.key} className={dimmed ? 'opacity-50 pointer-events-none' : undefined}>{renderField(field, settings, set, storeId, pageOptions ?? [], ownerResource)}</div>
            ) : (
              <Field key={field.key} label={field.label} required={field.required} hint={dimmed ? 'Unused — a custom field is connected below.' : field.hint}>
                <div className={dimmed ? 'opacity-50 pointer-events-none' : undefined}>
                  {renderField(field, settings, set, storeId, pageOptions ?? [], ownerResource)}
                </div>
              </Field>
            );
          })}
        </div>
      ))}
    </div>
  );
}
