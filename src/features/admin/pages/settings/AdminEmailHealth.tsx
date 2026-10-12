import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import { Button, Card, SkeletonBox } from '@/components/comman/ui';
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
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-6 max-w-[900px]">
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[16px] font-bold text-carbon flex items-center gap-2"><Mail size={16} /> Platform email</h2>
            <p className="text-[12px] text-slate mt-0.5">Sign-up codes, order emails, invoices and alerts all go through this SMTP account.</p>
          </div>
          <Button size="sm" icon={<Send size={13} />} onClick={sendTest} loading={testing} disabled={loading || !!error || !data?.configured}>Send test email</Button>
        </div>

        {loading && !data ? (
          <div className="p-5 flex flex-col gap-3" aria-busy="true">
            <SkeletonBox width={260} height={12} /><SkeletonBox width={200} height={12} /><SkeletonBox width="100%" height={80} />
          </div>
        ) : error || !data ? (
          <div className="p-5 flex items-center justify-between gap-4">
            <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {error || 'Could not load.'}</p>
            <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-5">
            {testResult && (
              <p role={testResult.ok ? 'status' : 'alert'} className={testResult.ok ? 'flex items-center gap-1.5 text-[12.5px] text-success' : 'flex items-start gap-1.5 text-[12.5px] text-error'}>
                {testResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />} {testResult.text}
              </p>
            )}

            {!data.configured && (
              <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM on the server — no email can be sent until then.
              </p>
            )}
            {data.configured && data.consecutiveFailures >= 3 && (
              <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> The last {data.consecutiveFailures} emails failed to send{data.lastError ? `: ${data.lastError}` : '.'}
              </p>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
              <div className="flex justify-between gap-3"><dt className="text-slate">Status</dt><dd className="font-medium text-charcoal">{data.configured ? 'Configured' : 'Not configured'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate">Server</dt><dd className="font-medium text-charcoal">{data.host}:{data.port}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate">Sent from</dt><dd className="font-medium text-charcoal">{data.from ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate">Sender name</dt><dd className="font-medium text-charcoal">{data.appName ?? '— (set APP_NAME)'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate">Last 14 days</dt><dd className="font-medium text-charcoal">{data.totals.sent} sent · {data.totals.failed} failed</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate">Last error</dt><dd className="font-medium text-charcoal text-right break-words max-w-[60%]">{data.lastError ?? 'None'}</dd></div>
            </dl>

            <div>
              <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-2">Emails per day</p>
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
      </Card>
    </div>
  );
}
