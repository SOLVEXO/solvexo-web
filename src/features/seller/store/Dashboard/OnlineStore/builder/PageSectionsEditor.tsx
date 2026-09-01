import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, LayoutTemplate, GripVertical, Eye, EyeOff, Copy } from 'lucide-react';
import { ActionMenu } from '@/components/comman/ui';
import type { Section, Block, SectionType } from '@/api/services/storefrontTypes';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import { SectionFields } from './SectionFields';
import { BlockFields, type PageOption } from './BlockFields';
import { SortableList } from './Sortable';
import { AddSectionModal } from './AddSectionModal';
import { ConfirmDialog } from './ConfirmDialog';

/** Strips `_id` so a duplicated block/section is persisted as a genuinely
 *  new document rather than colliding with the original's id. */
function cloneWithoutId<T extends { _id?: string }>(item: T): T {
  const { _id, ...rest } = item;
  void _id;
  return { ...rest } as T;
}

function BlockRow({ block, sectionType, onChange, onRemove, onDuplicate, pageOptions, storeId }: {
  block: Block;
  sectionType: string;
  onChange: (next: Block) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  pageOptions: PageOption[];
  storeId: string;
 
}) {
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const label = block.settings.label || block.settings.heading || block.settings.question || block.settings.text || block.settings.authorName || SECTION_META_BY_TYPE[sectionType as keyof typeof SECTION_META_BY_TYPE]?.blockLabel || block.type;
  const hidden = block.enabled === false;

  return (
    <div className={`border rounded-lg bg-white transition-colors ${open ? 'border-brand-orange/30' : 'border-bone'} ${hidden ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 pl-1 pr-2 py-1.5">
        <GripVertical size={13} className="text-bone shrink-0" />
        <button type="button" onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0 py-0.5">
          {open ? <ChevronUp size={13} className="text-slate shrink-0" /> : <ChevronDown size={13} className="text-slate shrink-0" />}
          <span className="text-[12.5px] font-medium text-charcoal truncate">{label || '(untitled)'}</span>
          {hidden && <span className="text-[10px] font-bold uppercase tracking-wide text-slate shrink-0">Hidden</span>}
        </button>
        <button type="button" onClick={() => onChange({ ...block, enabled: !hidden ? false : true })} aria-label={hidden ? 'Show' : 'Hide'} title={hidden ? 'Show' : 'Hide'}
          className="text-slate p-1 hover:bg-cream rounded-md bg-transparent border-none cursor-pointer shrink-0 transition-colors">
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button type="button" onClick={onDuplicate} aria-label="Duplicate" title="Duplicate"
          className="text-slate p-1 hover:bg-cream rounded-md bg-transparent border-none cursor-pointer shrink-0 transition-colors">
          <Copy size={13} />
        </button>
        <button type="button" onClick={() => setConfirmingRemove(true)} className="text-error/70 text-[11px] font-semibold px-2 py-1 hover:bg-error-bg hover:text-error rounded-md bg-transparent border-none cursor-pointer shrink-0 transition-colors">Remove</button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-bone/70">
          <BlockFields type={block.type} settings={block.settings} onChange={settings => onChange({ ...block, settings })} pageOptions={pageOptions} storeId={storeId} />
        </div>
      )}
      {confirmingRemove && (
        <ConfirmDialog
          title="Remove item"
          message={`Remove "${label || '(untitled)'}"? This cannot be undone.`}
          confirmLabel="Remove"
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() => { setConfirmingRemove(false); onRemove(); }}
        />
      )}
    </div>
  );
}

function SectionCard({ section, sectionId, isSelected, onSelectSection, onChange, onRemove, onDuplicate, onPersistBlockRemove, pageOptions, storeId }: {
  section: Section;
  /** Same id shape `AtelierSectionRenderer` computes (`section._id ?? index`,
   *  stringified) — lets a click in the live preview and a card here refer
   *  to "the same section" without either side needing the other's index. */
  sectionId: string;
  isSelected?: boolean;
  onSelectSection?: (sectionId: string) => void;
  onChange: (next: Section) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** Called (with the section's new `blocks` already applied) specifically
   *  when a block inside this section is removed — saved immediately, same
   *  as removing the whole section, unlike an ordinary field edit. */
  onPersistBlockRemove: (next: Section) => void;
  pageOptions: PageOption[];
  storeId: string;

}) {
  const [open, setOpen] = useState(true);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const meta = SECTION_META_BY_TYPE[section.type];
  const cardRef = useRef<HTMLDivElement>(null);
  const hidden = section.enabled === false;

  // Clicking a section in the live preview should surface its card here —
  // auto-expand it and scroll it into view, the same "select it and I'll
  // show you where it lives" behavior the preview side gets from clicking a
  // card's header (below).
  useEffect(() => {
    if (!isSelected) return;
    setOpen(true);
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isSelected]);

  return (
    <div ref={cardRef} className={`border rounded-2xl bg-white overflow-hidden transition-shadow ${isSelected ? 'border-brand-orange ring-2 ring-brand-orange/25' : open ? 'border-bone shadow-[0_1px_8px_rgba(0,0,0,0.04)]' : 'border-bone'}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${meta?.color ?? '#8C8A82'}18` }}>
          {meta ? <meta.Icon size={16} style={{ color: meta.color }} /> : <LayoutTemplate size={16} className="text-slate" />}
        </div>
        <button type="button" onClick={() => { setOpen(o => !o); onSelectSection?.(sectionId); }} className="flex-1 min-w-0 flex flex-col items-start bg-transparent border-none cursor-pointer text-left p-0">
          <span className="text-[13.5px] font-bold text-charcoal truncate">{meta?.label ?? section.type}</span>
          {section.settings.heading && <span className="text-[11.5px] text-slate truncate">{section.settings.heading}</span>}
        </button>
        <button type="button" onClick={() => setOpen(o => !o)} aria-label={open ? 'Collapse' : 'Expand'}
          className="w-7 h-7 flex items-center justify-center text-slate rounded-md hover:bg-cream bg-transparent border-none cursor-pointer shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button type="button" onClick={() => onChange({ ...section, enabled: !hidden ? false : true })} aria-label={hidden ? 'Show section' : 'Hide section'} title={hidden ? 'Show section' : 'Hide section'}
          className="w-7 h-7 flex items-center justify-center text-slate rounded-md hover:bg-cream bg-transparent border-none cursor-pointer shrink-0">
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button type="button" onClick={onDuplicate} aria-label="Duplicate section" title="Duplicate section"
          className="w-7 h-7 flex items-center justify-center text-slate rounded-md hover:bg-cream bg-transparent border-none cursor-pointer shrink-0">
          <Copy size={14} />
        </button>
        <button type="button" onClick={() => setConfirmingRemove(true)} aria-label="Remove section"
          className="w-7 h-7 flex items-center justify-center text-error/70 rounded-md hover:bg-error-bg hover:text-error bg-transparent border-none cursor-pointer shrink-0 transition-colors"><Trash2 size={14} /></button>
      </div>
      {confirmingRemove && (
        <ConfirmDialog
          title="Remove section"
          message={`Remove the "${meta?.label ?? section.type}" section and everything in it? This cannot be undone.`}
          confirmLabel="Remove Section"
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() => { setConfirmingRemove(false); onRemove(); }}
        />
      )}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-bone pt-3.5">
          <SectionFields type={section.type} settings={section.settings} onChange={settings => onChange({ ...section, settings })} storeId={storeId} pageOptions={pageOptions} />

          {meta && meta.allowedBlockTypes.length > 0 && (
            <div className="flex flex-col gap-2 bg-cream/50 rounded-xl p-3 -mx-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate px-1">{meta.blockLabel}s</p>
              <SortableList
                items={section.blocks}
                keyFor={(b, i) => b._id ?? `new-${i}`}
                onReorder={blocks => onChange({ ...section, blocks })}
              >
                {(block, i) => (
                  <BlockRow
                    block={block}
                    sectionType={section.type}
                    onChange={next => onChange({ ...section, blocks: section.blocks.map((b, j) => j === i ? next : b) })}
                    onRemove={() => {
                      const next = { ...section, blocks: section.blocks.filter((_, j) => j !== i) };
                      onChange(next);
                      onPersistBlockRemove(next);
                    }}
                    onDuplicate={() => {
                      const copy = cloneWithoutId(block);
                      const blocks = [...section.blocks];
                      blocks.splice(i + 1, 0, copy);
                      onChange({ ...section, blocks });
                    }}
                    pageOptions={pageOptions}
                    storeId={storeId}
                   
                  />
                )}
              </SortableList>
              {meta.allowedBlockTypes.length === 1 ? (
                <button type="button" onClick={() => onChange({ ...section, blocks: [...section.blocks, { type: meta.allowedBlockTypes[0], settings: { ...meta.defaultBlockSettings } }] })}
                  className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left flex items-center gap-1 px-1 hover:underline">
                  <Plus size={13} /> Add {meta.blockLabel.toLowerCase()}
                </button>
              ) : (
                <ActionMenu
                  align="left"
                  trigger={<span className="text-[12px] font-semibold text-brand-orange cursor-pointer flex items-center gap-1"><Plus size={13} /> Add block</span>}
                  triggerClassName="self-start px-1 py-0.5 bg-transparent border-none cursor-pointer"
                  items={meta.allowedBlockTypes.map(bt => ({
                    label: bt.replace(/_/g, ' '),
                    onClick: () => onChange({ ...section, blocks: [...section.blocks, { type: bt, settings: {} }] }),
                  }))}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PageSectionsEditor({ sections, onChange, onPersist, pageOptions, storeId, selectedSectionId, onSelectSection, supportedSectionTypes }: {
  sections: Section[];
  onChange: (next: Section[]) => void;
  /** Called (with the full next `Section[]`) whenever a section or a block
   *  inside one is removed — saves immediately, so a confirmed removal can
   *  never silently revert if the seller navigates away before clicking
   *  "Save Changes." Ordinary edits (reorder, field changes, add) still go
   *  through `onChange` only, unchanged. */
  onPersist: (next: Section[]) => void;
  pageOptions: PageOption[];
  storeId: string;
  /** Click-to-select sync with the live preview — both optional, so this
   *  component behaves exactly as before wherever a caller doesn't pass
   *  them. */
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  /** The active store's real theme's registered section types (see
   *  `AddSectionModal`'s own doc comment for the bug this closes) — passed
   *  straight through to the "Add a Section" picker. Optional and defaults
   *  to "show everything," same as before this existed, for any caller that
   *  hasn't resolved a theme yet. */
  supportedSectionTypes?: SectionType[];
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 border-2 border-dashed border-bone rounded-2xl bg-white/60 text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-brand-pale-orange flex items-center justify-center">
            <LayoutTemplate size={22} className="text-brand-orange" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-charcoal">This page is empty</p>
            <p className="text-[12.5px] text-slate mt-1 max-w-[320px]">Add your first section — a hero banner, your products, or anything else — to start building this page.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-[9px] mt-1 text-[13px] font-bold rounded-[9px] border-none text-white cursor-pointer transition-colors"
            style={{ background: '#D97757' }}>
            <Plus size={14} /> Add Your First Section
          </button>
        </div>
      )}

      {sections.length > 0 && (
        <>
          <SortableList items={sections} keyFor={(s, i) => s._id ?? `new-${i}`} onReorder={onChange}>
            {(section, i) => {
              // Must match `AtelierSectionRenderer`'s own `String(section._id
              // ?? i)` exactly — same array, same order, same fallback — so a
              // click in the preview and a card here agree on "which section."
              const sectionId = String(section._id ?? i);
              return (
                <SectionCard
                  section={section}
                  sectionId={sectionId}
                  isSelected={selectedSectionId === sectionId}
                  onSelectSection={onSelectSection}
                  onChange={next => onChange(sections.map((s, j) => j === i ? next : s))}
                  onRemove={() => {
                    const next = sections.filter((_, j) => j !== i);
                    onChange(next);
                    onPersist(next);
                  }}
                  onDuplicate={() => {
                    const copy = cloneWithoutId(section);
                    const next = [...sections];
                    next.splice(i + 1, 0, copy);
                    onChange(next);
                  }}
                  onPersistBlockRemove={nextSection => onPersist(sections.map((s, j) => j === i ? nextSection : s))}
                  pageOptions={pageOptions}
                  storeId={storeId}
                />
              );
            }}
          </SortableList>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-[10px] text-[13px] font-semibold rounded-[9px] border-2 border-dashed border-bone bg-transparent text-slate hover:border-brand-orange/40 hover:text-brand-orange cursor-pointer transition-colors"
          >
            <Plus size={14} /> Add Section
          </button>
        </>
      )}

      {showAdd && (
        <AddSectionModal
          onClose={() => setShowAdd(false)}
          supportedTypes={supportedSectionTypes}
          onPick={type => {
            const meta = SECTION_META_BY_TYPE[type];
            onChange([...sections, { type, settings: { ...meta.defaultSettings }, blocks: [] }]);
          }}
        />
      )}
    </div>
  );
}
