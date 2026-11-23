import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { ChromeIcon } from '@/features/storefront/chrome/ChromeIcon';
import { ChromeQrCode } from '@/features/storefront/chrome/ChromeQrCode';
import {
  CHROME_ICON_KEYS, DEFAULT_POPUP, DEFAULT_QR, MAX_CHROME_ITEMS, MAX_POPUP_LINKS, newChromeItem, POPUP_PARTS, POPUP_PART_LABEL,
  type ChromeItem, type ChromePopup, type ChromeQr, type PopupLink,
} from '@/features/storefront/chrome/chromeTypes';
import { ColorField } from './HeaderFooterSettingsPanels';

const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] text-charcoal">{label}</span>
      {children}
      {hint && <span className="text-[10.5px] text-slate">{hint}</span>}
    </label>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12.5px] text-charcoal">{label}</span>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function IconPicker({ icon, iconUrl, storeId, onChange }: { icon: string; iconUrl: string; storeId: string; onChange: (p: { icon: string; iconUrl: string }) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11.5px] text-charcoal">Icon</span>
      <div className="grid grid-cols-8 gap-1">
        <button type="button" onClick={() => onChange({ icon: '', iconUrl: '' })} aria-label="No icon" aria-pressed={!icon && !iconUrl}
          className={`h-8 rounded border text-[10px] cursor-pointer ${!icon && !iconUrl ? 'border-charcoal bg-bone' : 'border-bone bg-white'}`}>None</button>
        {CHROME_ICON_KEYS.map(k => (
          <button key={k} type="button" title={k} aria-label={k} aria-pressed={icon === k && !iconUrl} onClick={() => onChange({ icon: k, iconUrl: '' })}
            className={`h-8 grid place-items-center rounded border cursor-pointer text-charcoal ${icon === k && !iconUrl ? 'border-charcoal bg-bone' : 'border-bone bg-white'}`}>
            <ChromeIcon icon={k} size={15} />
          </button>
        ))}
      </div>
      <span className="text-[10.5px] text-slate">Or upload your own icon (a small square image, PNG or SVG):</span>
      <ImageUpload value={iconUrl ? [iconUrl] : []} onChange={urls => onChange({ icon: urls[0] ? '' : icon, iconUrl: urls[0] ?? '' })} maxFiles={1} storeId={storeId} />
    </div>
  );
}

type QrKind = 'link' | 'whatsapp' | 'phone' | 'email';
const qrKindOf = (d: string): QrKind => d.startsWith('https://wa.me/') ? 'whatsapp' : d.startsWith('tel:') ? 'phone' : d.startsWith('mailto:') ? 'email' : 'link';
const QR_PREFIX: Record<QrKind, string> = { link: '', whatsapp: 'https://wa.me/', phone: 'tel:', email: 'mailto:' };

/** The seller designs their own QR: what it opens, colours, dot and corner shapes, a centre logo and a caption. */
function QrDesigner({ qr, storeId, onChange }: { qr: ChromeQr; storeId: string; onChange: (q: ChromeQr | null) => void }) {
  const [kind, setKind] = useState<QrKind>(qrKindOf(qr.data));
  const set = (p: Partial<ChromeQr>) => onChange({ ...qr, ...p });
  const raw = qr.data.startsWith(QR_PREFIX[kind]) ? qr.data.slice(QR_PREFIX[kind].length) : qr.data;
  const write = (v: string) => set({ data: v.trim() ? `${QR_PREFIX[kind]}${kind === 'whatsapp' ? v.replace(/[^0-9]/g, '') : v.trim()}` : '' });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bone p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-charcoal">QR code</span>
        <button type="button" onClick={() => onChange(null)} className="text-[11px] text-slate underline bg-transparent border-0 cursor-pointer p-0">Remove QR</button>
      </div>
      <Row label="What should it open?">
        <select className={INPUT} value={kind} onChange={e => { setKind(e.target.value as QrKind); set({ data: '' }); }}>
          <option value="link">A website / any link</option>
          <option value="whatsapp">A WhatsApp chat</option>
          <option value="phone">A phone call</option>
          <option value="email">An email</option>
        </select>
      </Row>
      <Row label={kind === 'whatsapp' ? 'WhatsApp number (with country code)' : kind === 'phone' ? 'Phone number' : kind === 'email' ? 'Email address' : 'Link or text'}>
        <input className={INPUT} value={raw} maxLength={600} onChange={e => write(e.target.value)}
          placeholder={kind === 'whatsapp' ? '923001234567' : kind === 'phone' ? '+92 300 1234567' : kind === 'email' ? 'hello@yourstore.com' : 'https://yourstore.com/offer'} />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Dots colour" value={qr.fg} fallback="#111111" onChange={v => set({ fg: v ?? '#111111' })} />
        <ColorField label="Background" value={qr.bg} fallback="#ffffff" onChange={v => set({ bg: v ?? '#ffffff' })} />
      </div>
      <Switch label="Transparent background (no fill behind the dots)" checked={qr.transparent === true} onChange={v => set({ transparent: v })} />
      {qr.transparent === true && <p className="-mt-1 text-[10.5px] text-slate">Make sure the dots colour stands out on the popup background, or the QR will not scan.</p>}
      <div className="grid grid-cols-2 gap-3">
        <Row label="Dot shape">
          <select className={INPUT} value={qr.dot} onChange={e => set({ dot: e.target.value as ChromeQr['dot'] })}>
            <option value="square">Square</option><option value="rounded">Rounded</option><option value="dots">Round dots</option>
          </select>
        </Row>
        <Row label="Corner shape">
          <select className={INPUT} value={qr.eye} onChange={e => set({ eye: e.target.value as ChromeQr['eye'] })}>
            <option value="square">Square</option><option value="rounded">Rounded</option><option value="circle">Circle</option>
          </select>
        </Row>
      </div>
      <Row label="Caption under the QR" hint="Optional, e.g. Scan to chat with us">
        <input className={INPUT} value={qr.caption} maxLength={60} onChange={e => set({ caption: e.target.value })} />
      </Row>
      <Switch label="Card around the QR (rounded, with a soft shadow)" checked={qr.frame} onChange={v => set({ frame: v })} />
      {qr.frame && <ColorField label="Card colour" value={qr.frameBg || null} fallback="#ffffff" onChange={v => set({ frameBg: v ?? '' })} />}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-charcoal">Logo in the middle (optional)</span>
        <ImageUpload value={qr.logoUrl ? [qr.logoUrl] : []} onChange={urls => set({ logoUrl: urls[0] ?? '' })} maxFiles={1} storeId={storeId} />
      </div>
      <div className="flex justify-center rounded-lg bg-[#f6f5f2] p-3">
        {qr.data ? <ChromeQrCode qr={qr} size={150} /> : <span className="text-[11px] text-slate">Type what it should open to see the QR.</span>}
      </div>
    </div>
  );
}

/** A number box: empty means "automatic" (`empty` is what gets stored then). */
function NumField({ label, value, empty, min, max, onChange, hint }: {
  label: string; value: number; empty: number; min: number; max: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <Row label={label} hint={hint}>
      <input type="number" inputMode="numeric" min={min} max={max} className={INPUT} placeholder="Auto" value={value === empty ? '' : value}
        onChange={e => {
          const raw = e.target.value;
          if (raw.trim() === '') { onChange(empty); return; }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }} />
    </Row>
  );
}

/** The popup's own menu: up to 30 links, shown in a grid of 1-6 columns. */
function LinksEditor({ popup, onChange }: { popup: ChromePopup; onChange: (p: Partial<ChromePopup>) => void }) {
  const links = popup.links ?? [];
  const setLinks = (next: PopupLink[]) => onChange({ links: next });
  const upd = (i: number, p: Partial<PopupLink>) => setLinks(links.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const move = (i: number, d: -1 | 1) => { const n = [...links]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setLinks(n); };
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bone p-3">
      <span className="text-[12.5px] font-semibold text-charcoal">Menu / links inside the popup</span>
      <Row label="Group title (optional)"><input className={INPUT} value={popup.linksTitle ?? ''} maxLength={80} onChange={e => onChange({ linksTitle: e.target.value })} /></Row>
      <NumField label="Columns (1 to 6)" value={popup.linksColumns ?? 2} empty={-999} min={1} max={6} onChange={v => onChange({ linksColumns: v })} />
      {links.map((l, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded border border-bone bg-white p-2">
          <div className="flex items-center gap-1">
            <input className={INPUT} aria-label={`Link ${i + 1} label`} placeholder="Label" value={l.label} maxLength={60} onChange={e => upd(i, { label: e.target.value })} />
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowUp size={13} /></button>
            <button type="button" aria-label="Move down" disabled={i === links.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowDown size={13} /></button>
            <button type="button" aria-label={`Delete link ${i + 1}`} onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1 bg-transparent border-0 cursor-pointer"><Trash2 size={13} /></button>
          </div>
          <input className={INPUT} aria-label={`Link ${i + 1} address`} placeholder="https://, /pages/about, tel:, mailto:" value={l.url} maxLength={600} onChange={e => upd(i, { url: e.target.value })} />
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-bone text-charcoal"><ChromeIcon icon={l.icon || 'link'} size={14} /></span>
            <select className={INPUT} aria-label={`Link ${i + 1} icon`} value={l.icon} onChange={e => upd(i, { icon: e.target.value })}>
              <option value="">No icon</option>
              {CHROME_ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <label className="flex shrink-0 items-center gap-1 text-[12px] text-charcoal"><input type="checkbox" checked={l.bold === true} onChange={e => upd(i, { bold: e.target.checked })} /> Bold</label>
          </div>
        </div>
      ))}
      {links.length < MAX_POPUP_LINKS && (
        <button type="button" onClick={() => setLinks([...links, { label: '', url: '', icon: '', bold: false }])}
          className="self-start rounded-lg border border-bone bg-white px-3 py-1.5 text-[12px] text-charcoal cursor-pointer">+ Add a link ({links.length}/{MAX_POPUP_LINKS})</button>
      )}
      <p className="text-[10.5px] text-slate">Turn on "Links / menu" in the list below to show it.</p>
    </div>
  );
}

/** Which parts the popup shows and in what order (a part switched off is hidden). */
function PartsOrder({ popup, onChange }: { popup: ChromePopup; onChange: (p: Partial<ChromePopup>) => void }) {
  const order = (popup.order ?? POPUP_PARTS).filter(k => POPUP_PARTS.includes(k));
  const hidden = POPUP_PARTS.filter(k => !order.includes(k));
  const move = (i: number, d: -1 | 1) => { const n = [...order]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange({ order: n }); };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-charcoal">What the popup shows, in order</span>
      {order.map((k, i) => (
        <div key={k} className="flex items-center gap-1 rounded border border-bone bg-white px-2 py-1 text-[12px] text-charcoal">
          <span className="flex-1">{POPUP_PART_LABEL[k]}</span>
          <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowUp size={13} /></button>
          <button type="button" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowDown size={13} /></button>
          <button type="button" aria-label={`Hide ${POPUP_PART_LABEL[k]}`} onClick={() => onChange({ order: order.filter(x => x !== k) })} className="p-1 bg-transparent border-0 cursor-pointer"><Trash2 size={13} /></button>
        </div>
      ))}
      {hidden.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hidden.map(k => (
            <button key={k} type="button" onClick={() => onChange({ order: [...order, k] })}
              className="inline-flex items-center gap-1 rounded border border-dashed border-bone bg-white px-2 py-1 text-[11.5px] text-slate cursor-pointer"><Plus size={12} /> {POPUP_PART_LABEL[k]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function PopupEditor({ popup, storeId, onChange }: { popup: ChromePopup; storeId: string; onChange: (p: ChromePopup) => void }) {
  const set = (p: Partial<ChromePopup>) => onChange({ ...popup, ...p });
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-[#faf9f6] p-3">
      <span className="text-[12.5px] font-semibold text-charcoal">Popup content</span>
      <Row label="Heading"><input className={INPUT} value={popup.title} maxLength={120} onChange={e => set({ title: e.target.value })} /></Row>
      <Row label="Text" hint="Line breaks are kept. Write steps, offers, anything.">
        <textarea className={INPUT} rows={5} maxLength={2000} value={popup.body} onChange={e => set({ body: e.target.value })} />
      </Row>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-charcoal">Image (optional)</span>
        <ImageUpload value={popup.imageUrl ? [popup.imageUrl] : []} onChange={urls => set({ imageUrl: urls[0] ?? '' })} maxFiles={1} storeId={storeId} />
      </div>
      {popup.qr
        ? <QrDesigner qr={popup.qr} storeId={storeId} onChange={q => set({ qr: q })} />
        : <button type="button" onClick={() => set({ qr: { ...DEFAULT_QR } })} className="self-start rounded-lg border border-bone bg-white px-3 py-1.5 text-[12px] text-charcoal cursor-pointer">+ Add a QR code</button>}
      <div className="grid grid-cols-2 gap-3">
        <Row label="Button text"><input className={INPUT} value={popup.buttonLabel} maxLength={40} onChange={e => set({ buttonLabel: e.target.value })} /></Row>
        <Row label="Button link"><input className={INPUT} value={popup.buttonUrl} maxLength={600} placeholder="https://" onChange={e => set({ buttonUrl: e.target.value })} /></Row>
      </div>
      <Switch label="Show share icons" checked={popup.showShare} onChange={v => set({ showShare: v })} />
      <Row label="Small print (optional)"><input className={INPUT} value={popup.footnote} maxLength={300} onChange={e => set({ footnote: e.target.value })} /></Row>
      <LinksEditor popup={popup} onChange={set} />
      <PartsOrder popup={popup} onChange={set} />
      <span className="text-[12.5px] font-semibold text-charcoal">Popup look</span>
      <p className="-mt-2 text-[10.5px] text-slate">Anything left empty follows your theme's own style.</p>
      <Row label="Where it opens">
        <select className={INPUT} value={popup.placement ?? 'below'} onChange={e => set({ placement: e.target.value as ChromePopup['placement'] })}>
          <option value="below">Right under the item (like a dropdown)</option>
          <option value="center">In the middle of the screen</option>
        </select>
      </Row>
      <Row label="Style">
        <select className={INPUT} value={popup.style ?? 'classic'} onChange={e => set({ style: e.target.value as ChromePopup['style'] })}>
          <option value="theme">Follow my theme (its own card / panel / glass look)</option>
          <option value="classic">Classic (flat, attached to the strip)</option>
        </select>
      </Row>
      <Row label="Width">
        <select className={INPUT} value={popup.widthMode ?? 'auto'} onChange={e => set({ widthMode: e.target.value as ChromePopup['widthMode'] })}>
          <option value="auto">Automatic (theme)</option>
          <option value="custom">Custom width (px)</option>
          <option value="content">Same as the page content width</option>
          <option value="full">Full screen width (like a menu panel)</option>
        </select>
      </Row>
      <Row label="Content layout">
        <select className={INPUT} value={popup.layout ?? 'side'} onChange={e => set({ layout: e.target.value as ChromePopup['layout'] })}>
          <option value="side">Text on one side, QR / image on the other</option>
          <option value="stack">Everything in one column</option>
        </select>
      </Row>
      {(popup.layout ?? 'side') === 'side' && (
        <Row label="Image and QR position" hint="Beside the text, or above / below it">
          <select className={INPUT} value={popup.mediaPlacement ?? 'side'} onChange={e => set({ mediaPlacement: e.target.value as ChromePopup['mediaPlacement'] })}>
            <option value="side">Beside the text</option><option value="above">Above the text</option><option value="below">Below the text</option>
          </select>
        </Row>
      )}
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Max height (px)" value={popup.maxHeight ?? 0} empty={0} min={120} max={2000} onChange={v => set({ maxHeight: v })} hint="Empty = automatic; scrolls inside" />
        <NumField label="Gap under the strip (px)" value={popup.gap ?? -1} empty={-1} min={0} max={200} onChange={v => set({ gap: v })} hint="Empty = theme default" />
        <NumField label="Width (px)" value={popup.widthPx ?? 0} empty={0} min={200} max={1600} onChange={v => set({ widthPx: v })} hint="Empty = automatic" />
        <NumField label="Corner roundness (px)" value={popup.radius ?? -1} empty={-1} min={0} max={200} onChange={v => set({ radius: v })} />
        <NumField label="Space inside (px)" value={popup.padding ?? -1} empty={-1} min={0} max={200} onChange={v => set({ padding: v })} />
        <NumField label="Heading size (px)" value={popup.titleSize ?? 0} empty={0} min={10} max={120} onChange={v => set({ titleSize: v })} />
        <NumField label="Text size (px)" value={popup.bodySize ?? 0} empty={0} min={9} max={48} onChange={v => set({ bodySize: v })} />
        <Row label="Text alignment">
          <select className={INPUT} value={popup.align ?? 'left'} onChange={e => set({ align: e.target.value as ChromePopup['align'] })}>
            <option value="left">Left</option><option value="center">Centre</option>
          </select>
        </Row>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Popup background" value={popup.bg || null} fallback="#ffffff" onChange={v => set({ bg: v ?? '' })} />
        <ColorField label="Popup text colour" value={popup.fg || null} fallback="#161412" onChange={v => set({ fg: v ?? '' })} />
      </div>
      <Switch label="Soft shadow" checked={popup.shadow !== false} onChange={v => set({ shadow: v })} />
      <Switch label="Thin border" checked={popup.border === true} onChange={v => set({ border: v })} />
    </div>
  );
}

/**
 * Lets the seller build their own strip / floating items: a plain text, a link, or a button that opens a popup (with their own
 * designed QR code). The theme decides fonts, shapes and popup look; the seller decides content, icons, colours and order.
 */
export function ChromeItemsEditor({ items, onChange, showZone, itemName = 'item', compactColours = false }: {
  items: ChromeItem[]; onChange: (next: ChromeItem[]) => void; showZone: boolean; itemName?: string; compactColours?: boolean;
}) {
  const { storeId } = useStoreWorkspace();
  const [openId, setOpenId] = useState<string | null>(null);
  const sid = storeId ?? '';
  const update = (id: string, p: Partial<ChromeItem>) => onChange(items.map(i => (i.id === id ? { ...i, ...p } : i)));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items]; const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]]; onChange(next);
  };
  const add = (kind: ChromeItem['kind']) => { const it = newChromeItem(kind); onChange([...items, it]); setOpenId(it.id); };

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-[11px] text-slate">No {itemName}s yet. Add a text, a link or a popup.</p>}
      {items.map((it, idx) => {
        const open = openId === it.id;
        return (
          <div key={it.id} className="rounded-lg border border-bone bg-white">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" onClick={() => setOpenId(open ? null : it.id)} aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-2 bg-transparent border-0 cursor-pointer p-0 text-left text-[12.5px] text-charcoal">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-bone"><ChromeIcon icon={it.icon || (it.kind === 'text' ? 'info' : 'link')} iconUrl={it.iconUrl} size={14} /></span>
                <span className="truncate">{it.label || '(no text)'}</span>
                <span className="shrink-0 rounded bg-bone px-1.5 text-[10px] text-slate">{it.kind}</span>
                <ChevronDown size={14} className={`ml-auto shrink-0 text-slate transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className="p-1 text-slate disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowUp size={14} /></button>
              <button type="button" aria-label="Move down" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="p-1 text-slate disabled:opacity-30 bg-transparent border-0 cursor-pointer"><ArrowDown size={14} /></button>
              <button type="button" aria-label={`Delete ${itemName}`} onClick={() => onChange(items.filter(i => i.id !== it.id))} className="p-1 text-slate bg-transparent border-0 cursor-pointer"><Trash2 size={14} /></button>
            </div>
            {open && (
              <div className="flex flex-col gap-3 border-t border-bone p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Row label="Type">
                    <select className={INPUT} value={it.kind} onChange={e => {
                      const kind = e.target.value as ChromeItem['kind'];
                      update(it.id, { kind, popup: kind === 'popup' ? (it.popup ?? { ...DEFAULT_POPUP, title: it.label, body: '' }) : null });
                    }}>
                      <option value="text">Text only</option><option value="link">Link</option><option value="popup">Opens a popup</option>
                    </select>
                  </Row>
                  {showZone && (
                    <Row label="Place">
                      <select className={INPUT} value={it.zone} onChange={e => update(it.id, { zone: e.target.value as ChromeItem['zone'] })}>
                        <option value="left">Left</option><option value="center">Middle</option><option value="right">Right</option>
                      </select>
                    </Row>
                  )}
                </div>
                <Row label="Text"><input className={INPUT} value={it.label} maxLength={80} onChange={e => update(it.id, { label: e.target.value })} /></Row>
                <IconPicker icon={it.icon} iconUrl={it.iconUrl} storeId={sid} onChange={p => update(it.id, p)} />
                {it.kind === 'link' && (
                  <>
                    <Row label="Link" hint="https://…, a page like /pages/contact, tel:+92…, or mailto:…">
                      <input className={INPUT} value={it.url} maxLength={600} placeholder="https://" onChange={e => update(it.id, { url: e.target.value })} />
                    </Row>
                    <Switch label="Open in a new tab" checked={it.newTab} onChange={v => update(it.id, { newTab: v })} />
                  </>
                )}
                {it.kind === 'popup' && it.popup && <PopupEditor popup={it.popup} storeId={sid} onChange={p => update(it.id, { popup: p })} />}
                <div className="grid grid-cols-2 gap-3">
                  <ColorField label={compactColours ? 'Button colour' : 'Highlight colour'} value={it.bg || null} fallback="#25D366" onChange={v => update(it.id, { bg: v ?? '' })} />
                  <ColorField label={compactColours ? 'Icon colour' : 'Text colour'} value={it.fg || null} fallback="#ffffff" onChange={v => update(it.id, { fg: v ?? '' })} />
                </div>
                {!compactColours && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumField label="Text size (px)" value={it.fontSize ?? 0} empty={0} min={8} max={60} onChange={v => update(it.id, { fontSize: v })} hint="Empty = the strip's" />
                    <div className="flex items-end pb-2"><Switch label="Bold" checked={it.bold === true} onChange={v => update(it.id, { bold: v })} /></div>
                  </div>
                )}
                <Row label="Show on">
                  <select className={INPUT} value={it.device} onChange={e => update(it.id, { device: e.target.value as ChromeItem['device'] })}>
                    <option value="all">Phones and computers</option><option value="desktop">Computers only</option><option value="mobile">Phones only</option>
                  </select>
                </Row>
              </div>
            )}
          </div>
        );
      })}
      {items.length < MAX_CHROME_ITEMS && (
        <div className="flex flex-wrap gap-2">
          {(['text', 'link', 'popup'] as const).map(k => (
            <button key={k} type="button" onClick={() => add(k)}
              className="inline-flex items-center gap-1 rounded-lg border border-bone bg-white px-2.5 py-1.5 text-[12px] text-charcoal cursor-pointer">
              <Plus size={13} /> {k === 'text' ? 'Text' : k === 'link' ? 'Link / icon' : 'Popup'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
