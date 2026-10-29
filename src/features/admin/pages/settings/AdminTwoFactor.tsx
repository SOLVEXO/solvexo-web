import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button, Input } from '@/components/comman/ui';
import { SettingsCard } from '@/components/comman/settings';
import { useToast } from '@/contexts/ToastContext';
import {
  apiAdminTwoFactorStatus, apiStartAdminTwoFactor, apiEnableAdminTwoFactor, apiDisableAdminTwoFactor, apiNewAdminRecoveryCodes,
  type AdminTwoFactorStatus, type AdminTwoFactorSetup,
} from '@/api/services/adminTeam';

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Settings → Two-factor sign-in: authenticator-app codes on top of the password, plus one-time recovery codes. */
export function AdminTwoFactor() {
  const toast = useToast();
  const [status, setStatus] = useState<AdminTwoFactorStatus | null>(null);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState<(AdminTwoFactorSetup & { qr: string }) | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  // 'disable' / 'codes' = the password + code form for switching off or making new recovery codes.
  const [confirm, setConfirm] = useState<'disable' | 'codes' | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError('');
    apiAdminTwoFactorStatus().then(r => setStatus(r.data)).catch(e => setError(errMsg(e, 'Could not load two-factor status.')));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const reset = () => { setCode(''); setPassword(''); setConfirm(null); };

  const start = async () => {
    setBusy(true);
    try {
      const r = await apiStartAdminTwoFactor();
      const qr = await QRCode.toDataURL(r.data.otpauthUri, { margin: 1, width: 200, color: { dark: '#141413', light: '#ffffff' } });
      setSetup({ ...r.data, qr }); setCode('');
    } catch (e) { toast.error(errMsg(e, 'Could not start setup.')); } finally { setBusy(false); }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const r = await apiEnableAdminTwoFactor(code.replace(/\s/g, ''));
      setRecoveryCodes(r.data.recoveryCodes); setSetup(null); reset();
      toast.success('Two-factor sign-in is on.'); load();
    } catch (e) { toast.error(errMsg(e, "That code didn't match.")); } finally { setBusy(false); }
  };

  const submitConfirm = async () => {
    setBusy(true);
    try {
      if (confirm === 'disable') {
        await apiDisableAdminTwoFactor(password, code.trim());
        toast.success('Two-factor sign-in is off.'); setRecoveryCodes(null);
      } else {
        const r = await apiNewAdminRecoveryCodes(password, code.trim());
        setRecoveryCodes(r.data.recoveryCodes); toast.success('New recovery codes made. The old ones no longer work.');
      }
      reset(); load();
    } catch (e) { toast.error(errMsg(e, 'Failed.')); } finally { setBusy(false); }
  };

  const copyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard?.writeText(recoveryCodes.join('\n')).then(() => toast.success('Copied.'), () => toast.error('Copy failed.'));
  };
  const downloadCodes = () => {
    if (!recoveryCodes) return;
    const blob = new Blob([`Solvexo Admin recovery codes\nEach code works once.\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'solvexo-admin-recovery-codes.txt'; a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-3">
      {error && (
        <div role="alert" className="border border-error-border bg-error-bg rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-[13px] text-error">{error}</p><Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      {recoveryCodes && (
        <SettingsCard title="Save your recovery codes" icon={<KeyRound size={14} />}
          description="If you lose your phone, each of these codes signs you in once. They won't be shown again — store them somewhere safe, like a password manager.">
          <div className="grid grid-cols-2 gap-2 font-mono text-[13px] text-charcoal bg-paper border border-fog rounded-lg p-4">
            {recoveryCodes.map(c => <span key={c}>{c}</span>)}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyCodes}><Copy size={13} /> Copy</Button>
            <Button size="sm" variant="outline" onClick={downloadCodes}><Download size={13} /> Download</Button>
            <Button size="sm" variant="primary" onClick={() => setRecoveryCodes(null)}>I've saved them</Button>
          </div>
        </SettingsCard>
      )}

      <SettingsCard
        title="Two-factor sign-in"
        icon={status?.enabled ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
        description="Ask for a code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy) every time you sign in, so a leaked password alone can't open the admin panel."
      >
        {!status && !error && <p className="text-[13px] text-slate py-2">Loading…</p>}

        {status && !status.enabled && !setup && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[13px] text-slate"><span className="font-semibold text-warning">Off.</span> Your account is protected by your password only.</p>
            <Button size="sm" variant="primary" onClick={start} loading={busy}>Turn on</Button>
          </div>
        )}

        {setup && (
          <div className="flex flex-col sm:flex-row gap-5">
            <img src={setup.qr} alt="QR code to add Solvexo Admin to your authenticator app" width={200} height={200} className="rounded-lg border border-fog self-center sm:self-start" />
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              <ol className="text-[13px] text-charcoal list-decimal pl-4 flex flex-col gap-1">
                <li>Open your authenticator app and scan this QR code.</li>
                <li>Enter the 6-digit code the app shows for <strong>{setup.issuer}</strong>.</li>
              </ol>
              <p className="text-[11.5px] text-slate break-all">Can't scan? Enter this key by hand: <span className="font-mono text-charcoal">{setup.secret.replace(/(.{4})/g, '$1 ').trim()}</span></p>
              <Input id="admin-2fa-setup-code" label="6-digit code" placeholder="123 456" inputMode="numeric" autoComplete="one-time-code" maxLength={7}
                value={code} onChange={e => setCode(e.target.value.replace(/[^\d ]/g, ''))} onKeyDown={e => e.key === 'Enter' && code.trim() && enable()} />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={enable} loading={busy} disabled={code.replace(/\s/g, '').length !== 6}>Verify and turn on</Button>
                <Button size="sm" variant="outline" onClick={() => { setSetup(null); setCode(''); }}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {status?.enabled && !confirm && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-slate">
              <span className="font-semibold text-success">On</span>
              {status.enabledAt && <> since {new Date(status.enabledAt).toLocaleDateString()}</>}
              {' · '}{status.recoveryCodesLeft} recovery code{status.recoveryCodesLeft === 1 ? '' : 's'} left
            </p>
            {status.recoveryCodesLeft <= 3 && (
              <p className="text-[12px] text-warning bg-warning-bg rounded-lg px-3 py-2">You're running low on recovery codes. Make new ones so you can't get locked out.</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setConfirm('codes')}><KeyRound size={13} /> New recovery codes</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm('disable')}><ShieldOff size={13} /> Turn off</Button>
            </div>
          </div>
        )}

        {status?.enabled && confirm && (
          <div className="flex flex-col gap-3 max-w-sm">
            <p className="text-[13px] text-charcoal font-semibold">{confirm === 'disable' ? 'Turn off two-factor sign-in' : 'Make new recovery codes'}</p>
            <p className="text-[12px] text-slate">Confirm with your password and a code from your app (or a recovery code).</p>
            <Input id="admin-2fa-confirm-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            <Input id="admin-2fa-confirm-code" label="Code" placeholder="123456 or XXXXX-XXXXX" autoComplete="one-time-code" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && password && code.trim() && submitConfirm()} />
            <div className="flex gap-2">
              <Button size="sm" variant={confirm === 'disable' ? 'danger' : 'primary'} onClick={submitConfirm} loading={busy} disabled={!password || !code.trim()}>
                {confirm === 'disable' ? 'Turn off' : 'Make new codes'}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>Cancel</Button>
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
