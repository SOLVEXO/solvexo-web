import { useState } from 'react';
import { Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { apiUpdateStore } from '@/api/services/store';

type Branding = { logoUrl: string | null; accentColor: string | null; footerLinks: { label: string; url: string }[] };

/** Checkout branding: logo, accent colour and footer links shown on the checkout of every theme. */
export default function CheckoutBrandingCard({ storeId, initial, canManage }: { storeId: string; initial: Branding | null; canManage: boolean }) {
  const toast = useToast();
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? '');
  const [accent, setAccent] = useState(initial?.accentColor ?? '');
  const [links, setLinks] = useState<{ label: string; url: string }[]>(initial?.footerLinks ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      await apiUpdateStore({ storeId, checkoutBranding: { logoUrl: logoUrl.trim() || null, accentColor: accent.trim() || null, footerLinks: links.filter((l) => l.label.trim() || l.url.trim()) } });
      toast.success('Checkout branding saved');
    } catch (e: unknown) { setError(e instanceof Error && e.message ? e.message : 'Could not save.'); } finally { setSaving(false); }
  };
  const setLink = (i: number, p: Partial<{ label: string; url: string }>) => setLinks((l) => l.map((x, k) => (k === i ? { ...x, ...p } : x)));

  return (
    <section aria-label="Checkout branding" className="flex flex-col gap-4 max-w-[640px]">
      <p className="text-[12.5px] text-slate m-0">Shown at the top and bottom of the checkout page in every theme. Leave everything empty to keep your theme as it is.</p>
      <Input label="Logo (https image address)" value={logoUrl} maxLength={500} disabled={!canManage} onChange={(e) => setLogoUrl(e.target.value)} />
      <div className="flex items-end gap-3">
        <Input label="Accent colour (#rrggbb)" value={accent} maxLength={7} disabled={!canManage} onChange={(e) => setAccent(e.target.value)} />
        <input type="color" aria-label="Pick accent colour" disabled={!canManage} className="h-10 w-12 cursor-pointer rounded border border-border-soft" value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#000000'} onChange={(e) => setAccent(e.target.value)} />
      </div>
      <p className="text-[12px] text-slate m-0 -mt-2">The accent colours links, checkboxes and focus rings on the checkout. Buttons keep the theme's own colour.</p>
      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="text-[13px] font-medium text-charcoal mb-1">Footer links (up to 5)</legend>
        {links.map((l, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input aria-label="Link label" placeholder="Label" className="h-9 w-40 rounded-lg border border-border-soft px-2 text-[13px]" value={l.label} maxLength={40} disabled={!canManage} onChange={(e) => setLink(i, { label: e.target.value })} />
            <input aria-label="Link address" placeholder="https://… or /policies/refund" className="h-9 min-w-0 flex-1 rounded-lg border border-border-soft px-2 text-[13px]" value={l.url} maxLength={300} disabled={!canManage} onChange={(e) => setLink(i, { url: e.target.value })} />
            {canManage && <Button size="sm" variant="outline" onClick={() => setLinks((x) => x.filter((_, k) => k !== i))}>Remove</Button>}
          </div>
        ))}
        {canManage && links.length < 5 && <Button size="sm" variant="secondary" className="w-fit" onClick={() => setLinks((x) => [...x, { label: '', url: '' }])}>Add link</Button>}
      </fieldset>
      {error && <p role="alert" className="text-[12.5px] text-error m-0">{error}</p>}
      {canManage && <Button className="w-fit" onClick={save} loading={saving}>Save branding</Button>}
    </section>
  );
}
