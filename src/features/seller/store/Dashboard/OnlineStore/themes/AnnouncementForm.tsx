import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, GripVertical, Megaphone, Plus, Trash2, Copy } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import type { StoreAnnouncementBar as StoreAnnouncementBarValue, StoreAnnouncementType } from '@/api/services/store';
import { ANNOUNCEMENT_TYPE_LABEL } from './announcementDefaults';
import { Group, ColorField } from './HeaderFooterSettingsPanels';

const MAX_BLOCKS = 10;
const INPUT = 'w-full text-[13px] px-3 py-2 rounded-lg border border-bone bg-white';
const LABEL = 'text-[11.5px] text-charcoal';
const ACCENT = '#D97757';

type Value = StoreAnnouncementBarValue;
type Block = { message: string; ctaLabel: string | null; ctaLink: string | null; couponCode: string | null; hidden: boolean };

// `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in the browser's own local time, with no trailing `Z`/offset.
function toDatetimeLocal(iso: string | null | undefined): string {
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

function toBlocks(v: Value): Block[] {
  const first: Block[] = v.message !== null || v.ctaLabel || v.ctaLink
    ? [{ message: v.message ?? '', ctaLabel: v.ctaLabel, ctaLink: v.ctaLink, couponCode: v.couponCode ?? null, hidden: !!v.messageHidden }]
    : [];
  return [...first, ...(v.moreMessages ?? []).map(m => ({ message: m.message, ctaLabel: m.ctaLabel ?? null, ctaLink: m.ctaLink ?? null, couponCode: m.couponCode ?? null, hidden: !!m.hidden }))];
}
function fromBlocks(v: Value, blocks: Block[]): Value {
  const [first, ...rest] = blocks;
  return {
    ...v,
    message: first ? first.message : null,
    ctaLabel: first?.ctaLabel || null,
    ctaLink: first?.ctaLink || null,
    couponCode: first?.couponCode || null,
    messageHidden: !!first?.hidden,
    moreMessages: rest,
  };
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value as T)} className={INPUT}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function SwitchRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12.5px] text-charcoal">{label}</p>
        {hint && <p className="text-[10.5px] text-slate">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

/** Shopify-style announcement bar section: a list of announcement blocks (drag, hide, duplicate, click to
 *  edit — each with its own text/link/code/colours) and grouped section settings. Edits `Store.announcementBar`. */
export function AnnouncementForm({ value, onChange }: { value: Value; onChange: (next: Value) => void }) {
  const blocks = toBlocks(value);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const set = (patch: Partial<Value>) => onChange({ ...value, ...patch });
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
    setBlocks([...blocks, { message: '', ctaLabel: null, ctaLink: null, couponCode: null, hidden: false }]);
    setSelected(blocks.length);
  };

  if (selected !== null && blocks[selected]) {
    const b = blocks[selected];
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1 text-[12.5px] font-semibold text-charcoal bg-transparent border-0 cursor-pointer p-0 self-start">
          <ChevronLeft size={15} /> Announcement {selected + 1}
        </button>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Text</span>
          <textarea value={b.message} maxLength={200} rows={2} placeholder="Free shipping on orders over Rs. 3,000"
            onChange={e => patchBlock(selected, { message: e.target.value })}
            className={`${INPUT} resize-none focus:outline-none focus:ring-1`} style={{ fontFamily: 'inherit' }} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Link label</span>
            <input value={b.ctaLabel ?? ''} maxLength={40} placeholder="Shop now" onChange={e => patchBlock(selected, { ctaLabel: e.target.value || null })} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Link</span>
            <input value={b.ctaLink ?? ''} placeholder="/collections/sale" onChange={e => patchBlock(selected, { ctaLink: e.target.value || null })} className={INPUT} />
          </label>
        </div>
        <p className="text-[10.5px] text-slate -mt-2">Links start with https://, http:// or / (a page on your store).</p>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Discount code (optional)</span>
          <input value={b.couponCode ?? ''} maxLength={40} placeholder="WELCOME10" onChange={e => patchBlock(selected, { couponCode: e.target.value.toUpperCase().replace(/\s/g, '') || null })} className={INPUT} />
          <span className="text-[10.5px] text-slate">Shoppers see the code with a Copy button. Create the code itself under Marketing → Discounts.</span>
        </label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => { const next = [...blocks]; next.splice(selected + 1, 0, { ...b }); setBlocks(next); setSelected(selected + 1); }}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate bg-transparent border-0 cursor-pointer p-0">
            <Copy size={13} /> Duplicate
          </button>
          <button type="button" onClick={() => { setBlocks(blocks.filter((_, j) => j !== selected)); setSelected(null); }}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-error bg-transparent border-0 cursor-pointer p-0">
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </div>
    );
  }

  const marquee = value.animation === 'marquee';
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between bg-white border border-bone rounded-lg px-3 py-2.5 mb-2">
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">Show announcement bar</p>
          <p className="text-[11px] text-slate">Shown at the top of every page of your store.</p>
        </div>
        <Toggle checked={value.isActive} onChange={isActive => set({ isActive })} ariaLabel="Show announcement bar" />
      </div>

      <Group title={`Announcements (${blocks.length})`} defaultOpen>
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {blocks.map((b, i) => (
            <li key={i} draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
              onDragEnd={() => setDragFrom(null)}
              className={`flex items-center gap-1.5 bg-white border border-bone rounded-lg pl-1.5 pr-1 py-1.5 ${dragFrom === i ? 'opacity-50' : ''}`}>
              <span className="cursor-grab text-slate p-1" aria-hidden><GripVertical size={14} /></span>
              <Megaphone size={14} className={b.hidden ? 'text-slate/50' : 'text-slate'} />
              <button type="button" onClick={() => setSelected(i)}
                className={`flex-1 min-w-0 text-left text-[12.5px] truncate bg-transparent border-0 cursor-pointer p-0 ${b.hidden ? 'text-slate/60 line-through' : 'text-charcoal'}`}>
                {b.message || <span className="italic text-slate">Empty announcement</span>}
              </button>
              <button type="button" aria-label={`Move announcement ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer disabled:opacity-30 lg:hidden">↑</button>
              <button type="button" aria-label={b.hidden ? `Show announcement ${i + 1}` : `Hide announcement ${i + 1}`} onClick={() => patchBlock(i, { hidden: !b.hidden })}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer">{b.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button type="button" aria-label={`Edit announcement ${i + 1}`} onClick={() => setSelected(i)}
                className="p-1 text-slate bg-transparent border-0 cursor-pointer"><ChevronRight size={14} /></button>
            </li>
          ))}
        </ul>
        {blocks.length < MAX_BLOCKS ? (
          <button type="button" onClick={addBlock}
            className="text-[12.5px] font-semibold bg-transparent border-0 cursor-pointer text-left flex items-center gap-1" style={{ color: ACCENT }}>
            <Plus size={14} /> Add announcement
          </button>
        ) : <p className="text-[11px] text-slate">You can have up to {MAX_BLOCKS} announcements.</p>}
        <p className="text-[10.5px] text-slate">Drag to reorder. Each one can have its own link and discount code.</p>
      </Group>

      <Group title="Motion">
        <Select label="How messages change" value={value.animation ?? 'slide'} onChange={animation => set({ animation })}
          options={[['slide', 'Slide in, one at a time'], ['fade', 'Fade, one at a time'], ['marquee', 'Scrolling strip (all at once)']]} />
        {marquee
          ? <Select label="Scroll speed" value={value.marqueeSpeed ?? 'normal'} onChange={marqueeSpeed => set({ marqueeSpeed })}
              options={[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']]} />
          : <Select label="Change every" value={String(value.rotateSeconds ?? 5)} onChange={v => set({ rotateSeconds: Number(v) })}
              options={['3', '4', '5', '6', '8', '10', '15'].map(n => [n, `${n} seconds`] as [string, string])} />}
      </Group>

      <Group title="Text">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Text size" value={value.fontSize ?? 'sm'} onChange={fontSize => set({ fontSize })} options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} />
          <Select label="Bar height" value={value.barHeight ?? 'md'} onChange={barHeight => set({ barHeight })} options={[['sm', 'Slim'], ['md', 'Normal'], ['lg', 'Tall']]} />
        </div>
        <Select label="Alignment" value={value.align ?? 'left'} onChange={align => set({ align })} options={[['left', 'Left'], ['center', 'Centered']]} />
        <SwitchRow label="Bold" checked={!!value.bold} onChange={bold => set({ bold })} />
        <SwitchRow label="Capital letters" checked={!!value.uppercase} onChange={uppercase => set({ uppercase })} />
        <SwitchRow label="Show icon" checked={value.showIcon !== false} onChange={showIcon => set({ showIcon })} />
        {value.showIcon !== false && (
          <Select label="Icon" value={value.type} onChange={type => set({ type: type as StoreAnnouncementType })}
            options={(Object.keys(ANNOUNCEMENT_TYPE_LABEL) as StoreAnnouncementType[]).map(k => [k, ANNOUNCEMENT_TYPE_LABEL[k]] as [StoreAnnouncementType, string])} />
        )}
        <Select label="Link style" value={value.linkStyle ?? 'underline'} onChange={linkStyle => set({ linkStyle })}
          options={[['underline', 'Underlined text'], ['button', 'Small outlined button']]} />
      </Group>

      <Group title="Colours">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={value.bgColor} fallback="#f1ede5" onChange={bgColor => set({ bgColor })} />
          <ColorField label="Text" value={value.textColor} fallback="#161412" onChange={textColor => set({ textColor })} />
        </div>
        <SwitchRow label="Gradient background" hint="Blends the background into a second colour." checked={!!value.bgColor2}
          onChange={on => set({ bgColor2: on ? '#db2777' : null })} />
        {value.bgColor2 && <ColorField label="Gradient end colour" value={value.bgColor2} fallback="#db2777" onChange={bgColor2 => set({ bgColor2 })} />}
      </Group>

      <Group title="Countdown timer">
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Count down to</span>
          <input type="datetime-local" value={toDatetimeLocal(value.countdownEndAt)} onChange={e => set({ countdownEndAt: fromDatetimeLocal(e.target.value) })} className={INPUT} />
          <span className="text-[10.5px] text-slate">Shows a live “2d 04:12:09” timer next to your messages. It disappears when the time is up.</span>
        </label>
        {value.countdownEndAt && (
          <button type="button" onClick={() => set({ countdownEndAt: null })} className="text-[11.5px] text-slate underline bg-transparent border-0 cursor-pointer p-0 self-start">Remove timer</button>
        )}
      </Group>

      <Group title="Where and when">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Position" value={value.placement ?? 'below'} onChange={placement => set({ placement })} options={[['below', 'Below the header'], ['above', 'Above the header']]} />
          <Select label="Show on" value={value.device ?? 'all'} onChange={device => set({ device })} options={[['all', 'All devices'], ['mobile', 'Mobile only'], ['desktop', 'Desktop only']]} />
        </div>
        <SwitchRow label="Let visitors close the bar" checked={value.closable !== false} onChange={closable => set({ closable })} />
        {value.closable !== false && (
          <Select label="After closing, show it again" value={value.dismissFor ?? 'forever'} onChange={dismissFor => set({ dismissFor })}
            options={[['session', 'On their next visit'], ['day', 'After 24 hours'], ['forever', 'Only when the message changes']]} />
        )}
        <p className={`${LABEL} mt-1`}>Schedule (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Starts</span>
            <input type="datetime-local" value={toDatetimeLocal(value.startAt)} onChange={e => set({ startAt: fromDatetimeLocal(e.target.value) })} className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Ends</span>
            <input type="datetime-local" value={toDatetimeLocal(value.endAt)} onChange={e => set({ endAt: fromDatetimeLocal(e.target.value) })} className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white" />
          </label>
        </div>
        <p className="text-[10.5px] text-slate">Leave blank to show as soon as it's on, with no end date.</p>
      </Group>
    </div>
  );
}
