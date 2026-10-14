import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, GripVertical, Megaphone, Plus, Trash2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import type { StoreAnnouncementBar as StoreAnnouncementBarValue, StoreAnnouncementType } from '@/api/services/store';
import { ANNOUNCEMENT_TYPE_LABEL } from './announcementDefaults';

const MAX_BLOCKS = 10;
const INPUT = 'text-[13px] px-3 py-2 rounded-lg border border-bone bg-white';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-slate';
const ACCENT = '#D97757';

type Block = { message: string; ctaLabel: string | null; ctaLink: string | null; hidden: boolean };

// `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in the browser's own local time, with no trailing `Z`/offset.
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toBlocks(v: StoreAnnouncementBarValue): Block[] {
  const first: Block[] = v.message !== null || v.ctaLabel || v.ctaLink
    ? [{ message: v.message ?? '', ctaLabel: v.ctaLabel, ctaLink: v.ctaLink, hidden: !!v.messageHidden }]
    : [];
  return [...first, ...(v.moreMessages ?? []).map(m => ({ message: m.message, ctaLabel: m.ctaLabel ?? null, ctaLink: m.ctaLink ?? null, hidden: !!m.hidden }))];
}
function fromBlocks(v: StoreAnnouncementBarValue, blocks: Block[]): StoreAnnouncementBarValue {
  const [first, ...rest] = blocks;
  return {
    ...v,
    message: first ? first.message : null,
    ctaLabel: first?.ctaLabel || null,
    ctaLink: first?.ctaLink || null,
    messageHidden: !!first?.hidden,
    moreMessages: rest,
  };
}

/** Shopify-style announcement bar section: a list of announcement blocks (drag to reorder, eye to hide,
 *  click to edit) plus the section's own settings. Edits `Store.announcementBar`; Save goes live. */
export function AnnouncementForm({ value, onChange }: { value: StoreAnnouncementBarValue; onChange: (next: StoreAnnouncementBarValue) => void }) {
  const blocks = toBlocks(value);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const setBlocks = (next: Block[]) => onChange(fromBlocks(value, next));
  const patchBlock = (i: number, patch: Partial<Block>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    setBlocks(next);
  };
  const addBlock = () => {
    setBlocks([...blocks, { message: '', ctaLabel: null, ctaLink: null, hidden: false }]);
    setSelected(blocks.length);
  };

  if (selected !== null && blocks[selected]) {
    const b = blocks[selected];
    const n = selected + 1;
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1 text-[12.5px] font-semibold text-charcoal bg-transparent border-0 cursor-pointer p-0 self-start">
          <ChevronLeft size={15} /> Announcement {n}
        </button>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Text</span>
          <textarea value={b.message} maxLength={200} rows={2} autoFocus placeholder="Free shipping on orders over $50"
            onChange={e => patchBlock(selected, { message: e.target.value })}
            className={`${INPUT} resize-none focus:outline-none focus:ring-1`} style={{ fontFamily: 'inherit' }} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Link label</span>
          <input value={b.ctaLabel ?? ''} maxLength={40} placeholder="Shop now" onChange={e => patchBlock(selected, { ctaLabel: e.target.value || null })} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Link</span>
          <input value={b.ctaLink ?? ''} placeholder="/collections/sale" onChange={e => patchBlock(selected, { ctaLink: e.target.value || null })} className={INPUT} />
          <span className="text-[11px] text-slate">Starts with https://, http:// or / (a page on your own store).</span>
        </label>
        <button type="button" onClick={() => { setBlocks(blocks.filter((_, j) => j !== selected)); setSelected(null); }}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-error bg-transparent border-0 cursor-pointer p-0 self-start">
          <Trash2 size={14} /> Remove block
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white border border-bone rounded-lg px-3 py-2.5">
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">Show announcement bar</p>
          <p className="text-[11px] text-slate">Shown at the top of every page of your store.</p>
        </div>
        <Toggle checked={value.isActive} onChange={isActive => onChange({ ...value, isActive })} ariaLabel="Show announcement bar" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Announcements</span>
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {blocks.map((b, i) => (
            <li key={i} draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
              onDragEnd={() => setDragFrom(null)}
              className={`group flex items-center gap-1.5 bg-white border rounded-lg pl-1.5 pr-1 py-1.5 ${dragFrom === i ? 'opacity-50' : ''} border-bone`}>
              <span className="cursor-grab text-slate p-1" aria-hidden><GripVertical size={14} /></span>
              <Megaphone size={14} className={b.hidden ? 'text-slate/50' : 'text-slate'} />
              <button type="button" onClick={() => setSelected(i)}
                className={`flex-1 min-w-0 text-left text-[12.5px] truncate bg-transparent border-0 cursor-pointer p-0 ${b.hidden ? 'text-slate/60 line-through' : 'text-charcoal'}`}>
                {b.message || <span className="italic text-slate">Empty announcement</span>}
              </button>
              <button type="button" aria-label={`Move announcement ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer disabled:opacity-30 sm:hidden">↑</button>
              <button type="button" aria-label={b.hidden ? `Show announcement ${i + 1}` : `Hide announcement ${i + 1}`} onClick={() => patchBlock(i, { hidden: !b.hidden })}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer">{b.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button type="button" aria-label={`Edit announcement ${i + 1}`} onClick={() => setSelected(i)}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer"><ChevronRight size={14} /></button>
            </li>
          ))}
        </ul>
        {blocks.length < MAX_BLOCKS ? (
          <button type="button" onClick={addBlock}
            className="text-[12.5px] font-semibold bg-transparent border-0 cursor-pointer text-left flex items-center gap-1 mt-1" style={{ color: ACCENT }}>
            <Plus size={14} /> Add announcement
          </button>
        ) : <p className="text-[11px] text-slate">You can have up to {MAX_BLOCKS} announcements.</p>}
        <p className="text-[11px] text-slate">Drag to reorder. With more than one, the bar rotates through them.</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-bone pt-3">
        <span className={LABEL}>Section settings</span>
        <label className="flex items-center justify-between gap-2 text-[12.5px] text-charcoal">
          Auto-rotate every
          <select value={value.rotateSeconds ?? 5} onChange={e => onChange({ ...value, rotateSeconds: Number(e.target.value) })} className="text-[12.5px] px-2 py-1 rounded-lg border border-bone bg-white">
            {[3, 4, 5, 6, 8, 10, 15].map(n => <option key={n} value={n}>{n} seconds</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-slate">Position</span>
            <select value={value.placement ?? 'below'} onChange={e => onChange({ ...value, placement: e.target.value as 'above' | 'below' })} className={INPUT}>
              <option value="below">Below the header</option>
              <option value="above">Above the header</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-slate">Text alignment</span>
            <select value={value.align ?? 'left'} onChange={e => onChange({ ...value, align: e.target.value as 'left' | 'center' })} className={INPUT}>
              <option value="left">Left</option>
              <option value="center">Centered</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-slate">Icon</span>
            <select value={value.type} onChange={e => onChange({ ...value, type: e.target.value as StoreAnnouncementType })} className={INPUT}>
              {(Object.keys(ANNOUNCEMENT_TYPE_LABEL) as StoreAnnouncementType[]).map(k => <option key={k} value={k}>{ANNOUNCEMENT_TYPE_LABEL[k]}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([['bgColor', 'Background'], ['textColor', 'Text']] as const).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <span className="text-[10.5px] text-slate">{label} colour</span>
              <div className="flex items-center gap-2">
                <input type="color" aria-label={`${label} colour`} value={value[key] ?? (key === 'bgColor' ? '#f1ede5' : '#161412')}
                  onChange={e => onChange({ ...value, [key]: e.target.value })} className="h-8 w-10 p-0 border border-bone rounded cursor-pointer bg-white" />
                <button type="button" disabled={!value[key]} onClick={() => onChange({ ...value, [key]: null })}
                  className="text-[11px] text-slate bg-transparent border-0 cursor-pointer disabled:opacity-40 underline">Use theme colour</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-white border border-bone rounded-lg px-3 py-2">
          <p className="text-[12.5px] font-semibold text-charcoal">Let visitors close the bar</p>
          <Toggle checked={value.closable !== false} onChange={closable => onChange({ ...value, closable })} ariaLabel="Let visitors close the bar" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-bone pt-3">
        <span className={LABEL}>Schedule (optional)</span>
        <p className="text-[11px] text-slate -mt-1">Leave blank to show as soon as it's on, with no end date.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Starts</span>
            <input type="datetime-local" value={toDatetimeLocal(value.startAt)} onChange={e => onChange({ ...value, startAt: fromDatetimeLocal(e.target.value) })} className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Ends</span>
            <input type="datetime-local" value={toDatetimeLocal(value.endAt)} onChange={e => onChange({ ...value, endAt: fromDatetimeLocal(e.target.value) })} className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white" />
          </label>
        </div>
      </div>
    </div>
  );
}
