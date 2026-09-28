import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  X, ChevronLeft, Plus, Trash2, Copy, Monitor, Smartphone, Send, Save, LayoutTemplate,
  Heading1, Type, Image as ImageIcon, MousePointerClick, ShoppingBag, Columns2, Ticket, Minus, MoveVertical, Share2, PanelTop,
  ArrowUp, ArrowDown, Package, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/comman/ui';
import type { StoreData } from '@/api/services/store';
import { apiGetStoreInventory, type InventoryProduct } from '@/api/services/product';
import {
  apiCreateEmailCampaign, apiUpdateEmailCampaign, apiPreviewEmailCampaignSegment, apiSendEmailCampaignTest,
  type EmailCampaign, type EmailCampaignAudience, type EmailCampaignSegment,
} from '@/api/services/emailCampaigns';
import { MediaLibraryPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/MediaLibraryPickerModal';
import { SortableList } from '@/features/seller/store/Dashboard/OnlineStore/builder/Sortable';
import { EmailRichText } from './EmailRichText';
import {
  BLOCK_LIBRARY, FONT_OPTIONS, TEMPLATE_OPTIONS, AUTOMATION_ONLY_BLOCKS,
  createBlock, defaultDesign, templateDesign, renderEmailDesign, renderBlockStandalone, storeUrlFor, isEmailDesign, newBlockId,
  type EmailBlock, type EmailBlockType, type EmailDesign, type EmailDesignStyles, type SocialNetwork, type BlockAlign,
} from './emailDesign';

const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50';

const BLOCK_ICON: Record<EmailBlockType, LucideIcon> = {
  header: PanelTop, heading: Heading1, text: Type, image: ImageIcon, button: MousePointerClick, products: ShoppingBag,
  imageText: Columns2, discount: Ticket, divider: Minus, spacer: MoveVertical, social: Share2, dynamicProduct: Package,
};

const BLOCK_LABEL = Object.fromEntries(BLOCK_LIBRARY.map(b => [b.type, b.label])) as Record<EmailBlockType, string>;

function blockSummary(b: EmailBlock): string {
  switch (b.type) {
    case 'heading': return b.text;
    case 'text': return b.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    case 'button': return b.label;
    case 'products': return b.items.length ? `${b.items.length} product(s)` : 'No products picked';
    case 'discount': return b.code;
    case 'image': return b.url ? 'Image' : 'No image yet';
    default: return '';
  }
}

// ── Audience segment (same filters the API accepts) ──────────────────────────

type SegmentForm = { minOrders: string; minTotalSpent: string; orderedWithinDays: string; notOrderedWithinDays: string; tags: string };
const EMPTY_SEGMENT: SegmentForm = { minOrders: '', minTotalSpent: '', orderedWithinDays: '', notOrderedWithinDays: '', tags: '' };

function toSegment(f: SegmentForm): EmailCampaignSegment | null {
  const num = (v: string) => (v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
  const seg: EmailCampaignSegment = {};
  const minOrders = num(f.minOrders), minTotalSpent = num(f.minTotalSpent);
  const orderedWithinDays = num(f.orderedWithinDays), notOrderedWithinDays = num(f.notOrderedWithinDays);
  if (minOrders !== undefined) seg.minOrders = Math.max(0, Math.round(minOrders));
  if (minTotalSpent !== undefined) seg.minTotalSpent = Math.max(0, minTotalSpent);
  if (orderedWithinDays !== undefined) seg.orderedWithinDays = Math.max(1, Math.round(orderedWithinDays));
  if (notOrderedWithinDays !== undefined) seg.notOrderedWithinDays = Math.max(1, Math.round(notOrderedWithinDays));
  const tags = f.tags.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length) seg.tags = tags;
  return Object.keys(seg).length ? seg : null;
}

function fromSegment(s: EmailCampaignSegment | null | undefined): SegmentForm {
  if (!s) return EMPTY_SEGMENT;
  const str = (v?: number) => (v === undefined || v === null ? '' : String(v));
  return {
    minOrders: str(s.minOrders), minTotalSpent: str(s.minTotalSpent),
    orderedWithinDays: str(s.orderedWithinDays), notOrderedWithinDays: str(s.notOrderedWithinDays),
    tags: (s.tags ?? []).join(', '),
  };
}

// ── Small form atoms ─────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-medium text-charcoal mb-1.5">{label}</label>
      {children(id)}
      {hint && <p className="text-[11px] text-slate mt-1">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      {id => (
        <div className="flex items-center gap-2">
          <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} className="w-9 h-9 p-0.5 border border-bone rounded-md bg-white cursor-pointer" />
          <input aria-label={`${label} hex`} value={value} onChange={e => onChange(e.target.value)} className={`${INPUT} max-w-[120px] font-mono`} />
        </div>
      )}
    </Field>
  );
}

function AlignField({ value, onChange }: { value: BlockAlign; onChange: (v: BlockAlign) => void }) {
  return (
    <div>
      <p className="block text-[12px] font-medium text-charcoal mb-1.5">Alignment</p>
      <div className="inline-flex border border-bone rounded-lg overflow-hidden">
        {(['left', 'center', 'right'] as BlockAlign[]).map(a => (
          <button key={a} type="button" onClick={() => onChange(a)}
            className={`px-3 py-1.5 text-[12px] border-none cursor-pointer capitalize ${value === a ? 'bg-carbon text-white' : 'bg-white text-charcoal hover:bg-mist'}`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeField({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <Field label={`${label}: ${value}${suffix}`}>
      {id => <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-brand-orange" />}
    </Field>
  );
}

function ImagePickerField({ label, value, storeId, onChange }: { label: string; value: string | null; storeId: string; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      {id => (
        <div className="flex flex-col gap-2">
          {value && <img src={value} alt="" className="w-full max-h-[140px] object-contain rounded-md border border-bone bg-[#faf9f6]" />}
          <div className="flex gap-2">
            <Button size="xs" variant="outline" onClick={() => setOpen(true)}>{value ? 'Change' : 'Choose image'}</Button>
            {value && <Button size="xs" variant="outline" onClick={() => onChange(null)}>Remove</Button>}
          </div>
          <input id={id} value={value ?? ''} onChange={e => onChange(e.target.value.trim() || null)} placeholder="…or paste an image URL" className={INPUT} />
          <MediaLibraryPickerModal open={open} onClose={() => setOpen(false)} storeId={storeId} onSelect={url => { onChange(url); setOpen(false); }} />
        </div>
      )}
    </Field>
  );
}

// ── Product picker for the Products block ────────────────────────────────────

function ProductsField({ storeId, block, onChange }: { storeId: string; block: Extract<EmailBlock, { type: 'products' }>; onChange: (b: Extract<EmailBlock, { type: 'products' }>) => void }) {
  const [products, setProducts] = useState<InventoryProduct[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetStoreInventory(storeId, 1, 100)
      .then(res => { if (!cancelled) setProducts(res.data.products ?? []); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, [storeId]);

  const picked = new Set(block.items.map(i => i.productId));
  const shown = (products ?? []).filter(p => p.status === 'active' && p.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (p: InventoryProduct) => {
    if (picked.has(p.productId)) {
      onChange({ ...block, items: block.items.filter(i => i.productId !== p.productId) });
    } else if (block.items.length < 6) {
      onChange({ ...block, items: [...block.items, { productId: p.productId, name: p.name, imageUrl: p.image, price: p.price ?? null, currency: null }] });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-medium text-charcoal">Products ({block.items.length}/6)</p>
      <input aria-label="Search products" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…" className={INPUT} />
      <div className="max-h-[260px] overflow-y-auto border border-bone rounded-lg divide-y divide-bone">
        {products === null ? (
          <p className="p-3 text-[12px] text-slate">Loading products…</p>
        ) : shown.length === 0 ? (
          <p className="p-3 text-[12px] text-slate">No active products found.</p>
        ) : shown.map(p => (
          <label key={p.productId} className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer hover:bg-[#faf9f6]">
            <input type="checkbox" checked={picked.has(p.productId)} disabled={!picked.has(p.productId) && block.items.length >= 6} onChange={() => toggle(p)} />
            {p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" /> : <span className="w-8 h-8 rounded bg-mist shrink-0" />}
            <span className="text-[12.5px] text-charcoal truncate flex-1">{p.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Per-block settings panel ─────────────────────────────────────────────────

function BlockSettings({ block, storeId, onChange }: { block: EmailBlock; storeId: string; onChange: (b: EmailBlock) => void }) {
  const set = <B extends EmailBlock>(patch: Partial<B>) => onChange({ ...block, ...patch } as EmailBlock);

  switch (block.type) {
    case 'header':
      return (
        <div className="flex flex-col gap-4">
          <ImagePickerField label="Logo" value={block.logoUrl} storeId={storeId} onChange={v => set({ logoUrl: v })} />
          {block.logoUrl && <RangeField label="Logo width" value={block.logoWidth} min={60} max={300} suffix="px" onChange={v => set({ logoWidth: v })} />}
          <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={block.showStoreName} onChange={e => set({ showStoreName: e.target.checked })} /> Show store name
          </label>
          <AlignField value={block.align} onChange={v => set({ align: v })} />
          <ColorField label="Background" value={block.background} onChange={v => set({ background: v })} />
        </div>
      );
    case 'heading':
      return (
        <div className="flex flex-col gap-4">
          <Field label="Heading">{id => <input id={id} value={block.text} onChange={e => set({ text: e.target.value })} className={INPUT} />}</Field>
          <RangeField label="Size" value={block.size} min={18} max={44} suffix="px" onChange={v => set({ size: v })} />
          <AlignField value={block.align} onChange={v => set({ align: v })} />
          <ColorField label="Color" value={block.color} onChange={v => set({ color: v })} />
        </div>
      );
    case 'text':
      return (
        <div className="flex flex-col gap-4">
          <div>
            <p className="block text-[12px] font-medium text-charcoal mb-1.5">Text</p>
            <EmailRichText value={block.html} onChange={html => set({ html })} placeholder="Write something…" />
            <p className="text-[11px] text-slate mt-1">Use {'{{customerName}}'} and {'{{storeName}}'} — filled in for each subscriber.</p>
          </div>
          <AlignField value={block.align} onChange={v => set({ align: v })} />
        </div>
      );
    case 'image':
      return (
        <div className="flex flex-col gap-4">
          <ImagePickerField label="Image" value={block.url} storeId={storeId} onChange={v => set({ url: v })} />
          <RangeField label="Width" value={block.width} min={30} max={100} suffix="%" onChange={v => set({ width: v })} />
          <Field label="Alt text" hint="Shown if images are blocked; read by screen readers.">{id => <input id={id} value={block.alt} onChange={e => set({ alt: e.target.value })} className={INPUT} />}</Field>
          <Field label="Link (optional)">{id => <input id={id} value={block.link} onChange={e => set({ link: e.target.value })} placeholder="https://" className={INPUT} />}</Field>
        </div>
      );
    case 'button':
      return (
        <div className="flex flex-col gap-4">
          <Field label="Button label">{id => <input id={id} value={block.label} onChange={e => set({ label: e.target.value })} className={INPUT} />}</Field>
          <Field label="Link" hint="Leave empty to link to your store's homepage.">{id => <input id={id} value={block.link} onChange={e => set({ link: e.target.value })} placeholder="https://" className={INPUT} />}</Field>
          <AlignField value={block.align} onChange={v => set({ align: v })} />
          <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={block.fullWidth} onChange={e => set({ fullWidth: e.target.checked })} /> Full width
          </label>
          <ColorField label="Button color" value={block.background} onChange={v => set({ background: v })} />
          <ColorField label="Label color" value={block.color} onChange={v => set({ color: v })} />
        </div>
      );
    case 'products':
      return (
        <div className="flex flex-col gap-4">
          <ProductsField storeId={storeId} block={block} onChange={onChange} />
          <div>
            <p className="block text-[12px] font-medium text-charcoal mb-1.5">Products per row</p>
            <div className="inline-flex border border-bone rounded-lg overflow-hidden">
              {([1, 2, 3] as const).map(n => (
                <button key={n} type="button" onClick={() => set({ columns: n })}
                  className={`px-3.5 py-1.5 text-[12px] border-none cursor-pointer ${block.columns === n ? 'bg-carbon text-white' : 'bg-white text-charcoal hover:bg-mist'}`}>{n}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={block.showPrice} onChange={e => set({ showPrice: e.target.checked })} /> Show price
          </label>
          <Field label="Button label" hint="Leave empty to hide the button.">{id => <input id={id} value={block.buttonLabel} onChange={e => set({ buttonLabel: e.target.value })} className={INPUT} />}</Field>
        </div>
      );
    case 'imageText':
      return (
        <div className="flex flex-col gap-4">
          <ImagePickerField label="Image" value={block.url} storeId={storeId} onChange={v => set({ url: v })} />
          <div>
            <p className="block text-[12px] font-medium text-charcoal mb-1.5">Image position</p>
            <div className="inline-flex border border-bone rounded-lg overflow-hidden">
              {(['left', 'right'] as const).map(p => (
                <button key={p} type="button" onClick={() => set({ imagePosition: p })}
                  className={`px-3 py-1.5 text-[12px] border-none cursor-pointer capitalize ${block.imagePosition === p ? 'bg-carbon text-white' : 'bg-white text-charcoal hover:bg-mist'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="block text-[12px] font-medium text-charcoal mb-1.5">Text</p>
            <EmailRichText value={block.html} onChange={html => set({ html })} />
          </div>
          <Field label="Button label" hint="Leave empty to hide the button.">{id => <input id={id} value={block.buttonLabel} onChange={e => set({ buttonLabel: e.target.value })} className={INPUT} />}</Field>
          <Field label="Button link">{id => <input id={id} value={block.link} onChange={e => set({ link: e.target.value })} placeholder="https://" className={INPUT} />}</Field>
        </div>
      );
    case 'discount':
      return (
        <div className="flex flex-col gap-4">
          <Field label="Discount code" hint="Use a code you created under Marketing → Coupons.">{id => <input id={id} value={block.code} onChange={e => set({ code: e.target.value.toUpperCase() })} className={`${INPUT} uppercase`} />}</Field>
          <Field label="Title">{id => <input id={id} value={block.title} onChange={e => set({ title: e.target.value })} className={INPUT} />}</Field>
          <Field label="Description">{id => <input id={id} value={block.description} onChange={e => set({ description: e.target.value })} className={INPUT} />}</Field>
        </div>
      );
    case 'divider':
      return (
        <div className="flex flex-col gap-4">
          <RangeField label="Thickness" value={block.thickness} min={1} max={6} suffix="px" onChange={v => set({ thickness: v })} />
          <ColorField label="Color" value={block.color} onChange={v => set({ color: v })} />
        </div>
      );
    case 'spacer':
      return <RangeField label="Height" value={block.height} min={8} max={96} suffix="px" onChange={v => set({ height: v })} />;
    case 'dynamicProduct':
      return (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-slate">Shows the product this email is about — its image, name{block.showPrice ? ', price' : ''} and a link — filled in automatically for each shopper.</p>
          <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={block.showPrice} onChange={e => set({ showPrice: e.target.checked })} /> Show price
          </label>
          <Field label="Button label" hint="Leave empty to hide the button.">{id => <input id={id} value={block.buttonLabel} onChange={e => set({ buttonLabel: e.target.value })} className={INPUT} />}</Field>
          <AlignField value={block.align} onChange={v => set({ align: v })} />
        </div>
      );
    case 'social': {
      const NETWORKS: SocialNetwork[] = ['instagram', 'facebook', 'x', 'tiktok', 'youtube', 'pinterest', 'linkedin'];
      const setLink = (i: number, patch: Partial<{ network: SocialNetwork; url: string }>) =>
        set({ links: block.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
      return (
        <div className="flex flex-col gap-3">
          {block.links.map((l, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select aria-label="Network" value={l.network} onChange={e => setLink(i, { network: e.target.value as SocialNetwork })} className={`${INPUT} max-w-[120px] cursor-pointer`}>
                {NETWORKS.map(n => <option key={n} value={n}>{n === 'x' ? 'X' : n[0].toUpperCase() + n.slice(1)}</option>)}
              </select>
              <input aria-label="Profile URL" value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://" className={INPUT} />
              <button type="button" aria-label="Remove link" onClick={() => set({ links: block.links.filter((_, idx) => idx !== i) })} className="text-slate hover:text-error bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
            </div>
          ))}
          {block.links.length < 7 && (
            <Button size="xs" variant="outline" icon={<Plus size={12} />} onClick={() => set({ links: [...block.links, { network: 'instagram', url: '' }] })}>Add link</Button>
          )}
          <AlignField value={block.align} onChange={v => set({ align: v })} />
          <p className="text-[11px] text-slate">Links without a URL are hidden in the email.</p>
        </div>
      );
    }
  }
}

// ── Global styles panel ──────────────────────────────────────────────────────

function StylesPanel({ styles, onChange }: { styles: EmailDesignStyles; onChange: (s: EmailDesignStyles) => void }) {
  const set = (patch: Partial<EmailDesignStyles>) => onChange({ ...styles, ...patch });
  return (
    <div className="flex flex-col gap-4">
      <Field label="Font">
        {id => (
          <select id={id} value={styles.fontFamily} onChange={e => set({ fontFamily: e.target.value })} className={`${INPUT} cursor-pointer`}>
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        )}
      </Field>
      <ColorField label="Page background" value={styles.background} onChange={v => set({ background: v })} />
      <ColorField label="Email background" value={styles.contentBackground} onChange={v => set({ contentBackground: v })} />
      <ColorField label="Text color" value={styles.textColor} onChange={v => set({ textColor: v })} />
      <ColorField label="Accent (buttons, links)" value={styles.accentColor} onChange={v => set({ accentColor: v })} />
      <RangeField label="Corner radius" value={styles.borderRadius} min={0} max={24} suffix="px" onChange={v => set({ borderRadius: v })} />
    </div>
  );
}

// ── The editor ───────────────────────────────────────────────────────────────

type Panel = 'content' | 'styles' | 'details';

/** Opens the same editor for one automation's email (welcome, back in
 *  stock, …) instead of a campaign: no template gallery or audience; saves
 *  and test-sends through the automation's own callbacks. */
export interface AutomationEditorConfig {
  title: string;
  subject: string;
  design: EmailDesign;
  mergeTags: string[];
  onSave: (p: { subject: string; design: EmailDesign; html: string }) => Promise<void>;
  onSendTest: (email: string | undefined) => Promise<string>;
}

/** Sample values for the tags only the server fills, so the canvas shows a
 *  realistic product instead of raw {{tags}}. */
function previewFill(html: string): string {
  return html
    .split('{{productImage}}').join('<div style="width:240px;max-width:100%;height:160px;margin:0 auto 12px;border-radius:6px;background:#ece9e2;display:flex;align-items:center;justify-content:center;color:#8b8985;font-size:12px">Product image</div>')
    .split('{{productName}}').join('Sample product')
    .split('{{priceLine}}').join('<span style="text-decoration:line-through;color:#8b8985">$59.00</span> &nbsp;<strong>$45.00</strong>');
}

/** Full-screen Shopify Email-style editor for a draft campaign: template
 *  gallery → drag-and-drop sections with live canvas → subject/audience →
 *  save draft / send test. */
export function EmailCampaignEditor({ storeId, store, campaign, onClose, onSaved, automation }: {
  storeId: string;
  store: StoreData | null;
  campaign: EmailCampaign | null;
  onClose: () => void;
  onSaved?: (c: EmailCampaign) => void;
  automation?: AutomationEditorConfig;
}) {
  const storeName = store?.name ?? 'Your store';
  const ctx = useMemo(() => ({ storeName, storeUrl: storeUrlFor(store) }), [storeName, store]);
  const existingDesign = campaign && isEmailDesign(campaign.design) ? campaign.design : null;

  const [choosingTemplate, setChoosingTemplate] = useState(!campaign && !automation);
  const [savedId, setSavedId] = useState<string | null>(campaign?._id ?? null);
  const [name, setName] = useState(automation?.title ?? campaign?.name ?? '');
  const [subject, setSubject] = useState(automation?.subject ?? campaign?.subject ?? '');
  const [audience, setAudience] = useState<EmailCampaignAudience>(campaign?.audience ?? 'all');
  const [segmentForm, setSegmentForm] = useState<SegmentForm>(fromSegment(campaign?.segment));
  const [design, setDesign] = useState<EmailDesign>(() => automation?.design ?? existingDesign ?? withLogo(defaultDesign(), store?.logo ?? null));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('content');
  const [addOpen, setAddOpen] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [recipients, setRecipients] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const segment = toSegment(segmentForm);
  const segmentKey = JSON.stringify(segment);
  const legacyHtml = campaign && !existingDesign ? campaign.message : null;

  useEffect(() => {
    if (automation) return;
    let cancelled = false;
    const t = setTimeout(() => {
      apiPreviewEmailCampaignSegment(storeId, audience, JSON.parse(segmentKey) as EmailCampaignSegment | null)
        .then(res => { if (!cancelled) setRecipients(res.data.recipientCount); })
        .catch(() => { if (!cancelled) setRecipients(null); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [storeId, audience, segmentKey, automation]);

  const touch = () => { setDirty(true); setNotice(null); };
  const updateDesign = (next: EmailDesign) => { setDesign(next); touch(); };
  const updateBlock = (b: EmailBlock) => updateDesign({ ...design, blocks: design.blocks.map(x => (x.id === b.id ? b : x)) });
  const selected = design.blocks.find(b => b.id === selectedId) ?? null;

  const addBlock = (type: EmailBlockType) => {
    const block = createBlock(type, design.styles);
    if (block.type === 'header' && store?.logo) block.logoUrl = store.logo;
    const at = selected ? design.blocks.findIndex(b => b.id === selected.id) + 1 : design.blocks.length;
    const blocks = [...design.blocks];
    blocks.splice(at, 0, block);
    updateDesign({ ...design, blocks });
    setSelectedId(block.id);
    setPanel('content');
    setAddOpen(false);
  };

  const removeBlock = (id: string) => {
    updateDesign({ ...design, blocks: design.blocks.filter(b => b.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateBlock = (id: string) => {
    const i = design.blocks.findIndex(b => b.id === id);
    if (i < 0) return;
    const copy = { ...structuredClone(design.blocks[i]), id: newBlockId() } as EmailBlock;
    const blocks = [...design.blocks];
    blocks.splice(i + 1, 0, copy);
    updateDesign({ ...design, blocks });
    setSelectedId(copy.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = design.blocks.findIndex(b => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= design.blocks.length) return;
    const blocks = [...design.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    updateDesign({ ...design, blocks });
  };

  const chooseTemplate = (id: string) => {
    const t = id === 'blank' ? { subject: '', design: defaultDesign() } : templateDesign(id, storeName);
    setDesign(withLogo(t.design, store?.logo ?? null));
    if (!subject) setSubject(t.subject);
    if (!name) setName(TEMPLATE_OPTIONS.find(o => o.id === id)?.label ?? 'New campaign');
    setChoosingTemplate(false);
    setDirty(true);
  };

  async function save(): Promise<string | null> {
    if (automation) {
      if (!subject.trim()) { setPanel('details'); setNotice({ ok: false, text: 'Add a subject line first.' }); return null; }
      if (design.blocks.length === 0) { setNotice({ ok: false, text: 'Add at least one section to the email.' }); return null; }
      setSaving(true);
      setNotice(null);
      try {
        await automation.onSave({ subject: subject.trim(), design, html: renderEmailDesign(design, ctx) });
        setDirty(false);
        setNotice({ ok: true, text: 'Saved' });
        return 'saved';
      } catch (err) {
        setNotice({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' });
        return null;
      } finally {
        setSaving(false);
      }
    }
    if (!name.trim() || !subject.trim()) {
      setPanel('details');
      setNotice({ ok: false, text: 'Add a campaign name and subject first.' });
      return null;
    }
    if (design.blocks.length === 0) {
      setNotice({ ok: false, text: 'Add at least one section to the email.' });
      return null;
    }
    setSaving(true);
    setNotice(null);
    const payload = { name: name.trim(), subject: subject.trim(), message: renderEmailDesign(design, ctx), audience, segment, design };
    try {
      const res = savedId ? await apiUpdateEmailCampaign(storeId, savedId, payload) : await apiCreateEmailCampaign(storeId, payload);
      setSavedId(res.data._id);
      setDirty(false);
      setNotice({ ok: true, text: 'Draft saved' });
      onSaved?.(res.data);
      return res.data._id;
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      if (automation) {
        if (dirty && !(await save())) return;
        setNotice({ ok: true, text: await automation.onSendTest(testEmail.trim() || undefined) });
        setTestOpen(false);
        return;
      }
      const id = dirty || !savedId ? await save() : savedId;
      if (!id) return;
      const res = await apiSendEmailCampaignTest(storeId, id, testEmail.trim() || undefined);
      setNotice({ ok: true, text: res.message || 'Test email sent' });
      setTestOpen(false);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Failed to send test.' });
    } finally {
      setTesting(false);
    }
  }

  const close = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    onClose();
  };

  // ── Template gallery (new campaigns only) ──
  if (choosingTemplate) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#f6f5f2] overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[18px] font-bold text-carbon">Choose a template</p>
              <p className="text-[12.5px] text-slate">Start from a design — you can change everything in the editor.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-bone cursor-pointer text-charcoal"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_OPTIONS.map(t => {
              const d = t.id === 'blank' ? defaultDesign() : templateDesign(t.id, storeName).design;
              return (
                <button key={t.id} type="button" onClick={() => chooseTemplate(t.id)}
                  className="text-left bg-white border border-bone rounded-xl overflow-hidden cursor-pointer hover:border-brand-orange/60 hover:shadow-md transition-shadow p-0">
                  <div className="h-[260px] overflow-hidden relative bg-[#f4f3ef] pointer-events-none">
                    <div className="origin-top-left scale-[0.5] w-[200%]" dangerouslySetInnerHTML={{ __html: renderEmailDesign(withLogo(d, store?.logo ?? null), ctx) }} />
                  </div>
                  <div className="px-4 py-3 border-t border-bone">
                    <p className="text-[13.5px] font-semibold text-carbon flex items-center gap-1.5"><LayoutTemplate size={14} /> {t.label}</p>
                    <p className="text-[11.5px] text-slate">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const canvasWidth = device === 'desktop' ? 600 : 375;

  return (
    <div className="fixed inset-0 z-[60] bg-[#f6f5f2] flex flex-col">
      {/* Top bar */}
      <div className="h-14 shrink-0 bg-white border-b border-bone px-3 sm:px-5 flex items-center gap-3">
        <button type="button" aria-label="Close editor" onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-charcoal hover:bg-mist"><X size={17} /></button>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-carbon truncate">{name || 'Untitled campaign'}</p>
          <p className="text-[11px] text-slate truncate">{dirty ? 'Unsaved changes' : automation ? 'Automation email' : savedId ? 'Draft saved' : 'Not saved yet'}</p>
        </div>
        {notice && <p className={`hidden md:block text-[12px] ${notice.ok ? 'text-success' : 'text-error'}`}>{notice.text}</p>}
        <div className="hidden sm:inline-flex border border-bone rounded-lg overflow-hidden">
          <button type="button" aria-label="Desktop preview" onClick={() => setDevice('desktop')} className={`px-2.5 py-1.5 border-none cursor-pointer ${device === 'desktop' ? 'bg-carbon text-white' : 'bg-white text-charcoal'}`}><Monitor size={14} /></button>
          <button type="button" aria-label="Mobile preview" onClick={() => setDevice('mobile')} className={`px-2.5 py-1.5 border-none cursor-pointer ${device === 'mobile' ? 'bg-carbon text-white' : 'bg-white text-charcoal'}`}><Smartphone size={14} /></button>
        </div>
        <Button size="sm" variant="outline" icon={<Send size={13} />} onClick={() => setTestOpen(o => !o)}>Test</Button>
        <Button size="sm" icon={<Save size={13} />} loading={saving} onClick={() => save()}>Save</Button>
      </div>

      {testOpen && (
        <div className="shrink-0 bg-white border-b border-bone px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-2">
          <p className="text-[12px] text-charcoal">Send a "[Test]" copy to</p>
          <input aria-label="Test email" type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your account email" className={`${INPUT} max-w-[260px] py-1.5`} />
          <Button size="xs" loading={testing} onClick={sendTest}>Send test</Button>
          <p className="text-[11px] text-slate">Saves the draft first.</p>
        </div>
      )}
      {notice && <p className={`md:hidden px-4 py-1.5 text-[12px] bg-white border-b border-bone ${notice.ok ? 'text-success' : 'text-error'}`}>{notice.text}</p>}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-[360px] shrink-0 bg-white md:border-r border-b md:border-b-0 border-bone flex flex-col min-h-0 max-h-[50vh] md:max-h-none">
          <div className="flex border-b border-bone shrink-0">
            {(['content', 'styles', 'details'] as Panel[]).map(p => (
              <button key={p} type="button" onClick={() => { setPanel(p); if (p !== 'content') setSelectedId(null); }}
                className={`flex-1 py-2.5 text-[12.5px] font-semibold capitalize bg-transparent border-none cursor-pointer ${panel === p ? 'text-brand-orange shadow-[inset_0_-2px_0_#D97757]' : 'text-slate'}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {panel === 'content' && selected && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Back to sections" onClick={() => setSelectedId(null)} className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-charcoal hover:bg-mist"><ChevronLeft size={16} /></button>
                  <p className="text-[13.5px] font-semibold text-carbon flex-1">{BLOCK_LABEL[selected.type]}</p>
                  <button type="button" aria-label="Duplicate section" onClick={() => duplicateBlock(selected.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-slate hover:bg-mist"><Copy size={14} /></button>
                  <button type="button" aria-label="Delete section" onClick={() => removeBlock(selected.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-slate hover:text-error hover:bg-mist"><Trash2 size={14} /></button>
                </div>
                <BlockSettings block={selected} storeId={storeId} onChange={updateBlock} />
              </div>
            )}

            {panel === 'content' && !selected && (
              <div className="flex flex-col gap-3">
                {legacyHtml && (
                  <p className="text-[11.5px] text-warning bg-warning-bg rounded-md px-3 py-2">
                    This draft was written before the editor existed. Saving replaces its old HTML with the design below.
                  </p>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate">Sections — drag to reorder</p>
                {design.blocks.length === 0 && <p className="text-[12px] text-slate">No sections yet — add one below.</p>}
                <SortableList items={design.blocks} keyFor={b => b.id} onReorder={blocks => updateDesign({ ...design, blocks })}>
                  {b => {
                    const Icon = BLOCK_ICON[b.type];
                    return (
                      <button type="button" onClick={() => setSelectedId(b.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-bone bg-white text-left cursor-pointer hover:border-brand-orange/50">
                        <Icon size={15} className="text-slate shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium text-carbon">{BLOCK_LABEL[b.type]}</span>
                          {blockSummary(b) && <span className="block text-[11px] text-slate truncate">{blockSummary(b)}</span>}
                        </span>
                      </button>
                    );
                  }}
                </SortableList>

                <div className="relative">
                  <Button size="sm" variant="outline" fullWidth icon={<Plus size={14} />} onClick={() => setAddOpen(o => !o)}>Add section</Button>
                  {addOpen && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {BLOCK_LIBRARY.filter(item => automation || !AUTOMATION_ONLY_BLOCKS.includes(item.type)).map(item => {
                        const Icon = BLOCK_ICON[item.type];
                        return (
                          <button key={item.type} type="button" onClick={() => addBlock(item.type)}
                            className="flex flex-col items-start gap-1 p-2.5 rounded-lg border border-bone bg-white text-left cursor-pointer hover:border-brand-orange/50">
                            <Icon size={15} className="text-brand-orange" />
                            <span className="text-[12px] font-semibold text-carbon">{item.label}</span>
                            <span className="text-[10.5px] text-slate leading-tight">{item.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {panel === 'styles' && <StylesPanel styles={design.styles} onChange={styles => updateDesign({ ...design, styles })} />}

            {panel === 'details' && automation && (
              <div className="flex flex-col gap-4">
                <Field label="Subject line">{id => <input id={id} value={subject} maxLength={200} onChange={e => { setSubject(e.target.value); touch(); }} className={INPUT} />}</Field>
                <Field label="Preview text" hint="Shown after the subject in most inboxes.">
                  {id => <input id={id} value={design.previewText} maxLength={150} onChange={e => updateDesign({ ...design, previewText: e.target.value })} className={INPUT} />}
                </Field>
                <div>
                  <p className="text-[12px] font-medium text-charcoal mb-1.5">Merge tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {automation.mergeTags.map(t => <code key={t} className="px-2 py-0.5 rounded bg-mist text-[11.5px] text-charcoal">{t}</code>)}
                  </div>
                  <p className="text-[11px] text-slate mt-1.5">Use them in the subject, text and button links (e.g. a button linking to {'{{shopUrl}}'}). They're filled in for each shopper.</p>
                </div>
              </div>
            )}

            {panel === 'details' && !automation && (
              <div className="flex flex-col gap-4">
                <Field label="Campaign name (internal only)">{id => <input id={id} value={name} onChange={e => { setName(e.target.value); touch(); }} placeholder="September sale" className={INPUT} />}</Field>
                <Field label="Subject line">{id => <input id={id} value={subject} maxLength={200} onChange={e => { setSubject(e.target.value); touch(); }} placeholder="20% off everything this weekend" className={INPUT} />}</Field>
                <Field label="Preview text" hint="Shown after the subject in most inboxes.">
                  {id => <input id={id} value={design.previewText} maxLength={150} onChange={e => updateDesign({ ...design, previewText: e.target.value })} placeholder="Don't miss out — ends Sunday." className={INPUT} />}
                </Field>
                <Field label="Send to">
                  {id => (
                    <select id={id} value={audience} onChange={e => { setAudience(e.target.value as EmailCampaignAudience); touch(); }} className={`${INPUT} cursor-pointer`}>
                      <option value="all">All email subscribers</option>
                      <option value="buyers">Subscribers who have ordered</option>
                      <option value="abandoned">Subscribers with an abandoned cart</option>
                    </select>
                  )}
                </Field>
                <div className="p-3 rounded-lg border border-bone bg-[#faf9f6] flex flex-col gap-3">
                  <p className="text-[12px] font-semibold text-carbon">Refine audience (optional)</p>
                  {([
                    ['minOrders', 'Minimum orders', 'e.g. 2'],
                    ['minTotalSpent', 'Minimum total spent', 'e.g. 100'],
                    ['orderedWithinDays', 'Ordered in the last (days)', 'e.g. 30'],
                    ['notOrderedWithinDays', "Haven't ordered in (days)", 'e.g. 90'],
                  ] as [keyof SegmentForm, string, string][]).map(([key, label, ph]) => (
                    <Field key={key} label={label}>
                      {id => <input id={id} type="number" min={0} value={segmentForm[key]} placeholder={ph} onChange={e => { setSegmentForm(s => ({ ...s, [key]: e.target.value })); touch(); }} className={INPUT} />}
                    </Field>
                  ))}
                  <Field label="Customer tags (comma separated)">
                    {id => <input id={id} value={segmentForm.tags} placeholder="vip, wholesale" onChange={e => { setSegmentForm(s => ({ ...s, tags: e.target.value })); touch(); }} className={INPUT} />}
                  </Field>
                </div>
                <p className="text-[12px] text-charcoal">
                  {recipients === null ? 'Counting recipients…' : <>~<span className="font-semibold">{recipients.toLocaleString()}</span> subscriber{recipients === 1 ? '' : 's'} will get this email.</>}
                </p>
                <p className="text-[11px] text-slate">Only people who opted in to your marketing emails receive campaigns. An unsubscribe link is added automatically.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 min-h-0 overflow-y-auto" style={{ background: design.styles.background }}>
          <div className="mx-auto my-6 px-3" style={{ maxWidth: canvasWidth + 24 }}>
            <div className="mb-3 px-1">
              <p className="text-[11px] text-slate">Subject</p>
              <p className="text-[13px] font-semibold text-carbon truncate">{subject || '—'}</p>
              {design.previewText && <p className="text-[11.5px] text-slate truncate">{design.previewText}</p>}
            </div>
            <div className="rounded-lg overflow-hidden shadow-sm" style={{ background: design.styles.contentBackground, fontFamily: design.styles.fontFamily }}>
              {design.blocks.map((b, i) => {
                const active = b.id === selectedId;
                return (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit ${BLOCK_LABEL[b.type]} section`}
                    onClick={e => { e.stopPropagation(); setSelectedId(b.id); setPanel('content'); }}
                    onKeyDown={e => { if (e.key === 'Enter') { setSelectedId(b.id); setPanel('content'); } }}
                    className={`relative group cursor-pointer outline-none ${active ? 'ring-2 ring-brand-orange ring-inset' : 'hover:ring-1 hover:ring-brand-orange/50 hover:ring-inset'}`}
                  >
                    <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: previewFill(renderBlockStandalone(b, design, ctx) || '') }} />
                    {emptyHint(b) && <p className="pointer-events-none px-8 py-6 text-center text-[12px] text-slate border border-dashed border-bone m-3 rounded-md">{emptyHint(b)}</p>}
                    <div className={`absolute top-1.5 right-1.5 gap-1 ${active ? 'flex' : 'hidden group-hover:flex'}`}>
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={e => { e.stopPropagation(); moveBlock(b.id, -1); }} className="w-6 h-6 flex items-center justify-center rounded bg-white/95 border border-bone cursor-pointer disabled:opacity-40"><ArrowUp size={12} /></button>
                      <button type="button" aria-label="Move down" disabled={i === design.blocks.length - 1} onClick={e => { e.stopPropagation(); moveBlock(b.id, 1); }} className="w-6 h-6 flex items-center justify-center rounded bg-white/95 border border-bone cursor-pointer disabled:opacity-40"><ArrowDown size={12} /></button>
                      <button type="button" aria-label="Delete section" onClick={e => { e.stopPropagation(); removeBlock(b.id); }} className="w-6 h-6 flex items-center justify-center rounded bg-white/95 border border-bone cursor-pointer text-error"><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
              <div className="px-6 py-5 text-center text-[11.5px] text-slate border-t border-bone">
                You're receiving this because you subscribed to emails from {storeName}.<br /><u>Unsubscribe</u>
                <p className="mt-1 text-[10.5px]">(added automatically)</p>
              </div>
            </div>
            <div className="flex justify-center my-4">
              <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={e => { e.stopPropagation(); setSelectedId(null); setPanel('content'); setAddOpen(true); }}>Add section</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function emptyHint(b: EmailBlock): string | null {
  if (b.type === 'image' && !b.url) return 'Choose an image';
  if (b.type === 'products' && b.items.length === 0) return 'Pick products to show';
  if (b.type === 'imageText' && !b.url && !b.html) return 'Add an image and text';
  if (b.type === 'social' && !b.links.some(l => l.url.trim())) return 'Add your social profile links';
  return null;
}

function withLogo(design: EmailDesign, logo: string | null): EmailDesign {
  if (!logo) return design;
  return { ...design, blocks: design.blocks.map(b => (b.type === 'header' && !b.logoUrl ? { ...b, logoUrl: logo } : b)) };
}
