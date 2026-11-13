import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { ENDPOINTS } from '@/api/endpoints';
import { isStaffSession } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, CopyIconButton, Input } from '@/components/comman/ui';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';

interface Status { data: { enabled: boolean; enabledAt: string | null; recoveryCodesLeft: number } }
interface Setup { data: { secret: string; otpauthUri: string } }
const M = ENDPOINTS.MEMBER_TWO_FACTOR;

/** Your own two-factor sign-in (authenticator app + recovery codes). The owner can also ask staff to use it. */
export default function SecurityPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const status = useApi<Status>(M.ME);
  const [setup, setSetup] = useState<Setup['data'] | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const policy = useApi<{ data: { requireStaffTwoFactor: boolean; graceDays: number; graceEndsAt: string | null } }>(M.POLICY(storeId));
  const [require, setRequire] = useState<boolean | null>(null);
  const [graceDays, setGraceDays] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const owner = !isStaffSession();
  // The QR image is drawn here in the browser from the setup link: nothing is sent to an outside service.
  useEffect(() => {
    let off = false;
    if (!setup) return () => { off = true; };
    QRCode.toDataURL(setup.otpauthUri, { margin: 1, width: 180, color: { dark: '#141413', light: '#ffffff' } }).then((u) => { if (!off) setQr(u); }).catch(() => { if (!off) setQr(null); });
    return () => { off = true; };
  }, [setup]);
  const policyOn = require ?? policy.data?.data.requireStaffTwoFactor ?? false;
  const graceValue = graceDays ?? String(policy.data?.data.graceDays ?? 7);
  const on = !!status.data?.data.enabled;

  async function run(key: string, fn: () => Promise<void>) { setBusy(key); try { await fn(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); } }
  const start = () => run('start', async () => { const r = (await client.post(M.SETUP, {})) as unknown as Setup; setSetup(r.data); setCode(''); });
  const enable = () => run('enable', async () => { const r = (await client.post(M.ENABLE, { code })) as unknown as { data: { recoveryCodes: string[] } }; setCodes(r.data.recoveryCodes); setSetup(null); setCode(''); status.reload(); toast.success('Two-factor sign-in is on'); });
  const disable = () => run('disable', async () => { await client.post(M.DISABLE, { password, code }); setPassword(''); setCode(''); setCodes(null); status.reload(); toast.success('Two-factor sign-in is off'); });
  const regen = () => run('regen', async () => { const r = (await client.post(M.RECOVERY_CODES, { password, code })) as unknown as { data: { recoveryCodes: string[] } }; setCodes(r.data.recoveryCodes); setPassword(''); setCode(''); status.reload(); });
  const savePolicy = (v: boolean) => run('policy', async () => { await client.put(M.POLICY(storeId), { requireStaffTwoFactor: v, graceDays: Math.min(30, Math.max(0, Number(graceValue) || 0)) }); setRequire(v); policy.reload(); toast.success(v ? 'Staff must use two-factor' : 'Two-factor is optional for staff'); });

  return (
    <>
      {!embedded && <StorePageHeader title="Security" subtitle="Two-factor sign-in" />}
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {status.error ? <ErrorLine message={errorMessage(status.error)} onRetry={status.reload} /> : (
          <Card padding="md">
            <div className="mb-2 flex items-center gap-2"><h3 className="m-0 text-[15px] font-semibold text-carbon">Authenticator app</h3>{status.data && <Badge color={on ? 'green' : 'gray'} size="sm">{on ? 'On' : 'Off'}</Badge>}</div>
            {codes && (
              <div className="mb-4 rounded-lg border border-bone p-3">
                <p className="mt-0 text-[13px] font-semibold text-carbon">Save these recovery codes now. Each works once if you lose your phone. They are shown only this once.</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-[13px]">{codes.map((c) => <span key={c}>{c}</span>)}</div>
                <div className="mt-2 flex items-center gap-2 text-xs"><CopyIconButton value={codes.join('\n')} />Copy all<Button size="xs" variant="outline" onClick={() => setCodes(null)}>I have saved them</Button></div>
              </div>
            )}
            {!on && !setup && <><p className="mt-0 text-[13px] text-slate">Add a second step to your sign-in: a 6-digit code from an app such as Google Authenticator or Microsoft Authenticator.</p><Button loading={busy === 'start'} onClick={() => void start()}>Set up</Button></>}
            {!on && setup && (
              <div className="flex flex-col gap-3">
                <p className="m-0 text-[13px] text-slate">1. In your authenticator app scan the QR code below (or choose "Enter a setup key" and type the key). 2. Enter the 6-digit code it shows.</p>
                <div className="flex items-center gap-2 break-all rounded-lg border border-bone p-3 font-mono text-sm">{setup.secret}<CopyIconButton value={setup.secret} /></div>
                {qr && <img src={qr} width={180} height={180} alt="QR code to add this account to your authenticator app" className="rounded-lg border border-bone" />}
                <a href={setup.otpauthUri} className="text-[13px] underline">Open in my authenticator app</a>
                <Input label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))} />
                <div><Button loading={busy === 'enable'} disabled={code.replace(/\s/g, '').length < 6} onClick={() => void enable()}>Turn on</Button></div>
              </div>
            )}
            {on && (
              <div className="flex flex-col gap-3">
                <p className="m-0 text-[13px] text-slate">{status.data?.data.recoveryCodesLeft ?? 0} recovery code(s) left. To turn it off or make new recovery codes, confirm with your password and a current code.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Input label="Current code" inputMode="numeric" autoComplete="one-time-code" maxLength={11} value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="flex gap-2"><Button variant="outline" loading={busy === 'regen'} disabled={!password || !code} onClick={() => void regen()}>New recovery codes</Button><Button variant="outline" loading={busy === 'disable'} disabled={!password || !code} onClick={() => void disable()}>Turn off</Button></div>
              </div>
            )}
          </Card>
        )}
        {owner && (
          <Card padding="md">
            <h3 className="m-0 mb-1 text-[15px] font-semibold text-carbon">Staff</h3>
            <p className="mt-0 text-[13px] text-slate">Require two-factor for everyone on your staff. They get a grace period to set it up (the app sends them to this page after sign-in); after that, a staff member without two-factor cannot open the dashboard until they turn it on. If someone loses their phone, reset theirs from the Staff page.</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={policyOn} disabled={busy === 'policy'} onChange={(e) => void savePolicy(e.target.checked)} />Require two-factor for staff</label>
              <div className="w-40"><Input label="Grace period (days, 0-30)" type="number" min={0} max={30} value={graceValue} onChange={(e) => setGraceDays(e.target.value)} /></div>
              {policyOn && <Button size="sm" variant="outline" loading={busy === 'policy'} onClick={() => void savePolicy(true)}>Save grace period</Button>}
            </div>
            {policyOn && policy.data?.data.graceEndsAt && <p className="mb-0 mt-2 text-xs text-slate">{new Date(policy.data.data.graceEndsAt) > new Date() ? `Staff without two-factor are blocked from ${new Date(policy.data.data.graceEndsAt).toLocaleString()}.` : 'The grace period is over: staff without two-factor are blocked until they set it up.'}</p>}
          </Card>
        )}
      </div>
    </>
  );
}
