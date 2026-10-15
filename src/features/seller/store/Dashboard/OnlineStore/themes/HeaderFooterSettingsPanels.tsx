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
            <option value="inline">Left, menu in the middle</option>
            <option value="split">Middle, menu on the left</option>
            <option value="centered">Middle, menu below</option>
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
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">While scrolling</span>
          <select className={SELECT} value={header.stickyMode ?? (header.sticky ? 'always' : 'off')}
            onChange={e => { const stickyMode = e.target.value as 'off' | 'always' | 'scroll-up'; set({ stickyMode, sticky: stickyMode !== 'off' }); }}>
            <option value="off">Scrolls away with the page</option>
            <option value="always">Always stays at the top</option>
            <option value="scroll-up">Hides on scroll down, shows on scroll up</option>
          </select>
        </label>
        <SwitchRow label="See-through on the home page" hint="Sits over your first section (e.g. the banner) until shoppers scroll."
          checked={header.transparentOnHome === true} onChange={v => set({ transparentOnHome: v })} />
        {header.transparentOnHome && (
          <ColorField label="Text and icons while see-through" value={header.transparentTextColor} fallback="#ffffff" onChange={v => set({ transparentTextColor: v })} />
        )}
      </Group>

      <Group title="Menu style">
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">Text size</span>
          <select className={SELECT} value={header.navFontSize ?? 'md'} onChange={e => set({ navFontSize: e.target.value as StorefrontHeader['navFontSize'] })}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
        <SwitchRow label="Capital letters" checked={header.navUppercase === true} onChange={v => set({ navUppercase: v })} />
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">When shoppers point at a link</span>
          <select className={SELECT} value={header.navHoverStyle ?? 'none'} onChange={e => set({ navHoverStyle: e.target.value as StorefrontHeader['navHoverStyle'] })}>
            <option value="none">No effect</option>
            <option value="underline">Slide-in underline</option>
            <option value="pill">Soft highlight</option>
          </select>
        </label>
      </Group>

      <Group title="Button">
        <p className="text-[10.5px] text-slate -mt-1">An eye-catching button next to the icons, e.g. “Shop sale”. Shown on desktop.</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Button text" value={header.ctaLabel} maxLength={30} placeholder="Shop sale" onChange={v => set({ ctaLabel: v })} />
          <TextField label="Button link" value={header.ctaLink} maxLength={500} placeholder="/collections/sale" onChange={v => set({ ctaLink: v })} />
        </div>
        <p className="text-[10.5px] text-slate">Leave the text empty to hide it. Links start with https:// or /.</p>
      </Group>

      <Group title="Top info strip">
        <SwitchRow label="Show a thin strip above the header" checked={header.topBarEnabled === true} onChange={v => set({ topBarEnabled: v })} />
        {header.topBarEnabled && (
          <>
            <TextField label="Text" value={header.topBarText} maxLength={120} placeholder="Free shipping on orders over Rs. 3,000" onChange={v => set({ topBarText: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Phone" value={header.topBarPhone} maxLength={40} placeholder="+92 300 1234567" onChange={v => set({ topBarPhone: v })} />
              <TextField label="Email" value={header.topBarEmail} maxLength={120} placeholder="hello@yourstore.com" onChange={v => set({ topBarEmail: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Strip background" value={header.topBarBg} fallback="#161412" onChange={v => set({ topBarBg: v })} />
              <ColorField label="Strip text" value={header.topBarTextColor} fallback="#ffffff" onChange={v => set({ topBarTextColor: v })} />
            </div>
          </>
        )}
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
        {header.showSearch !== false && (
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] text-charcoal">Search look</span>
            <select className={SELECT} value={header.searchStyle ?? 'icon'} onChange={e => set({ searchStyle: e.target.value as StorefrontHeader['searchStyle'] })}>
              <option value="icon">Icon only</option>
              <option value="bar">Search box (“Search products…”)</option>
            </select>
          </label>
        )}
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
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] text-charcoal">Spacing</span>
            <select className={SELECT} value={footer.paddingY ?? 'normal'} onChange={e => set({ paddingY: e.target.value as StorefrontFooter['paddingY'] })}>
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] text-charcoal">Alignment</span>
            <select className={SELECT} value={footer.align ?? 'left'} onChange={e => set({ align: e.target.value as StorefrontFooter['align'] })}>
              <option value="left">Left</option>
              <option value="center">Centred</option>
            </select>
          </label>
        </div>
        <SwitchRow label="Email sign-up as a wide strip on top" hint="Uses your Email sign-up block; add one if you have none."
          checked={footer.newsletterTop === true} onChange={v => set({ newsletterTop: v })} />
        <SwitchRow label="Fold columns on phones" hint="Shoppers tap a heading to open its links." checked={footer.mobileAccordion !== false} onChange={v => set({ mobileAccordion: v })} />
      </Group>

      <Group title="Colours and background">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={footer.bgColor} fallback="#161412" onChange={v => set({ bgColor: v })} />
          <ColorField label="Text" value={footer.textColor} fallback="#ede9e1" onChange={v => set({ textColor: v })} />
        </div>
        <span className="text-[11.5px] text-charcoal">Background image (optional)</span>
        <ImageUpload value={footer.bgImageUrl ? [footer.bgImageUrl] : []} onChange={urls => set({ bgImageUrl: urls[0] ?? null })} maxFiles={1} storeId={storeId} />
        {footer.bgImageUrl && (
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] text-charcoal">Darken the image: {footer.bgOverlay ?? 50}%</span>
            <input type="range" min={0} max={85} step={5} value={footer.bgOverlay ?? 50} onChange={e => set({ bgOverlay: Number(e.target.value) })} />
            <span className="text-[10.5px] text-slate">Keeps your text readable on a busy photo.</span>
          </label>
        )}
      </Group>

      <Group title="Headings and social icons">
        <SwitchRow label="Column headings in capital letters" checked={footer.headingUppercase !== false} onChange={v => set({ headingUppercase: v })} />
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">Social icon style</span>
          <select className={SELECT} value={footer.socialStyle ?? ''} onChange={e => set({ socialStyle: (e.target.value || null) as StorefrontFooter['socialStyle'] })}>
            <option value="">Theme default</option>
            <option value="plain">Plain icons</option>
            <option value="circle">Round buttons</option>
            <option value="square">Square buttons</option>
          </select>
        </label>
      </Group>

      <Group title="Bottom bar">
        <SwitchRow label="Policy links" hint="Pages you marked “Show in footer”." checked={footer.showPolicyLinks !== false} onChange={v => set({ showPolicyLinks: v })} />
        <SwitchRow label="Currency selector" checked={footer.showCurrency === true} onChange={v => set({ showCurrency: v })} />
        <SwitchRow label="“Back to top” link" checked={footer.showBackToTop === true} onChange={v => set({ showBackToTop: v })} />
        <p className="text-[10.5px] text-slate">Copyright and payment icons are blocks — add or edit them in Footer blocks.</p>
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