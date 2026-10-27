import { useCallback, useEffect, useState } from 'react';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import { SettingsCard } from '@/components/comman/settings';
import { useToast } from '@/contexts/ToastContext';
import { apiMyAdminSessions, apiRevokeMyAdminSession, apiRevokeAllMyAdminSessions, type AdminSession } from '@/api/services/adminTeam';

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : '—');
const device = (ua?: string | null) => {
  if (!ua) return 'Unknown device';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Device';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${br} on ${os}`;
};

/** Settings → Sessions: where this admin account is signed in, with sign-out per device. */
export function AdminSessions() {
  const toast = useToast();
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    apiMyAdminSessions().then(r => setSessions(r.data)).catch(e => setError(e instanceof Error ? e.message : 'Could not load sessions.'));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const revoke = async (sid: string) => {
    try { await apiRevokeMyAdminSession(sid); toast.success('Signed out.'); load(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed.'); }
  };
  const revokeAll = async () => {
    try { await apiRevokeAllMyAdminSessions(); toast.success('Signed out everywhere.'); load(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed.'); }
  };

  return (
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-3">
      {error && (
        <div role="alert" className="border border-error-border bg-error-bg rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-[13px] text-error">{error}</p><Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}
      <SettingsCard
        title="Sessions"
        icon={<MonitorSmartphone size={14} />}
        description="Devices where your admin account is signed in. Sign out any you don't recognise."
        actions={sessions && sessions.length > 1
          ? <Button size="sm" variant="outline" onClick={revokeAll}><LogOut size={13} /> Sign out all</Button>
          : undefined}
      >
        {!sessions && !error && <p className="text-[13px] text-slate py-4">Loading…</p>}
        {sessions && sessions.length === 0 && <p className="text-[13px] text-slate py-4 text-center">No active sessions.</p>}
        {(sessions?.length ?? 0) > 0 && (
          <div className="-mx-5 -mb-5 border-t border-fog divide-y divide-fog px-5">
            {sessions?.map(s => (
              <div key={s.sid} className="py-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-charcoal">{device(s.userAgent)}{s.current && <span className="ml-2 text-[11px] text-success font-semibold">This device</span>}</p>
                  <p className="text-[11.5px] text-slate">{s.ip ?? 'Unknown IP'} · signed in {fmt(s.createdAt)} · last active {fmt(s.lastSeenAt)}</p>
                </div>
                {!s.current && <Button size="xs" variant="outline" onClick={() => revoke(s.sid)}>Sign out</Button>}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
