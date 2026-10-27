import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import { SettingsCard, SettingsRow, SettingsGroupLabel } from '@/components/comman/settings';
import { apiGetEmailHealth, apiSendTestEmail, type EmailHealth } from '@/api/services/adminEmailHealth';

function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Admin → Settings → Email: is the platform's SMTP set up, how many emails went out / failed, and a test button. */
export function AdminEmailHealth() {
  const [data, setData] = useState<EmailHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetEmailHealth()
      .then(res => { if (!cancelled) { setData(res.data); setError(''); } })
      .catch((err: unknown) => { if (!cancelled) setError(errMsg(err, 'Failed to load email health.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const reload = useCallback(() => { setLoading(true); setError(''); setReloadKey(k => k + 1); }, []);

  const sendTest = () => {
    setTesting(true);
    setTestResult(null);
    apiSendTestEmail()
      .then(res => setTestResult({ ok: res.success, text: res.message }))
      .catch((err: unknown) => setTestResult({ ok: false, text: errMsg(err, 'The test could not be run.') }))
      .finally(() => { setTesting(false); reload(); });
  };

  const maxDay = Math.max(1, ...(data?.days ?? []).map(d => d.sent + d.failed));

  return (
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-5">
      <SettingsCard
        title="Platform email"
        icon={<Mail size={14} />}
        description="Sign-up codes, order emails, invoices and alerts all go through this SMTP account."
        actions={<Button size="sm" icon={<Send size={13} />} onClick={sendTest} loading={testing} disabled={loading || !!error || !data?.configured}>Send test email</Button>}
      >
        {loading && !data ? null : error || !data ? (
          <div className="flex items-center justify-between gap-4">
            <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {error || 'Could not load.'}</p>
            <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {testResult && (
              <p role={testResult.ok ? 'status' : 'alert'} className={testResult.ok ? 'flex items-center gap-1.5 text-[12.5px] text-success' : 'flex items-start gap-1.5 text-[12.5px] text-error'}>
                {testResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />} {testResult.text}
              </p>
            )}

            {!data.configured && (
              <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg border border-error-border rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM on the server — no email can be sent until then.
              </p>
            )}
            {data.configured && data.consecutiveFailures >= 3 && (
              <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg border border-error-border rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> The last {data.consecutiveFailures} emails failed to send{data.lastError ? `: ${data.lastError}` : '.'}
              </p>
            )}

            <div className="-mx-5 border-y border-fog px-5 divide-y divide-fog">
              <SettingsRow label="Status">
                <span className="text-[12.5px] font-semibold text-charcoal">{data.configured ? 'Configured' : 'Not configured'}</span>
              </SettingsRow>
              <SettingsRow label="Server">
                <span className="text-[12.5px] font-semibold text-charcoal">{data.host}:{data.port}</span>
              </SettingsRow>
              <SettingsRow label="Sent from">
                <span className="text-[12.5px] font-semibold text-charcoal">{data.from ?? '—'}</span>
              </SettingsRow>
              <SettingsRow label="Sender name" description="Shown as the from name on every email.">
                <span className="text-[12.5px] font-semibold text-charcoal">{data.appName ?? '— (set APP_NAME)'}</span>
              </SettingsRow>
              <SettingsRow label="Last 14 days">
                <span className="text-[12.5px] font-semibold text-charcoal">{data.totals.sent} sent · {data.totals.failed} failed</span>
              </SettingsRow>
              <SettingsRow label="Last error" stacked>
                <span className="block text-[12.5px] font-medium text-charcoal break-words">{data.lastError ?? 'None'}</span>
              </SettingsRow>
            </div>

            <div>
              <SettingsGroupLabel className="mb-2">Emails per day</SettingsGroupLabel>
              <div className="flex items-end gap-1.5 h-[90px]" role="img" aria-label="Emails sent and failed per day, last 14 days">
                {data.days.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: ${d.sent} sent, ${d.failed} failed`}>
                    {d.failed > 0 && <div className="bg-error rounded-t-sm" style={{ height: `${(d.failed / maxDay) * 100}%`, minHeight: 2 }} />}
                    <div className={`bg-brand-orange ${d.failed > 0 ? '' : 'rounded-t-sm'}`} style={{ height: `${(d.sent / maxDay) * 100}%`, minHeight: d.sent > 0 ? 2 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10.5px] text-slate mt-1"><span>{data.days[0]?.date}</span><span>{data.days[data.days.length - 1]?.date}</span></div>
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
