import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Field, ImageUpload, Select } from '@/components/comman/ui';
import { LinkTargetFields, type LinkTarget } from './LinkTargetFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

/** What a menu item can carry beyond its label and link: a badge, show-when rules, and (top level, mega) columns and promo cards. */
export interface MegaPromoValue { imageUrl?: string | null; title?: string | null; text?: string | null; buttonLabel?: string | null; link?: LinkTarget | null }
export interface NavExtrasValue {
  badge?: string | null; badgeColor?: string | null;
  showTo?: string | null; showFrom?: string | null; showUntil?: string | null; showCountries?: string | null; hideCountries?: string | null; showLanguages?: string | null;
  megaColumns?: number | null; megaPromos?: MegaPromoValue[] | null;
}

/** The saved moment (ISO, UTC) on the seller's own clock for a datetime-local input, and back. */
function isoToLocalInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const localToIso = (v: string): string => (v ? new Date(v).toISOString() : '');

/** A small tag next to the label ("New", "Sale") with its own colour. */
export function NavBadgeField({ value, onChange }: {
  value: Pick<NavExtrasValue, 'badge' | 'badgeColor'>;
  onChange: (patch: Pick<NavExtrasValue, 'badge' | 'badgeColor'>) => void;
}) {
  const color = value.badgeColor && /^#[0-9a-fA-F]{6}$/.test(value.badgeColor) ? value.badgeColor : '';
  return (
    <Field label="Badge (optional)">
      <div className="flex items-center gap-2">
        <input className={inp} value={value.badge ?? ''} maxLength={12} placeholder="e.g. New, Sale" aria-label="Badge text"
          onChange={e => onChange({ badge: e.target.value.replace(/[<>]/g, ''), badgeColor: value.badgeColor })} />
        <input type="color" aria-label="Badge colour" value={color || '#111111'} onChange={e => onChange({ badge: value.badge, badgeColor: e.target.value })}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-bone bg-white p-0.5" />
        {color && <button type="button" onClick={() => onChange({ badge: value.badge, badgeColor: '' })} className="text-[11px] text-slate bg-transparent border-none cursor-pointer underline shrink-0">Theme colour</button>}
      </div>
      <p className="text-[11px] text-slate mt-1">A small tag shown next to the name. Empty = none.</p>
    </Field>
  );
}

const hasRules = (v: NavExtrasValue) => !!(v.showFrom || v.showUntil || v.showCountries || v.hideCountries || v.showLanguages || (v.showTo && v.showTo !== 'all'));

/** Show this item only to some visitors, or only for a while. */
export function NavRulesField({ value, onChange }: { value: NavExtrasValue; onChange: (patch: Partial<NavExtrasValue>) => void }) {
  const [open, setOpen] = useState(() => hasRules(value));
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="self-start text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer p-0">
        {open ? 'Hide' : 'Show only to certain visitors or for a limited time'}{!open && hasRules(value) ? ' · in use' : ''}
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-lg border border-bone bg-cream/40 p-3">
          <Field label="Show to">
            <Select value={value.showTo || 'all'} onChange={e => onChange({ showTo: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="guests">Visitors who are not signed in</option>
              <option value="customers">Signed-in customers</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Show from"><input type="datetime-local" className={inp} value={isoToLocalInput(value.showFrom)} onChange={e => onChange({ showFrom: localToIso(e.target.value) })} /></Field>
            <Field label="Hide after"><input type="datetime-local" className={inp} value={isoToLocalInput(value.showUntil)} onChange={e => onChange({ showUntil: localToIso(e.target.value) })} /></Field>
          </div>
          <Field label="Only in these countries">
            <input className={inp} value={value.showCountries ?? ''} maxLength={200} placeholder="PK, AE, GB" onChange={e => onChange({ showCountries: e.target.value })} />
          </Field>
          <Field label="Hide in these countries">
            <input className={inp} value={value.hideCountries ?? ''} maxLength={200} placeholder="US, CA" onChange={e => onChange({ hideCountries: e.target.value })} />
          </Field>
          <Field label="Only in these languages">
            <input className={inp} value={value.showLanguages ?? ''} maxLength={100} placeholder="en, ur" onChange={e => onChange({ showLanguages: e.target.value })} />
          </Field>
          <p className="text-[11px] text-slate">Country codes are two letters, separated by commas. Times use your own time zone. Empty = no restriction.</p>
        </div>
      )}
    </div>
  );
}

/** Top-level mega menu: how many columns, and up to two promo cards beside them. */
export function MegaExtrasField({ value, onChange, storeId, pageOptions }: {
  value: Pick<NavExtrasValue, 'megaColumns' | 'megaPromos'>;
  onChange: (patch: Pick<NavExtrasValue, 'megaColumns' | 'megaPromos'>) => void;
  storeId: string;
  pageOptions: { slug: string; title: string }[];
}) {
  const promos = value.megaPromos ?? [];
  const setPromo = (i: number, patch: Partial<MegaPromoValue>) =>
    onChange({ megaColumns: value.megaColumns, megaPromos: promos.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bone bg-cream/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Mega menu layout</p>
      <Field label="Columns">
        <Select value={String(value.megaColumns || 0)} onChange={e => onChange({ megaColumns: Number(e.target.value), megaPromos: value.megaPromos })}>
          <option value="0">Automatic (your theme setting)</option>
          {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} columns</option>)}
        </Select>
      </Field>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Promo cards <span className="font-normal normal-case">(up to 2, shown beside the columns on large screens)</span></p>
      {promos.map((p, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-bone bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-charcoal">Card {i + 1}</span>
            <button type="button" aria-label={`Remove card ${i + 1}`} onClick={() => onChange({ megaColumns: value.megaColumns, megaPromos: promos.filter((_, j) => j !== i) })}
              className="text-error/80 bg-transparent border-none cursor-pointer p-1"><Trash2 size={13} /></button>
          </div>
          <Field label="Picture">
            <ImageUpload value={p.imageUrl ? [p.imageUrl] : []} onChange={urls => setPromo(i, { imageUrl: urls[0] ?? '' })} maxFiles={1} storeId={storeId} />
          </Field>
          <Field label="Title"><input className={inp} value={p.title ?? ''} maxLength={60} onChange={e => setPromo(i, { title: e.target.value.replace(/[<>]/g, '') })} /></Field>
          <Field label="Short text"><input className={inp} value={p.text ?? ''} maxLength={140} onChange={e => setPromo(i, { text: e.target.value.replace(/[<>]/g, '') })} /></Field>
          <Field label="Button text (optional)"><input className={inp} value={p.buttonLabel ?? ''} maxLength={30} placeholder="Shop now" onChange={e => setPromo(i, { buttonLabel: e.target.value.replace(/[<>]/g, '') })} /></Field>
          <label className="flex items-center gap-2 text-[12.5px] text-charcoal">
            <input type="checkbox" checked={!!p.link} onChange={e => setPromo(i, { link: e.target.checked ? { linkType: 'home' } : null })} /> The card is a link
          </label>
          {p.link && <LinkTargetFields value={p.link} onChange={next => setPromo(i, { link: next })} pageOptions={pageOptions} storeId={storeId} />}
          {!p.imageUrl && !(p.title ?? '').trim() && <p role="alert" className="text-[11.5px] text-error">A card needs a picture or a title.</p>}
        </div>
      ))}
      {promos.length < 2 && (
        <button type="button" onClick={() => onChange({ megaColumns: value.megaColumns, megaPromos: [...promos, { imageUrl: '', title: '', text: '', buttonLabel: '', link: null }] })}
          className="self-start flex items-center gap-1 text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer"><Plus size={13} /> Add a promo card</button>
      )}
    </div>
  );
}
