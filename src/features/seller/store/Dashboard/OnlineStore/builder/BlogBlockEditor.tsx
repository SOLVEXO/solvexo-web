import { useLayoutEffect, useRef } from 'react';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Type, Heading as HeadingIcon, Image as ImageIcon, Quote, List, Minus } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { Field } from '@/components/comman/ui';
import { BlockFields } from './BlockFields';
import { SortableList } from './Sortable';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

const BLOCK_TYPES: { type: string; label: string; icon: typeof Type }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading', label: 'Heading', icon: HeadingIcon },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'list', label: 'List', icon: List },
  { type: 'divider', label: 'Divider', icon: Minus },
];

const PARAGRAPH_MAX = 2000;

/** Textarea that grows with its text, so long paragraphs are fully visible. */
function AutoGrowTextarea({ value, onChange, maxLength, placeholder }: {
  value: string; onChange: (v: string) => void; maxLength: number; placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 180)}px`;
  }, [value]);
  const near = value.length > maxLength * 0.9;
  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`${inp} resize-y min-h-[180px] leading-relaxed text-[14px] overflow-hidden`}
      />
      <p className={`text-[11px] mt-1 text-right ${near ? 'text-error' : 'text-slate'}`}>{value.length} / {maxLength}</p>
    </div>
  );
}

export function BlogBlockEditor({ content, onChange, onRequestRemove, storeId }: {
  content: Block[];
  onChange: (next: Block[]) => void;
  onRequestRemove: (index: number) => void;
  storeId: string;
}) {
  const update = (i: number, patch: Partial<Block>) => onChange(content.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const k = i + dir;
    if (k < 0 || k >= content.length) return;
    const next = [...content];
    [next[i], next[k]] = [next[k], next[i]];
    onChange(next);
  };
  const duplicate = (i: number) => {
    const { _id: _drop, ...rest } = content[i] as Block & { _id?: string };
    onChange([...content.slice(0, i + 1), JSON.parse(JSON.stringify(rest)) as Block, ...content.slice(i + 1)]);
  };
  const add = (type: string) => onChange([...content, { type, settings: type === 'list' ? { items: [], style: 'bullet' } : {} }]);

  const iconBtn = 'p-1.5 rounded-md text-slate hover:bg-bone hover:text-charcoal bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-default';

  return (
    <div className="flex flex-col gap-3">
      {content.length === 0 && (
        <div className="border border-dashed border-bone rounded-xl bg-white py-8 px-4 text-center">
          <p className="text-[13px] font-semibold text-charcoal">Is post mein abhi koi content nahi hai</p>
          <p className="text-[12px] text-slate mt-1">Neeche se pehla block add karein.</p>
        </div>
      )}

      <SortableList items={content} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={onChange}>
        {(block, i) => {
          const meta = BLOCK_TYPES.find(t => t.type === block.type);
          const Icon = meta?.icon ?? Type;
          const s = block.settings as Record<string, any>;
          return (
            <div className="border border-bone rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-slate" />
                  <select
                    aria-label="Block type"
                    className="text-[12px] font-semibold border border-bone rounded-md px-2 py-1 bg-white text-charcoal"
                    value={block.type}
                    onChange={e => update(i, { type: e.target.value, settings: e.target.value === 'list' ? { items: [], style: 'bullet' } : {} })}
                  >
                    {BLOCK_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                  </select>
                  <span className="text-[11px] text-slate">#{i + 1}</span>
                </div>
                <div className="flex items-center">
                  <button type="button" className={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move block up"><ChevronUp size={15} /></button>
                  <button type="button" className={iconBtn} onClick={() => move(i, 1)} disabled={i === content.length - 1} aria-label="Move block down"><ChevronDown size={15} /></button>
                  <button type="button" className={iconBtn} onClick={() => duplicate(i)} aria-label="Duplicate block"><Copy size={14} /></button>
                  <button type="button" className={`${iconBtn} hover:!text-error`} onClick={() => onRequestRemove(i)} aria-label="Remove block"><Trash2 size={14} /></button>
                </div>
              </div>

              {block.type === 'paragraph' ? (
                <Field label="Paragraph text" hint="Formatting: **bold**, *italic*, [link text](https://…)">
                  <AutoGrowTextarea
                    value={s.text ?? ''}
                    maxLength={PARAGRAPH_MAX}
                    placeholder="Yahan apna paragraph likhein…"
                    onChange={text => update(i, { settings: { ...s, text } })}
                  />
                </Field>
              ) : (
                <BlockFields
                  type={block.type}
                  settings={block.settings}
                  onChange={settings => update(i, { settings })}
                  pageOptions={[]}
                  storeId={storeId}
                />
              )}
            </div>
          );
        }}
      </SortableList>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="flex items-center gap-1 text-[12px] font-semibold text-slate mr-1"><Plus size={13} /> Add block</span>
        {BLOCK_TYPES.map(t => (
          <button
            key={t.type}
            type="button"
            onClick={() => add(t.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream hover:border-brand-orange cursor-pointer"
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
