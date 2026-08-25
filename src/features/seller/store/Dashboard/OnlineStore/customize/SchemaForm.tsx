import { useState } from 'react';
import { Field, ImageUpload, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import type { FieldSchema } from '@/features/storefront/sectionSchemaRegistry';
import { EntityPickerModal, type EntityPickerMode } from '../builder/EntityPickerModal';
import { LinkTargetFields, type LinkTarget } from '../builder/LinkTargetFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const ta = `${inp} resize-y min-h-[80px]`;

/**
 * The generic, schema-driven settings-panel renderer that replaces
 * `SectionFields.tsx`/`BlockFields.tsx`'s hand-per-type forms for every
 * section/block whose settings are a flat list of independent fields (the
 * large majority — see `sectionSchemaRegistry.ts`'s class comment). A new
 * section/block type's settings UI is created by declaring its
 * `FieldSchema[]` once, never by adding a new branch here.
 *
 * Two genuinely structural exceptions remain hand-written, not migrated:
 * `nav_link`'s nested dropdown-children editor and `footer_column`'s
 * repeating links list (`BlockFields.tsx`) — both are recursive
 * list-of-link-targets editors, a fundamentally different shape from "a flat
 * settings object," and forcing them into this flat-field model would
 * produce an awkward, harder-to-read abstraction for no real gain. Every
 * other section/block type in this codebase is schema-driven.
 */
export function SchemaForm({ fields, values, onChange, storeId, mainCategoryId, pageOptions }: {
  fields: FieldSchema[];
  values: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  mainCategoryId?: string;
  pageOptions?: { slug: string; title: string }[];
}) {
  const set = (patch: Record<string, any>) => onChange({ ...values, ...patch });
  const visible = fields.filter((f) => !f.showIf || f.showIf(values));

  const grouped = new Map<string | undefined, FieldSchema[]>();
  for (const f of visible) {
    const key = f.group;
    grouped.set(key, [...(grouped.get(key) ?? []), f]);
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(grouped.entries()).map(([group, groupFields]) => (
        <div key={group ?? '__root'} className="flex flex-col gap-2">
          {group && <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">{group}</p>}
          {groupFields.map((field) => (
            <SchemaFieldControl
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => set({ [field.key]: v })}
              storeId={storeId}
              mainCategoryId={mainCategoryId}
              pageOptions={pageOptions ?? []}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SchemaFieldControl({ field, value, onChange, storeId, mainCategoryId, pageOptions }: {
  field: FieldSchema;
  value: any;
  onChange: (v: any) => void;
  storeId: string;
  mainCategoryId?: string;
  pageOptions: { slug: string; title: string }[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  switch (field.kind) {
    case 'text':
      return (
        <Field label={field.label} hint={field.helpText}>
          <input className={inp} placeholder={field.placeholder} maxLength={field.maxLength}
            value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );

    case 'textarea':
    case 'richtext':
      return (
        <Field label={field.label} hint={field.helpText ?? (field.kind === 'richtext' ? 'Plain text only for now — rich formatting is on the roadmap.' : undefined)}>
          <textarea className={ta} placeholder={field.placeholder} maxLength={field.maxLength}
            value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );

    case 'color':
      return (
        <Field label={field.label} hint={field.helpText}>
          <div className="flex items-center gap-2">
            <input type="color" className="w-9 h-9 rounded border border-bone cursor-pointer p-0 bg-white"
              value={value ?? field.default ?? '#000000'} onChange={(e) => onChange(e.target.value)} />
            <input className={inp} value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)} />
          </div>
        </Field>
      );

    case 'select':
      return (
        <Field label={field.label} hint={field.helpText}>
          <select className={inp} value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)}>
            {(field.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>
      );

    case 'number':
      return (
        <Field label={field.label} hint={field.helpText}>
          <input type="number" className={inp} min={field.min} max={field.max} step={field.step ?? 1}
            value={value ?? field.default ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
        </Field>
      );

    case 'range':
      return (
        <Field label={`${field.label}${value !== undefined ? ` — ${value}` : ''}`} hint={field.helpText}>
          <input type="range" className="w-full" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1}
            value={value ?? field.default ?? field.min ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
        </Field>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-charcoal">{field.label}</span>
          <Toggle checked={value ?? field.default ?? false} onChange={onChange} ariaLabel={field.label} />
        </div>
      );

    case 'image':
      return (
        <Field label={field.label} hint={field.helpText}>
          <ImageUpload value={value ? [value] : []} onChange={(urls) => onChange(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
        </Field>
      );

    case 'icon':
      return (
        <Field label={field.label} hint={field.helpText}>
          <select className={inp} value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)}>
            {(field.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>
      );

    case 'link':
      return (
        <div className="flex flex-col gap-1">
          <p className="text-[12px] text-charcoal">{field.label}</p>
          <LinkTargetFields
            value={(value as LinkTarget) ?? { linkType: 'home' }}
            onChange={onChange}
            pageOptions={pageOptions}
            storeId={storeId}
            mainCategoryId={mainCategoryId}
          />
        </div>
      );

    case 'categoryPicker':
    case 'collectionPicker':
    case 'productPicker': {
      const mode: EntityPickerMode = field.kind === 'categoryPicker' ? 'categories' : field.kind === 'collectionPicker' ? 'collections' : 'products';
      const multiple = !!field.multiple;
      const ids: string[] = Array.isArray(value) ? value : value ? [value] : [];
      return (
        <Field label={field.label} hint={field.helpText}>
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            {ids.length > 0 ? `${ids.length} selected — change` : `Choose ${field.label.toLowerCase()}`}
          </Button>
          {pickerOpen && (
            <EntityPickerModal
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              mode={mode}
              storeId={storeId}
              mainCategoryId={mainCategoryId}
              multiple={multiple}
              initialSelectedIds={ids}
              onConfirm={(nextIds) => { onChange(multiple ? nextIds : nextIds[0]); setPickerOpen(false); }}
            />
          )}
        </Field>
      );
    }

    default:
      return null;
  }
}
