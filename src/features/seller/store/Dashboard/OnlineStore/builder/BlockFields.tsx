import { Field, Toggle } from '@/components/comman/ui';
import { LinkTargetFields, type LinkTarget } from './LinkTargetFields';
import { SortableList } from './Sortable';
import { SchemaForm } from './SchemaForm';
import { BLOCK_SCHEMAS } from './sectionRegistry';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

export interface PageOption { slug: string; title: string }

/** One block's settings-editing form, dispatched by `type`. `nav_link` and
 *  `footer_column` stay hand-written here — they're genuinely recursive
 *  nested-link-list editors, not flat settings, the one deliberate exception
 *  to the schema-driven system (see `SchemaForm.tsx`'s own comment). Every
 *  other block type is driven by `BLOCK_SCHEMAS[type]` (`sectionRegistry.ts`)
 *  through the generic `SchemaForm` — this file used to have a hand-written
 *  `switch` case per type instead. */
export function BlockFields({ type, settings, onChange, pageOptions, storeId }: {
  type: string;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  pageOptions: PageOption[];
  storeId: string;
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });

  switch (type) {
    case 'nav_link': {
      const children: any[] = settings.children ?? [];
      return (
        <div className="flex flex-col gap-2">
          <Field label="Label"><input className={inp} value={settings.label ?? ''} onChange={e => set({ label: e.target.value })} /></Field>
          <LinkTargetFields value={settings as LinkTarget} onChange={next => onChange({ ...settings, ...next })} pageOptions={pageOptions} storeId={storeId} />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal">Highlight as button</span>
            <Toggle checked={!!settings.highlight} onChange={v => set({ highlight: v })} />
          </div>

          <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-bone">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Dropdown items</p>
            {children.length === 0 && (
              <p className="text-[12px] text-slate">No dropdown — this link goes straight to its target above.</p>
            )}
            <SortableList items={children} keyFor={(_c, i) => `child-${i}`} onReorder={next => set({ children: next })}>
              {(child, i) => (
                <div className="border border-bone rounded-lg p-2 relative bg-white">
                  <button type="button" onClick={() => set({ children: children.filter((_, j) => j !== i) })}
                    className="absolute top-1 right-1 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
                  <Field label="Label"><input className={inp} value={child.label ?? ''} onChange={e => set({ children: children.map((c, j) => j === i ? { ...c, label: e.target.value } : c) })} /></Field>
                  <LinkTargetFields value={child} onChange={next => set({ children: children.map((c, j) => j === i ? { ...c, ...next } : c) })} pageOptions={pageOptions} storeId={storeId} />
                </div>
              )}
            </SortableList>
            {children.length < 8 && (
              <button type="button" onClick={() => set({ children: [...children, { label: '', linkType: 'home' }] })}
                className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add dropdown item</button>
            )}
          </div>
        </div>
      );
    }

    case 'footer_column': {
      const links: any[] = settings.links ?? [];
      return (
        <div className="flex flex-col gap-3">
          <Field label="Column heading"><input className={inp} value={settings.heading ?? ''} onChange={e => set({ heading: e.target.value })} /></Field>
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <div key={i} className="border border-bone rounded-lg p-2 relative">
                <button type="button" onClick={() => set({ links: links.filter((_, j) => j !== i) })}
                  className="absolute top-1 right-1 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
                <Field label="Label"><input className={inp} value={link.label ?? ''} onChange={e => set({ links: links.map((l, j) => j === i ? { ...l, label: e.target.value } : l) })} /></Field>
                <LinkTargetFields value={link} onChange={next => set({ links: links.map((l, j) => j === i ? { ...l, ...next } : l) })} pageOptions={pageOptions} storeId={storeId} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[12px] text-charcoal">Highlight as button</span>
                  <Toggle checked={!!link.highlight} onChange={v => set({ links: links.map((l, j) => j === i ? { ...l, highlight: v } : l) })} />
                </div>
              </div>
            ))}
            {links.length < 10 && (
              <button type="button" onClick={() => set({ links: [...links, { label: '', linkType: 'home' }] })}
                className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add link</button>
            )}
          </div>
        </div>
      );
    }

    case 'divider':
      return <p className="text-[12px] text-slate italic">A plain divider line — no settings.</p>;

    default: {
      const schema = BLOCK_SCHEMAS[type];
      if (!schema) return null;
      return <SchemaForm schema={schema} settings={settings} onChange={onChange} storeId={storeId} pageOptions={pageOptions} />;
    }
  }
}
