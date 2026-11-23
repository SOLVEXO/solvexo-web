import { useEffect, useId, useState, type ReactNode } from 'react';
import { ChromeItemsEditor } from '@/features/seller/store/Dashboard/OnlineStore/themes/ChromeItemsEditor';
import { Button } from '@/components/comman/ui';
import { Toggle } from '@/components/comman/ui/Toggle';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, type FloatingContactConfig } from '@/api/services/store';

const EMPTY: FloatingContactConfig = {
  enabled: false, position: 'right', vertical: 'middle', size: 'md', style: 'brand', showLabels: true, device: 'all',
  phone: '', phoneLabel: '', whatsapp: '', whatsappMessage: '', whatsappLabel: '', email: '', emailLabel: '',
  facebook: '', instagram: '', tiktok: '', youtube: '', x: '', snapchat: '', linkedin: '',
  items: [], shape: 'flush', bubbleText: '', customBg: '', customFg: '',
};

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
        <select id={id} className={INPUT} value={value} onChange={e => onChange(e.target.value as T)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
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
            <p className="mt-1 text-[13px] text-slate">Call, WhatsApp and social icons that stay on the side of every page of your store, in every theme. A hovered icon slides open to show its name.</p>
          </div>
          <Toggle checked={cfg.enabled} onChange={v => set('enabled', v)} disabled={!canManage} ariaLabel="Show the floating contact bar" />
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-[14px] font-semibold text-ink">Contact</h3>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {text('phone', 'Phone number', 'Opens the phone dialer. Leave empty to hide the icon.', '+92 300 1234567', 'tel')}
          {text('phoneLabel', 'Phone hover text', 'Shown when the icon is hovered. Default: Call us.')}
          {text('whatsapp', 'WhatsApp number', 'With the country code, e.g. 923001234567.', '+92 300 1234567', 'tel')}
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
          <Pick label="Side of the screen" value={cfg.position} onChange={v => set('position', v)} options={[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }]} />
          <Pick label="Height on the screen" value={cfg.vertical} onChange={v => set('vertical', v)} options={[{ value: 'top', label: 'Near the top' }, { value: 'middle', label: 'Middle' }, { value: 'bottom', label: 'Near the bottom' }]} />
          <Pick label="Icon size" value={cfg.size} onChange={v => set('size', v)} options={[{ value: 'sm', label: 'Small (40px)' }, { value: 'md', label: 'Medium (48px)' }, { value: 'lg', label: 'Large (56px)' }]} />
          <Pick label="Colours" value={cfg.style} onChange={v => set('style', v)} options={[{ value: 'brand', label: 'Each brand\'s own colour' }, { value: 'theme', label: 'My store\'s brand colour' }]} />
          <Pick label="Show on" value={cfg.device} onChange={v => set('device', v)} options={[{ value: 'all', label: 'All screens' }, { value: 'desktop', label: 'Desktop and tablet only' }, { value: 'mobile', label: 'Phones only' }]} />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-[13px] font-medium text-ink">Open names on hover</span>
            <Toggle checked={cfg.showLabels} onChange={v => set('showLabels', v)} disabled={!canManage} ariaLabel="Open names on hover" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          <Pick label="Button shape" value={cfg.shape} onChange={v => set('shape', v)} options={[{ value: 'flush', label: 'Tabs on the screen edge' }, { value: 'round', label: 'Round buttons in the corner' }]} />
          {text('bubbleText', 'Speech bubble text', 'Shown next to the buttons, e.g. "Need help? Chat with us". Leave empty for none.', 'Need help? Chat with us')}
          <Field label="Button colour (all)" hint="Leave empty to use the colours above.">
            {id => <input id={id} type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white" value={cfg.customBg || '#25D366'} disabled={!canManage} onChange={e => set('customBg', e.target.value)} />}
          </Field>
          <Field label="Icon colour (all)">
            {id => <input id={id} type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white" value={cfg.customFg || '#ffffff'} disabled={!canManage} onChange={e => set('customFg', e.target.value)} />}
          </Field>
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
