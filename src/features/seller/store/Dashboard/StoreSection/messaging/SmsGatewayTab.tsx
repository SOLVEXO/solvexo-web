import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { apiEnableSmsGateway, apiSaveSmsGateway, apiSmsWebhookSecret, apiTestSmsGateway, type SmsGateway } from '@/api/services/marketingMessaging';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Input, Select } from '@/components/comman/ui';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';

const API_ORIGIN = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const BLANK = { presetKey: '', senderId: '', dailyLimit: '1000', secret: '', url: '', method: 'POST', contentType: 'json', headers: '{\n  "Authorization": "Bearer {{secret}}"\n}', body: '{"to":"{{to}}","text":"{{text}}","from":"{{sender}}"}', successMatch: '', messageIdPath: '' };

/** Your own SMS provider, described once. It stays off until a real test message to your phone succeeds. */
export function SmsGatewayTab({ storeId }: { storeId: string }) {
  const toast = useToast();
  const gw = useApi<SmsGateway>(`/api/messaging/${storeId}/sms-gateway`);
  const [f, setF] = useState(BLANK);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [hook, setHook] = useState<{ inboundPath: string; deliveryPath: string } | null>(null);

  // Fill the form once per loaded gateway (form state mirrors the server copy).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const d = gw.data;
    if (!d || loadedFor === (d.http?.url ?? '') + (d.senderId ?? '')) return;
    if (d.http) setF({ presetKey: d.presetKey ?? '', senderId: d.senderId ?? '', dailyLimit: String(d.dailyLimit ?? 1000), secret: '', url: d.http.url, method: d.http.method, contentType: d.http.contentType, headers: JSON.stringify(d.http.headers ?? {}, null, 2), body: d.http.body, successMatch: d.http.successMatch ?? '', messageIdPath: d.http.messageIdPath ?? '' });
    setLoadedFor((d.http?.url ?? '') + (d.senderId ?? ''));
  }, [gw.data, loadedFor]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => { setBusy(key); try { await fn(); toast.success(ok); gw.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); } };

  function save() {
    let headers: Record<string, string>;
    try { headers = JSON.parse(f.headers || '{}'); } catch { toast.error('Headers must be valid JSON, like {"Authorization": "Bearer {{secret}}"}'); return; }
    void run('save', () => apiSaveSmsGateway(storeId, {
      presetKey: f.presetKey || null, senderId: f.senderId.trim(), dailyLimit: Number(f.dailyLimit) || 1000, ...(f.secret ? { secret: f.secret } : {}),
      http: { url: f.url.trim(), method: f.method as 'GET' | 'POST', contentType: f.contentType as 'json' | 'form', headers, body: f.body, successMatch: f.successMatch.trim() || null, messageIdPath: f.messageIdPath.trim() || null },
    }), 'Saved. The gateway is switched off until you test it.');
  }

  if (gw.error) return <ErrorLine message={errorMessage(gw.error)} onRetry={gw.reload} />;
  const d = gw.data;
  const preset = d?.presets.find((p) => p.key === f.presetKey);

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-slate">Use any SMS provider that offers an HTTPS API (for example your mobile operator's business SMS, or a bulk SMS company). Copy the API address and the request format from your provider's documentation. SMS costs are billed to you by your provider.</p>
      {d && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-carbon">
          Status: {d.enabled ? <Badge color="green" size="sm">On</Badge> : <Badge color="gray" size="sm">Off</Badge>}
          {d.configured && (d.verified ? <Badge color="green" size="sm">Test passed</Badge> : <Badge color="yellow" size="sm">Not tested</Badge>)}
          {d.lastError && <span className="text-error">Last problem: {d.lastError}</span>}
        </div>
      )}
      <Card padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Provider" value={f.presetKey} onChange={set('presetKey')}><option value="">Other (generic HTTPS gateway)</option>{(d?.presets ?? []).map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</Select>
          <Input label="Sender name (up to 20 letters or numbers)" maxLength={20} value={f.senderId} onChange={set('senderId')} />
          {preset && <p className="m-0 text-xs text-slate sm:col-span-2">{preset.note} We have not verified this provider ourselves.</p>}
          <div className="sm:col-span-2"><Input label="API address (https)" value={f.url} onChange={set('url')} placeholder="https://api.your-sms-provider.com/send" /></div>
          <Select label="Method" value={f.method} onChange={set('method')}><option value="POST">POST</option><option value="GET">GET (details in the address)</option></Select>
          <Select label="Body format" value={f.contentType} onChange={set('contentType')}><option value="json">JSON</option><option value="form">Form</option></Select>
          <label className="flex flex-col gap-1 text-[13px] text-carbon sm:col-span-2">Request body (use {'{{to}} {{text}} {{sender}} {{secret}}'})<textarea rows={3} className="w-full rounded-lg border border-bone px-3 py-2 font-mono text-[12.5px]" value={f.body} onChange={set('body')} /></label>
          <label className="flex flex-col gap-1 text-[13px] text-carbon sm:col-span-2">Headers (JSON)<textarea rows={3} className="w-full rounded-lg border border-bone px-3 py-2 font-mono text-[12.5px]" value={f.headers} onChange={set('headers')} /></label>
          <Input label={d?.hasSecret ? 'Secret / API key (saved, type to replace)' : 'Secret / API key'} type="password" autoComplete="off" value={f.secret} onChange={set('secret')} />
          <Input label="Daily limit (messages per 24 h)" type="number" min={1} value={f.dailyLimit} onChange={set('dailyLimit')} />
          <Input label="Success text in the reply (optional)" value={f.successMatch} onChange={set('successMatch')} placeholder="OK" />
          <Input label="Message id in the reply (optional, e.g. data.id)" value={f.messageIdPath} onChange={set('messageIdPath')} />
        </div>
        <div className="mt-3"><Button loading={busy === 'save'} onClick={save}>Save</Button></div>
      </Card>

      {d?.configured && (
        <Card padding="md">
          <h3 className="m-0 mb-2 text-[14px] font-semibold text-carbon">1. Send a test message to yourself</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1"><Input label="Your phone number" type="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} /></div>
            <Button variant="outline" loading={busy === 'test'} disabled={!testPhone.trim()} onClick={() => void run('test', () => apiTestSmsGateway(storeId, testPhone), 'Test message sent: the gateway accepted it')}>Send test</Button>
          </div>
          <h3 className="m-0 mb-2 mt-4 text-[14px] font-semibold text-carbon">2. Switch it on</h3>
          <Button variant={d.enabled ? 'outline' : 'primary'} loading={busy === 'enable'} disabled={!d.verified && !d.enabled} onClick={() => void run('enable', () => apiEnableSmsGateway(storeId, !d.enabled), d.enabled ? 'Gateway switched off' : 'Gateway switched on')}>{d.enabled ? 'Switch off' : 'Switch on'}</Button>
          <h3 className="m-0 mb-2 mt-4 text-[14px] font-semibold text-carbon">3. Replies and delivery reports (optional)</h3>
          <p className="m-0 mb-2 text-xs text-slate">Give your provider these addresses so a STOP reply opts the person out at once and delivered / failed reports show up. The secret in the address is shown only once.</p>
          <Button size="sm" variant="outline" loading={busy === 'hook'} onClick={() => { setBusy('hook'); apiSmsWebhookSecret(storeId).then((r) => setHook(r)).catch((e) => toast.error(errorMessage(e))).finally(() => setBusy(null)); }}>{d.hasWebhookSecret ? 'Create a new secret address' : 'Create the addresses'}</Button>
          {hook && (
            <dl className="m-0 mt-3 flex flex-col gap-2 text-xs text-carbon">
              <div><dt className="font-semibold">Replies (inbound)</dt><dd className="m-0 break-all font-mono">{`${API_ORIGIN}${hook.inboundPath}`}</dd></div>
              <div><dt className="font-semibold">Delivery reports</dt><dd className="m-0 break-all font-mono">{`${API_ORIGIN}${hook.deliveryPath}`}</dd></div>
            </dl>
          )}
        </Card>
      )}
    </div>
  );
}
