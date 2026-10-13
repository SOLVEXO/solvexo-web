import { useState } from 'react';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';

const SELECT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const HEADING = 'text-[11px] font-semibold uppercase tracking-wide text-slate';
const BLOCK = 'flex flex-col gap-2 pb-3 mb-1 border-b border-bone';

/** A number box that commits on blur, clamped to [min, max]; empty means "use the theme default" (null). */
function SizeField(props: {
  label: string; value: number | null | undefined; min: number; max: number; onChange: (v: number | null) => void; hint?: string;
}) {
  // Re-mounted whenever the saved value changes (undo, reset, clamp), so the box never shows stale text.
  return <SizeFieldInner key={String(props.value ?? 'none')} {...props} />;
}

function SizeFieldInner({ label, value, min, max, onChange, hint }: {
  label: string; value: number | null | undefined; min: number; max: number; onChange: (v: number | null) => void; hint?: string;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const commit = () => {
    if (text.trim() === '') { onChange(null); return; }
    const n = Number(text);
    if (!Number.isFinite(n)) { setText(value == null ? '' : String(value)); return; }
    onChange(Math.min(max, Math.max(min, Math.round(n))));
  };
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] text-charcoal">{label}</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={text} placeholder="Theme default"
        onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }} className={INPUT} />
      {hint && <span className="text-[10.5px] text-slate">{hint}</span>}
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

function TextField({ label, value, onChange, placeholder, maxLength, disabled }: {
  label: string; value: string | null | undefined; onChange: (v: string | null) => void; placeholder?: string; maxLength: number; disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] text-charcoal">{label}</span>
      <input value={value ?? ''} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange(e.target.value || null)} className={`${INPUT} disabled:opacity-50`} />
    </label>
  );
}

/** Header tab: logo size, layout, behaviour and the built-in links — every control is optional and falls back to the theme's own look. */
export function HeaderSettingsPanel({ header, onChange }: { header: StorefrontHeader; onChange: (next: StorefrontHeader) => void }) {
  const set = (patch: Partial<StorefrontHeader>) => onChange({ ...header, ...patch });
  const centered = header.headerStyle === 'centered';
  return (
    <>
      <div className={BLOCK}>
        <p className={HEADING}>Logo size</p>
        <div className="grid grid-cols-2 gap-3">
          <SizeField label="Desktop width (px)" value={header.logoWidth} min={40} max={400} onChange={v => set({ logoWidth: v })} hint="40–400" />
          <SizeField label="Mobile width (px)" value={header.mobileLogoWidth} min={24} max={240} onChange={v => set({ mobileLogoWidth: v })} hint="24–240" />
        </div>
        <p className="text-[10.5px] text-slate">Leave empty to keep the theme's own logo size. The height follows the logo's proportions.</p>
      </div>

      <div className={BLOCK}>
        <p className={HEADING}>Header layout</p>
        <select className={SELECT} value={header.headerStyle ?? 'standard'} aria-label="Header layout"
          onChange={e => set({ headerStyle: e.target.value as StorefrontHeader['headerStyle'] })}>
          <option value="standard">Theme layout (default)</option>
          <option value="centered">Centered logo, links in a row below</option>
        </select>
        <select className={SELECT} value={header.navAlignment ?? 'left'} disabled={!centered} aria-label="Links alignment"
          onChange={e => set({ navAlignment: e.target.value as StorefrontHeader['navAlignment'] })}>
          <option value="left">Links aligned left</option>
          <option value="center">Links centered</option>
          <option value="right">Links aligned right</option>
        </select>
        <p className="text-[10.5px] text-slate">Link alignment applies to the centered layout.</p>
        <SwitchRow label="Keep the header visible while scrolling" checked={header.sticky === true} onChange={v => set({ sticky: v })} />
      </div>

      <div className={BLOCK}>
        <p className={HEADING}>Header icons</p>
        <SwitchRow label="Search" checked={header.showSearch !== false} onChange={v => set({ showSearch: v })} />
        <SwitchRow label="Account" checked={header.showAccount !== false} onChange={v => set({ showAccount: v })} />
        <SwitchRow label="Wishlist (signed-in shoppers)" checked={header.showWishlist !== false} onChange={v => set({ showWishlist: v })} />
        <p className="text-[10.5px] text-slate">The cart icon always stays.</p>
      </div>

      <div className={BLOCK}>
        <p className={HEADING}>Built-in links</p>
        <SwitchRow label="“Shop” dropdown" hint="Lists your categories and collections." checked={header.showShopMenu !== false} onChange={v => set({ showShopMenu: v })} />
        <TextField label="Shop label" value={header.shopMenuLabel} maxLength={24} placeholder="Shop" disabled={header.showShopMenu === false} onChange={v => set({ shopMenuLabel: v })} />
        <SwitchRow label="Add pages marked “show in navigation”" checked={header.includePagesInNav !== false} onChange={v => set({ includePagesInNav: v })} />
        <SwitchRow label="Blog link when there are no links" hint="Shown only if your navigation is empty." checked={header.showDefaultBlogLink !== false} onChange={v => set({ showDefaultBlogLink: v })} />
        <TextField label="Blog link label" value={header.blogLinkLabel} maxLength={24} placeholder="Theme default" disabled={header.showDefaultBlogLink === false} onChange={v => set({ blogLinkLabel: v })} />
      </div>
    </>
  );
}

/** Footer tab: logo, newsletter and the built-in columns. */
export function FooterSettingsPanel({ footer, onChange, storeId }: { footer: StorefrontFooter; onChange: (next: StorefrontFooter) => void; storeId: string }) {
  const set = (patch: Partial<StorefrontFooter>) => onChange({ ...footer, ...patch });
  const source = footer.logoSource ?? 'none';
  return (
    <>
      <div className={BLOCK}>
        <p className={HEADING}>Footer logo</p>
        <select className={SELECT} value={source} aria-label="Footer logo" onChange={e => set({ logoSource: e.target.value as StorefrontFooter['logoSource'] })}>
          <option value="none">Store name only</option>
          <option value="store">Use store logo</option>
          <option value="custom">Upload a footer logo</option>
        </select>
        {source === 'custom' && (
          <ImageUpload value={footer.logoUrl ? [footer.logoUrl] : []} onChange={urls => set({ logoUrl: urls[0] ?? null })} maxFiles={1} storeId={storeId} />
        )}
        {source !== 'none' && (
          <SizeField label="Logo width (px)" value={footer.logoWidth} min={40} max={400} onChange={v => set({ logoWidth: v })} hint="40–400, default 140" />
        )}
      </div>

      <div className={BLOCK}>
        <p className={HEADING}>Newsletter</p>
        <SwitchRow label="Show the newsletter sign-up" checked={footer.showNewsletter !== false} onChange={v => set({ showNewsletter: v })} />
        <TextField label="Heading" value={footer.newsletterHeading} maxLength={60} placeholder="Theme default" disabled={footer.showNewsletter === false} onChange={v => set({ newsletterHeading: v })} />
        <TextField label="Short text above the form" value={footer.newsletterText} maxLength={160} disabled={footer.showNewsletter === false} onChange={v => set({ newsletterText: v })} />
      </div>

      <div className={BLOCK}>
        <p className={HEADING}>Built-in columns</p>
        <SwitchRow label="Show the default Shop and Account columns" hint="Used only while you have no link columns of your own." checked={footer.showDefaultColumns !== false} onChange={v => set({ showDefaultColumns: v })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Shop column title" value={footer.shopColumnHeading} maxLength={40} placeholder="Shop" disabled={footer.showDefaultColumns === false} onChange={v => set({ shopColumnHeading: v })} />
          <TextField label="Account column title" value={footer.accountColumnHeading} maxLength={40} placeholder="Account" disabled={footer.showDefaultColumns === false} onChange={v => set({ accountColumnHeading: v })} />
        </div>
        <TextField label="Blog link label" value={footer.blogLinkLabel} maxLength={24} placeholder="Theme default" disabled={footer.showDefaultColumns === false} onChange={v => set({ blogLinkLabel: v })} />
      </div>
    </>
  );
}
