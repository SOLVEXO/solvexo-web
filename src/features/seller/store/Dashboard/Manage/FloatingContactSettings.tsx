import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { ChromeItemsEditor } from '@/features/seller/store/Dashboard/OnlineStore/themes/ChromeItemsEditor';
import { Button, Select, ColorField } from '@/components/comman/ui';
import { Toggle } from '@/components/comman/ui/Toggle';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, type FloatingContactConfig } from '@/api/services/store';

const EMPTY: FloatingContactConfig = {
  enabled: false, position: 'right', vertical: 'middle', size: 'md', style: 'brand', showLabels: true, labelMode: 'hover', device: 'all',
  phone: '', phoneLabel: '', whatsapp: '', whatsappMessage: '', whatsappLabel: '', email: '', emailLabel: '',
  facebook: '', instagram: '', tiktok: '', youtube: '', x: '', snapchat: '', linkedin: '',
  items: [], shape: 'flush', bubbleText: '', customBg: '', customFg: '', sizePx: 0, edgeOffset: 0, bottomOffset: 0, gapPx: -1,
};

/** The nine screen positions, in reading order (3 rows x 3 columns). */
const POSITIONS: { position: FloatingContactConfig['position']; vertical: FloatingContactConfig['vertical']; label: string }[] = [
  { position: 'left', vertical: 'top', label: 'Top left' },
  { position: 'center', vertical: 'top', label: 'Top centre' },
  { position: 'right', vertical: 'top', label: 'Top right' },
  { position: 'left', vertical: 'middle', label: 'Middle left' },
  { position: 'center', vertical: 'middle', label: 'Centre' },
  { position: 'right', vertical: 'middle', label: 'Middle right' },
  { position: 'left', vertical: 'bottom', label: 'Bottom left' },
  { position: 'center', vertical: 'bottom', label: 'Bottom centre' },
  { position: 'right', vertical: 'bottom', label: 'Bottom right' },
];

const PREVIEW_SIZE = { sm: 26, md: 30, lg: 34 } as const;

/** Small mock of the storefront, so the seller sees the position/look before saving. */
function PreviewBox({ cfg }: { cfg: FloatingContactConfig }) {
  const size = cfg.sizePx > 0 ? cfg.sizePx : PREVIEW_SIZE[cfg.size] ?? 30;
  const round = cfg.shape === 'round';
  const bg = cfg.customBg || '#25D366';
  const fg = cfg.customFg || '#ffffff';
  const gap = cfg.gapPx >= 0 ? cfg.gapPx : round ? 8 : 2;
  const edge = Math.min(28, Math.max(0, cfg.edgeOffset || 0) / 4);
  const lift = Math.min(28, Math.max(0, cfg.bottomOffset || 0) / 4);
  const sideStyle: CSSProperties = cfg.position === 'left' ? { left: 10 + edge } : { right: 10 + edge };
  const verticalStyle: CSSProperties = cfg.vertical === 'top' ? { top: 12 }
    : cfg.vertical === 'bottom' ? { bottom: 12 + lift }
    : { top: '50%', marginTop: -size * 1.5 };
  const style: CSSProperties = cfg.position === 'center'
    ? { left: '50%', transform: 'translateX(-50%)', ...verticalStyle }
    : { ...sideStyle, ...verticalStyle };
  const dots = [0, 1, 2].slice(0, cfg.whatsapp || cfg.phone || cfg.email ? 3 : 1);
  return (
    <div className="relative h-[188px] overflow-hidden rounded-xl border border-slate-200 bg-[#faf9f7]">
      <div className="absolute inset-x-0 top-0 h-6 border-b border-slate-200 bg-white" />
      <div className="absolute inset-x-3 top-9 h-10 rounded-lg bg-white/70" />
      <div className="absolute inset-x-3 top-24 h-10 rounded-lg bg-white/50" />
      <span className="absolute bottom-1 end-2 text-[10px] uppercase tracking-wide text-slate">Preview</span>
      <div className="absolute flex flex-col" style={{ ...style, gap }}>
        {dots.map(i => (
          <span key={i} className="grid place-items-center text-[11px] font-semibold"
            style={{ width: size, height: size, background: bg, color: fg, borderRadius: round ? 999 : 6, boxShadow: round ? '0 4px 10px rgba(0,0,0,.25)' : 'none' }}>
            {i === 1 ? 'W' : i === 2 ? 'P' : '@'}
          </span>
        ))}
      </div>
    </div>
  );
}

const INPUT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand-orange';

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
      {children(id)}
      {hint && <p className="text-[12px] text-slate">{hint}</p>}
    </div>
  );
}

function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      {id => (
        <Select id={id} value={value} onChange={e => onChange(e.target.value as T)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      )}
    </Field>
  );
}

/** Settings → Floating contact bar: call / WhatsApp / social icons pinned to the screen edge of every storefront theme. */
export function FloatingContactSettings({ canManage, compact = false }: { canManage: boolean; compact?: boolean }) {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const toast = useToast();
  const [cfg, setCfg] = useState<FloatingContactConfig>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = (store as { floatingContact?: Partial<FloatingContactConfig> | null } | null)?.floatingContact;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the store arrives asynchronously, so the form has to follow it
    setCfg({ ...EMPTY, ...(saved ?? {}) });
  }, [store]);

  if (loading) return null;
  const card = compact ? 'border-b border-slate-100 pb-4 last:border-0' : 'rounded-2xl border border-slate-200 bg-white p-5';
  const set = <K extends keyof FloatingContactConfig>(k: K, v: FloatingContactConfig[K]) => setCfg(c => ({ ...c, [k]: v }));
  const text = (k: keyof FloatingContactConfig, label: string, hint?: string, placeholder?: string, type = 'text') => (
    <Field label={label} hint={hint}>
      {id => <input id={id} type={type} className={INPUT} value={String(cfg[k] ?? '')} placeholder={placeholder} disabled={!canManage}
        onChange={e => set(k, e.target.value as never)} />}
    </Field>
  );

  const save = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    try {
      await apiUpdateStore({ storeId, floatingContact: cfg });
      refetch();
      toast.success('Floating contact bar saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the floating contact bar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Floating contact bar</h2>
            <p className="mt-1 text-[13px] text-slate">Call, WhatsApp and social icons that stay on the side of every page of your store, in every theme. Pick one of nine screen positions and check it in the preview; an icon can open its name on hover, always, or never.</p>
          </div>
          <Toggle checked={cfg.enabled} onChange={v => set('enabled', v)} disabled={!canManage} ariaLabel="Show the floating contact bar" />
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-[14px] font-semibold text-ink">Contact</h3>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {text('phone', 'Phone number', 'Opens the phone dialer. Leave empty to hide the icon.', '+92 300 1234567', 'tel')}
          {text('phoneLabel', 'Phone hover text', 'Shown when the icon is hovered. Default: Call us.')}
          {text('whatsapp', 'WhatsApp number', 'With the country code, e.g. 923001234567. If your footer social icons also show WhatsApp, the customer sees two buttons — keep one.', '+92 300 1234567', 'tel')}
          {text('whatsappLabel', 'WhatsApp hover text', 'Default: Chat on WhatsApp.')}
          <div className="sm:col-span-full">
            <Field label="WhatsApp first message" hint="Pre-filled in the customer's chat. Write your own, or leave empty.">
              {id => <textarea id={id} rows={2} maxLength={300} className={INPUT} value={cfg.whatsappMessage} disabled={!canManage}
                onChange={e => set('whatsappMessage', e.target.value)} placeholder="Hi, I am interested in..." />}
            </Field>
          </div>
          {text('email', 'Email', 'Opens the customer\'s email app.', 'hello@yourstore.com', 'email')}
          {text('emailLabel', 'Email hover text', 'Default: Email us.')}
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-[14px] font-semibold text-ink">Social links</h3>
        <p className="mb-3 text-[12px] text-slate">Full links starting with https://. Empty ones are not shown.</p>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {text('facebook', 'Facebook', undefined, 'https://facebook.com/yourpage')}
          {text('instagram', 'Instagram', undefined, 'https://instagram.com/yourhandle')}
          {text('tiktok', 'TikTok', undefined, 'https://tiktok.com/@yourhandle')}
          {text('youtube', 'YouTube', undefined, 'https://youtube.com/@yourchannel')}
          {text('x', 'X (Twitter)', undefined, 'https://x.com/yourhandle')}
          {text('linkedin', 'LinkedIn', undefined, 'https://linkedin.com/company/yourcompany')}
          {text('snapchat', 'Snapchat', undefined, 'https://snapchat.com/add/yourhandle')}
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-[14px] font-semibold text-ink">Look</h3>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-medium text-ink">Position on the screen</span>
            <div className="grid w-[132px] grid-cols-3 gap-1 rounded-lg border border-slate-200 p-1">
              {POSITIONS.map(p => {
                const on = cfg.position === p.position && cfg.vertical === p.vertical;
                return (
                  <button key={p.label} type="button" title={p.label} aria-label={p.label} aria-pressed={on} disabled={!canManage}
                    onClick={() => setCfg(c => ({ ...c, position: p.position, vertical: p.vertical }))}
                    className={`h-8 rounded-md border text-[10px] font-medium transition ${on ? 'border-brand-orange bg-brand-orange/10 text-ink' : 'border-transparent bg-slate-50 text-slate hover:bg-slate-100'}`}>
                    {p.label.split(' ')[0] === 'Middle' ? 'Mid' : p.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-slate">{POSITIONS.find(p => p.position === cfg.position && p.vertical === cfg.vertical)?.label ?? 'Middle right'}</p>
          </div>
          <Pick label="Icon size" value={cfg.size} onChange={v => set('size', v)} options={[{ value: 'sm', label: 'Small (40px)' }, { value: 'md', label: 'Medium (48px)' }, { value: 'lg', label: 'Large (56px)' }]} />
          <Pick label="Colours" value={cfg.style} onChange={v => set('style', v)} options={[{ value: 'brand', label: 'Each brand\'s own colour' }, { value: 'theme', label: 'My store\'s brand colour' }]} />
          <Pick label="Show on" value={cfg.device} onChange={v => set('device', v)} options={[{ value: 'all', label: 'All screens' }, { value: 'desktop', label: 'Desktop and tablet only' }, { value: 'mobile', label: 'Phones only' }]} />
          <Pick label="Icon names" value={cfg.labelMode ?? (cfg.showLabels ? 'hover' : 'none')} onChange={v => setCfg(c => ({ ...c, labelMode: v, showLabels: v !== 'none' }))}
            options={[{ value: 'hover', label: 'Slide open on hover' }, { value: 'always', label: 'Always beside the icon' }, { value: 'none', label: 'Icons only' }]} />
          <div className="flex items-end">
            <PreviewBox cfg={cfg} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          <Pick label="Button shape" value={cfg.shape} onChange={v => set('shape', v)} options={[{ value: 'flush', label: 'Tabs on the screen edge' }, { value: 'round', label: 'Round buttons in the corner' }]} />
          {text('bubbleText', 'Speech bubble text', 'Shown next to the buttons, e.g. "Need help? Chat with us". Leave empty for none.', 'Need help? Chat with us')}
          <Field label="Button colour (all)" hint="Leave empty to use the colours above.">
            {id => <ColorField compact id={id} value={cfg.customBg || '#25D366'} disabled={!canManage} onChange={e => set('customBg', e.target.value)} />}
          </Field>
          <Field label="Icon colour (all)">
            {id => <ColorField compact id={id} value={cfg.customFg || '#ffffff'} disabled={!canManage} onChange={e => set('customFg', e.target.value)} />}
          </Field>
        </div>
        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          {([
            ['sizePx', 'Exact button size (px)', 'Empty = the size chosen above.', 0, 24, 140],
            ['edgeOffset', 'Distance from the screen edge (px)', 'Moves the buttons away from the edge.', 0, 0, 200],
            ['bottomOffset', 'Extra lift from the bottom (px)', 'Use it when a sticky Add to cart bar would cover the buttons.', 0, 0, 200],
            ['gapPx', 'Space between buttons (px)', 'Empty = automatic.', -1, 0, 80],
          ] as const).map(([k, label, hint, empty, min, max]) => (
            <Field key={k} label={label} hint={hint}>
              {id => <input id={id} type="number" min={min} max={max} className={INPUT} placeholder="Auto" disabled={!canManage}
                value={cfg[k] === empty ? '' : cfg[k]}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw.trim() === '') { set(k, empty); return; }
                  const n = Number(raw);
                  if (Number.isFinite(n)) set(k, Math.min(max, Math.max(min, Math.round(n))));
                }} />}
            </Field>
          ))}
        </div>
        {(cfg.customBg || cfg.customFg) && (
          <button type="button" onClick={() => { set('customBg', ''); set('customFg', ''); }} className="mt-2 border-0 bg-transparent p-0 text-[12px] text-slate underline cursor-pointer">Reset colours</button>
        )}
        <p className="mt-3 text-[12px] text-slate">The bar uses your theme's font and button shape. It is hidden on checkout and sign-in pages.</p>
      </section>

      <section className={card}>
        <h3 className="mb-1 text-[14px] font-semibold text-ink">Your own buttons</h3>
        <p className="mb-3 text-[12px] text-slate">Add any button you like: a link to any page or app (Telegram, Maps, a form), or a popup with your text, image and your own designed QR code. Pick any icon or upload yours.</p>
        <ChromeItemsEditor items={cfg.items} onChange={next => set('items', next)} showZone={false} itemName="button" compactColours />
      </section>

      {canManage && (
        <div className="sticky bottom-3 flex justify-end">
          <Button onClick={save} loading={saving} disabled={saving}>Save</Button>
        </div>
      )}
    </div>
  );
}
