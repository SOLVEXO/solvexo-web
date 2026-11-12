import { useEffect, useState } from 'react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { apiClearSpamProtection, apiGetSpamProtection, apiSaveSpamProtection, type SpamProtection } from '@/api/services/storeContact';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

/** Contact Messages -> Spam protection: the store's own free Cloudflare Turnstile keys (the CAPTCHA a form can switch on). */
export function SpamProtectionModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const toast = useToast();
  const [state, setState] = useState<SpamProtection | null>(null);
  const [loadError, setLoadError] = useState('');
  const [siteKey, setSiteKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetSpamProtection(storeId)
      .then(res => { if (!cancelled) { setState(res.data); setSiteKey(res.data.turnstile.siteKey); } })
      .catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load the settings.'); });
    return () => { cancelled = true; };
  }, [storeId]);

  async function save() {
    setSaving(true); setError('');
    try {
      const res = await apiSaveSpamProtection(storeId, { siteKey: siteKey.trim(), secretKey: secretKey.trim() });
      setState(res.data); setSecretKey('');
      toast.success('CAPTCHA keys saved. Switch it on in the form (Customize → the form section).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The keys could not be saved.');
    } finally { setSaving(false); }
  }

  async function remove() {
    setSaving(true); setError('');
    try {
      const res = await apiClearSpamProtection(storeId);
      setState(res.data); setSiteKey(''); setSecretKey('');
      toast.success('CAPTCHA keys removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The keys could not be removed.');
    } finally { setSaving(false); }
  }

  const configured = !!state?.turnstile.configured;
  return (
    <Modal
      title="Spam protection" onClose={onClose} width={520}
      footer={(
        <>
          {configured && <Button variant="outline" onClick={() => void remove()} disabled={saving}>Remove keys</Button>}
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => void save()} loading={saving} disabled={!siteKey.trim() || !secretKey.trim()}>{configured ? 'Replace keys' : 'Save keys'}</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-3 text-[13px] text-charcoal">
        <p className="m-0">Every form already has a hidden trap and a limit on how fast one person can send. For more protection a form can ask visitors to pass a <strong>Cloudflare Turnstile</strong> check (free, no pictures to click).</p>
        <ol className="m-0 list-decimal pl-5 text-[12px] text-slate leading-relaxed">
          <li>Open the Cloudflare dashboard → Turnstile → Add widget, and add your store address.</li>
          <li>Copy the <strong>Site Key</strong> and the <strong>Secret Key</strong> into the boxes below.</li>
          <li>In Customize, open the form section and switch on “Protect with a CAPTCHA”.</li>
        </ol>
        {loadError && <p role="alert" className="m-0 text-error">{loadError}</p>}
        <p className={`m-0 rounded-lg px-3 py-2 text-[12px] ${configured ? 'bg-success-bg text-success' : 'bg-cream text-slate'}`}>{configured ? 'Keys are saved. Forms with the CAPTCHA switched on use them.' : 'No keys saved yet.'}</p>
        <div>
          <label htmlFor="ts-site" className="mb-1 block text-[12px] font-medium">Site Key</label>
          <input id="ts-site" className={inp} value={siteKey} onChange={e => setSiteKey(e.target.value)} placeholder="0x4AAAAAAA…" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="ts-secret" className="mb-1 block text-[12px] font-medium">Secret Key</label>
          <input id="ts-secret" type="password" className={inp} value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder={configured ? 'Saved (paste a new one to replace it)' : 'Paste the secret key'} autoComplete="new-password" />
          <p className="m-0 mt-1 text-[11px] text-slate">We check the key with Cloudflare before saving it, and never show it again.</p>
        </div>
        {error && <p role="alert" className="m-0 text-error">{error}</p>}
      </div>
    </Modal>
  );
}
