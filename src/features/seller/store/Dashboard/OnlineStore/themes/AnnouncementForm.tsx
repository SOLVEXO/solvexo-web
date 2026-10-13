import { Plus, Trash2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import type { StoreAnnouncementBar as StoreAnnouncementBarValue, StoreAnnouncementType } from '@/api/services/store';
import { ANNOUNCEMENT_TYPE_LABEL } from './announcementDefaults';

const MAX_EXTRA_MESSAGES = 4;
const INPUT = 'text-[13px] px-3 py-2 rounded-lg border border-bone bg-white';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-slate';

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

/** The one announcement-bar editor (Header & Footer → Announcement, and Online Store → Announcement Bar).
 *  It edits `Store.announcementBar` directly and has no draft: Save takes effect on the live storefront
 *  straight away, subject to the on/off switch and the schedule. */
export function AnnouncementForm({ value, onChange }: { value: StoreAnnouncementBarValue; onChange: (next: StoreAnnouncementBarValue) => void }) {
  const extras = value.moreMessages ?? [];
  const setExtra = (i: number, patch: Partial<NonNullable<StoreAnnouncementBarValue['moreMessages']>[number]>) =>
    onChange({ ...value, moreMessages: extras.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white border border-bone rounded-lg px-3 py-2.5">
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">Show announcement bar</p>
          <p className="text-[11px] text-slate">When off, nothing shows even if a message is set below.</p>
        </div>
        <Toggle checked={value.isActive} onChange={isActive => onChange({ ...value, isActive })} ariaLabel="Show announcement bar" />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Message</span>
        <textarea
          value={value.message ?? ''}
          onChange={e => onChange({ ...value, message: e.target.value || null })}
          placeholder="Free shipping on orders over $50"
          rows={2}
          maxLength={200}
          className={`${INPUT} resize-none focus:outline-none focus:ring-1`}
          style={{ fontFamily: 'inherit' }}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Button label</span>
          <input value={value.ctaLabel ?? ''} maxLength={40} onChange={e => onChange({ ...value, ctaLabel: e.target.value || null })} placeholder="Shop now" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Button link</span>
          <input value={value.ctaLink ?? ''} onChange={e => onChange({ ...value, ctaLink: e.target.value || null })} placeholder="/collections/sale" className={INPUT} />
        </label>
      </div>
      <p className="text-[11px] text-slate -mt-2">The link must start with https://, http:// or / (a page on your own store).</p>

      <div className="flex flex-col gap-2 border-t border-bone pt-3">
        <span className={LABEL}>More messages (optional)</span>
        <p className="text-[11px] text-slate -mt-1">Add up to {MAX_EXTRA_MESSAGES} more and the bar rotates through all of them.</p>
        {extras.map((m, i) => (
          <div key={i} className="flex flex-col gap-2 border border-bone rounded-lg p-2.5 bg-white">
            <div className="flex items-start gap-2">
              <input value={m.message} maxLength={200} onChange={e => setExtra(i, { message: e.target.value })} placeholder={`Message ${i + 2}`} aria-label={`Message ${i + 2}`} className={`${INPUT} flex-1`} />
              <button type="button" aria-label={`Remove message ${i + 2}`} onClick={() => onChange({ ...value, moreMessages: extras.filter((_, j) => j !== i) })}
                className="p-2 text-error bg-transparent border-0 cursor-pointer"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={m.ctaLabel ?? ''} maxLength={40} onChange={e => setExtra(i, { ctaLabel: e.target.value || null })} placeholder="Button label" aria-label={`Message ${i + 2} button label`} className={INPUT} />
              <input value={m.ctaLink ?? ''} onChange={e => setExtra(i, { ctaLink: e.target.value || null })} placeholder="Button link" aria-label={`Message ${i + 2} button link`} className={INPUT} />
            </div>
          </div>
        ))}
        {extras.length < MAX_EXTRA_MESSAGES && (
          <button type="button" onClick={() => onChange({ ...value, moreMessages: [...extras, { message: '', ctaLabel: null, ctaLink: null }] })}
            className="text-[12px] font-semibold bg-transparent border-0 cursor-pointer text-left flex items-center gap-1" style={{ color: '#D97757' }}>
            <Plus size={13} /> Add a message
          </button>
        )}
        {extras.length > 0 && (
          <label className="flex items-center gap-2 text-[12px] text-charcoal">
            Change message every
            <select value={value.rotateSeconds ?? 5} onChange={e => onChange({ ...value, rotateSeconds: Number(e.target.value) })} className="text-[12.5px] px-2 py-1 rounded-lg border border-bone bg-white">
              {[3, 4, 5, 6, 8, 10, 15].map(n => <option key={n} value={n}>{n} seconds</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-bone pt-3">
        <span className={LABEL}>Look</span>
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
            <span className="text-[10.5px] text-slate">Style (icon)</span>
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

      <div className="flex flex-col gap-1.5">
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
