import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { LinkTargetFields } from './LinkTargetFields';
import {
  CONTENT_ITEM_ALIGNS, CONTENT_ITEM_ANCHORS, CONTENT_ITEM_KINDS, CONTENT_ITEM_SIZES,
  CONTENT_ITEM_WIDTHS, CONTENT_MAX_OFFSET, CONTENT_TEXT_LIMIT, MAX_CONTENT_ITEMS,
  type ContentItem, type ContentItemKind,
} from '@/features/storefront-themes/shared/contentItems';

const KIND_LABEL: Record<ContentItemKind, string> = {
  heading: 'Heading',
  subheading: 'Subheading',
  text: 'Paragraph',
  button: 'Button',
  image: 'Image',
};

const ANCHOR_LABEL: Record<string, string> = {
  'top-left': 'Top left', 'top-center': 'Top centre', 'top-right': 'Top right',
  'middle-left': 'Middle left', 'middle-center': 'Middle centre', 'middle-right': 'Middle right',
  'bottom-left': 'Bottom left', 'bottom-center': 'Bottom centre', 'bottom-right': 'Bottom right',
};

const WIDTH_LABEL: Record<string, string> = { narrow: 'Narrow', normal: 'Normal', wide: 'Wide', full: 'Full width' };
const SIZE_LABEL: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' };

const inputCls = 'w-full rounded-lg border border-bone bg-white px-2.5 py-1.5 text-[13px] text-charcoal outline-none focus:border-brand-orange';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate';

/** Empty input = "no nudge"; anything else is clamped to what the backend accepts. */
const offsetValue = (raw: string): number | undefined => {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(-CONTENT_MAX_OFFSET, Math.min(CONTENT_MAX_OFFSET, Math.round(n)));
};

let seq = 0;
const newItem = (kind: ContentItemKind): ContentItem => ({
  id: `ci${Date.now().toString(36)}${seq++}`,
  kind,
  anchor: 'middle-center',
  width: 'normal',
  align: 'left',
  size: 'md',
});

/**
 * The free content layer of a section: any number of headings / paragraphs /
 * buttons / images, each with its own position (one of nine anchors), width,
 * alignment, colour and size. Rendered by `SectionContentLayer` on the
 * storefront, for every section type and every theme.
 */
export function ContentItemsEditor({ value, onChange, storeId, pageOptions }: {
  value?: ContentItem[] | null;
  onChange: (next: ContentItem[]) => void;
  storeId: string;
  pageOptions?: { slug: string; title: string }[];
}) {
  const items = value ?? [];
  const [open, setOpen] = useState(items.length > 0);
  const dragFrom = useRef<number | null>(null);

  const patch = (index: number, changes: Partial<ContentItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="border-t border-bone/70 pt-2">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 py-1 text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate">
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Content items (free placement)
        {items.length > 0 && <span className="ml-auto rounded-full bg-bone px-1.5 text-[10px] text-charcoal">{items.length}</span>}
      </button>
      {open && (
        <div className="pt-1 flex flex-col gap-2">
          <p className="m-0 text-[11.5px] leading-snug text-slate">
            Add as many headings, paragraphs, buttons or images as you like — on <b>any</b> section. Each one has its own
            position, width, colour and size. On a phone they stack in one column.
          </p>
          {items.map((item, index) => (
            <div
              key={item.id ?? index}
              draggable
              onDragStart={() => { dragFrom.current = index; }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragFrom.current !== null) move(dragFrom.current, index); dragFrom.current = null; }}
              className="rounded-xl border border-bone bg-[#FCFAF7] p-2.5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5">
                <GripVertical size={13} className="text-slate cursor-grab" aria-hidden />
                <span className="text-[11px] font-semibold text-slate">Item {index + 1}</span>
                <select className={`${inputCls} ml-auto w-auto`} value={item.kind}
                  onChange={e => patch(index, { kind: e.target.value as ContentItemKind })}>
                  {CONTENT_ITEM_KINDS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                </select>
                <button type="button" onClick={() => move(index, index - 1)} className="rounded-md border border-bone bg-white px-1.5 py-0.5 text-[11px] text-charcoal" aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(index, index + 1)} className="rounded-md border border-bone bg-white px-1.5 py-0.5 text-[11px] text-charcoal" aria-label="Move down">↓</button>
                <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))}
                  className="rounded-md border border-bone bg-white p-1 text-charcoal hover:text-red-600" aria-label="Remove item">
                  <Trash2 size={12} />
                </button>
              </div>

              {item.kind === 'image' ? (
                <input className={inputCls} value={item.imageUrl ?? ''} placeholder="https://… .jpg / .png / .webp"
                  onChange={e => patch(index, { imageUrl: e.target.value })} />
              ) : (
                <textarea className={inputCls} rows={item.kind === 'text' ? 3 : 1}
                  maxLength={CONTENT_TEXT_LIMIT[item.kind]}
                  value={item.text ?? ''}
                  placeholder={item.kind === 'button' ? 'Button label' : KIND_LABEL[item.kind]}
                  onChange={e => patch(index, { text: e.target.value })} />
              )}

              {(item.kind === 'button' || item.kind === 'image') && (
                <LinkTargetFields value={item.link as never} onChange={link => patch(index, { link })} pageOptions={pageOptions ?? []} storeId={storeId} />
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={labelCls}>Position</span>
                  <select className={inputCls} value={item.anchor ?? 'middle-center'}
                    onChange={e => patch(index, { anchor: e.target.value as ContentItem['anchor'] })}>
                    {CONTENT_ITEM_ANCHORS.map(a => <option key={a} value={a}>{ANCHOR_LABEL[a]}</option>)}
                  </select>
                </div>
                <div>
                  <span className={labelCls}>Width</span>
                  <select className={inputCls} value={item.width ?? 'normal'}
                    onChange={e => patch(index, { width: e.target.value as ContentItem['width'] })}>
                    {CONTENT_ITEM_WIDTHS.map(w => <option key={w} value={w}>{WIDTH_LABEL[w]}</option>)}
                  </select>
                </div>
                <div>
                  <span className={labelCls}>Alignment</span>
                  <select className={inputCls} value={item.align ?? 'left'}
                    onChange={e => patch(index, { align: e.target.value as ContentItem['align'] })}>
                    {CONTENT_ITEM_ALIGNS.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <span className={labelCls}>Size</span>
                  <select className={inputCls} value={item.size ?? 'md'}
                    onChange={e => patch(index, { size: e.target.value as ContentItem['size'] })}>
                    {CONTENT_ITEM_SIZES.map(s => <option key={s} value={s}>{SIZE_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className={labelCls}>Nudge (desktop only)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min={-CONTENT_MAX_OFFSET} max={CONTENT_MAX_OFFSET} step={10}
                    className={inputCls} value={item.offsetX ?? ''} placeholder="← → px"
                    aria-label="Horizontal nudge in pixels"
                    onChange={e => patch(index, { offsetX: offsetValue(e.target.value) })} />
                  <input type="number" min={-CONTENT_MAX_OFFSET} max={CONTENT_MAX_OFFSET} step={10}
                    className={inputCls} value={item.offsetY ?? ''} placeholder="↑ ↓ px"
                    aria-label="Vertical nudge in pixels"
                    onChange={e => patch(index, { offsetY: offsetValue(e.target.value) })} />
                </div>
                {(item.offsetX !== undefined || item.offsetY !== undefined) && (
                  <button type="button" onClick={() => patch(index, { offsetX: undefined, offsetY: undefined })}
                    className="mt-1 text-[11px] text-brand-orange underline">Reset position</button>
                )}
              </div>
              <div>
                <span className={labelCls}>Colour (empty = theme text colour)</span>
                <input type="color" className="h-8 w-full cursor-pointer rounded-md border border-bone bg-white"
                  value={item.color ?? '#111111'} onChange={e => patch(index, { color: e.target.value })} />
                {item.color && (
                  <button type="button" onClick={() => patch(index, { color: undefined })}
                    className="mt-1 text-[11px] text-brand-orange underline">Use theme colour</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" disabled={items.length >= MAX_CONTENT_ITEMS}
            onClick={() => onChange([...items, newItem('heading')])}
            className="inline-flex items-center gap-1 self-start rounded-lg border border-bone bg-white px-2.5 py-1.5 text-[12px] font-medium text-charcoal disabled:opacity-50">
            <Plus size={13} /> Add content item
          </button>
        </div>
      )}
    </div>
  );
}