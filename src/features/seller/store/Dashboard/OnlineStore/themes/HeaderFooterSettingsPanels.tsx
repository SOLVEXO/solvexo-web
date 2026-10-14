import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';

const SELECT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

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

/** A collapsible settings group, like the setting groups in Shopify's theme editor. */
export function Group({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group/acc border-b border-bone">
      <summary className="list-none flex items-center justify-between cursor-pointer py-3 text-[12.5px] font-semibold text-charcoal select-none [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={15} className="text-slate transition-transform group-open/acc:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 pb-4">{children}</div>
    </details>
  );
}

/** A colour choice. Empty = the theme's own colour, shown as "Auto" (never a made-up swatch that is not on the store). */
export function ColorField({ label, value, fallback, onChange }: { label: string; value: string | null | undefined; fallback: string; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-charcoal">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative h-8 w-10 border border-bone rounded cursor-pointer overflow-hidden shrink-0"
          style={value ? { background: value } : { background: 'repeating-linear-gradient(45deg,#fff 0 4px,#e9e5dc 4px 8px)' }}>
          <input type="color" aria-label={label} value={value ?? fallback} onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        {value
          ? <button type="button" onClick={() => onChange(null)} className="text-[11px] text-slate bg-transparent border-0 cursor-pointer underline p-0">Reset to theme</button>
          : <span className="text-[11px] text-slate">Auto (theme)</span>}
      </div>
    </div>
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

/** Header section settings, grouped like Shopify's header settings. Every control falls back to the theme's own look. */
export function HeaderSettingsPanel({ header, onChange, logoSlot }: { header: StorefrontHeader; onChange: (next: StorefrontHeader) => void; logoSlot?: ReactNode }) {
  const set = (patch: Partial<StorefrontHeader>) => onChange({ ...header, ...patch });
  const centered = header.headerStyle === 'centered';
  return (
    <>
      <Group title="Logo">
        {logoSlot}
        <div className="grid grid-cols-2 gap-3">
          <SizeField label="Desktop width (px)" value={header.logoWidth} min={40} max={400} onChange={v => set({ logoWidth: v })} hint="40–400" />
          <SizeField label="Mobile width (px)" value={header.mobileLogoWidth} min={24} max={240} onChange={v => set({ mobileLogoWidth: v })} hint="24–240" />
        </div>
        <p className="text-[10.5px] text-slate">Leave empty to keep the theme's own logo size.</p>
      </Group>

      <Group title="Layout">
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">Logo position</span>
          <select className={SELECT} value={header.headerStyle ?? 'standard'}
            onChange={e => set({ headerStyle: e.target.value as StorefrontHeader['headerStyle'] })}>
            <option value="standard">Left, menu beside it</option>
            <option value="centered">Center, menu below</option>
          </select>
        </label>
        {centered && (
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] text-charcoal">Menu alignment</span>
            <select className={SELECT} value={header.navAlignment ?? 'left'} onChange={e => set({ navAlignment: e.target.value as StorefrontHeader['navAlignment'] })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        )}
        <SwitchRow label="Sticky header" hint="Stays at the top while customers scroll." checked={header.sticky === true} onChange={v => set({ sticky: v })} />
      </Group>

      <Group title="Colours and spacing">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={header.bgColor} fallback="#ffffff" onChange={v => set({ bgColor: v })} />
          <ColorField label="Text and icons" value={header.textColor} fallback="#161412" onChange={v => set({ textColor: v })} />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">Height</span>
          <select className={SELECT} value={header.paddingY ?? 'normal'} onChange={e => set({ paddingY: e.target.value as StorefrontHeader['paddingY'] })}>
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>
        <SwitchRow label="Show a line under the header" checked={header.showDivider !== false} onChange={v => set({ showDivider: v })} />
      </Group>

      <Group title="Icons">
        <SwitchRow label="Search" checked={header.showSearch !== false} onChange={v => set({ showSearch: v })} />
        <SwitchRow label="Account" checked={header.showAccount !== false} onChange={v => set({ showAccount: v })} />
        <SwitchRow label="Wishlist (signed-in shoppers)" checked={header.showWishlist !== false} onChange={v => set({ showWishlist: v })} />
        <p className="text-[10.5px] text-slate">The cart icon always stays.</p>
      </Group>

      <Group title="Automatic menu items">
        <SwitchRow label="“Shop” dropdown" hint="Lists your categories and collections." checked={header.showShopMenu !== false} onChange={v => set({ showShopMenu: v })} />
        {header.showShopMenu !== false && <TextField label="Shop label" value={header.shopMenuLabel} maxLength={24} placeholder="Shop" onChange={v => set({ shopMenuLabel: v })} />}
        <SwitchRow label="Pages marked “show in navigation”" checked={header.includePagesInNav !== false} onChange={v => set({ includePagesInNav: v })} />
        <SwitchRow label="Blog link when the menu is empty" checked={header.showDefaultBlogLink !== false} onChange={v => set({ showDefaultBlogLink: v })} />
        {header.showDefaultBlogLink !== false && <TextField label="Blog link label" value={header.blogLinkLabel} maxLength={24} placeholder="Theme default" onChange={v => set({ blogLinkLabel: v })} />}
      </Group>
    </>
  );
}

/** Footer section settings: logo (used by the Brand block), colours and the built-in columns. */
export function FooterSettingsPanel({ footer, onChange, storeId }: { footer: StorefrontFooter; onChange: (next: StorefrontFooter) => void; storeId: string }) {
  const set = (patch: Partial<StorefrontFooter>) => onChange({ ...footer, ...patch });
  const source = footer.logoSource ?? 'none';
  return (
    <>
      <Group title="Layout">
        <select className={SELECT} value={footer.footerStyle ?? 'columns'} aria-label="Footer layout" onChange={e => set({ footerStyle: e.target.value as StorefrontFooter['footerStyle'] })}>
          <option value="columns">Columns</option>
          <option value="minimal">Compact (wider columns, less space)</option>
        </select>
      </Group>

      <Group title="Colours">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={footer.bgColor} fallback="#161412" onChange={v => set({ bgColor: v })} />
          <ColorField label="Text" value={footer.textColor} fallback="#ede9e1" onChange={v => set({ textColor: v })} />
        </div>
      </Group>

      <Group title="Logo (Brand block)">
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
      </Group>

      <Group title="Default Shop and Account columns">
        <SwitchRow label="Show them" hint="Only while you have no Link column blocks of your own." checked={footer.showDefaultColumns !== false} onChange={v => set({ showDefaultColumns: v })} />
        {footer.showDefaultColumns !== false && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Shop column title" value={footer.shopColumnHeading} maxLength={40} placeholder="Shop" onChange={v => set({ shopColumnHeading: v })} />
              <TextField label="Account column title" value={footer.accountColumnHeading} maxLength={40} placeholder="Account" onChange={v => set({ accountColumnHeading: v })} />
            </div>
            <TextField label="Blog link label" value={footer.blogLinkLabel} maxLength={24} placeholder="Theme default" onChange={v => set({ blogLinkLabel: v })} />
          </>
        )}
      </Group>
    </>
  );
}