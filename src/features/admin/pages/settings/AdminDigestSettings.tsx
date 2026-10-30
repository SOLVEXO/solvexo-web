import { useEffect, useState } from 'react';
import { Eye, Mail, Send } from 'lucide-react';
import { Button, Modal, Toggle } from '@/components/comman/ui';
import { SettingsCard } from '@/components/comman/settings';
import { useToast } from '@/contexts/ToastContext';
import { can } from '@/hooks/auth/useCan';
import { apiGetDigestSettings, apiPreviewDigest, apiSendTestDigest, apiUpdateDigestSettings } from '@/api/services/adminTeam';

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Settings → Notifications: the admin's own Monday business-digest email, with a preview and a test send. */
export function AdminDigestSettings() {
  const toast = useToast();
  const [on, setOn] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null);
  // The digest is business numbers: only admins who can see analytics get it (the server checks this too).
  const allowed = can('analytics.view');

  useEffect(() => {
    if (!allowed) return;
    apiGetDigestSettings().then(r => setOn(r.data.weeklyDigest)).catch(() => setOn(true));
  }, [allowed]);

  if (!allowed) return null;

  const toggle = async (v: boolean) => {
    setOn(v);
    try { await apiUpdateDigestSettings(v); toast.success(v ? 'Weekly digest on.' : 'Weekly digest off.'); }
    catch (e) { setOn(!v); toast.error(errMsg(e, 'Could not save.')); }
  };
  const openPreview = async () => {
    setBusy('preview');
    try { setPreview((await apiPreviewDigest()).data); } catch (e) { toast.error(errMsg(e, 'Could not build the preview.')); } finally { setBusy(null); }
  };
  const sendTest = async () => {
    setBusy('send');
    try { const r = await apiSendTestDigest(); toast.success(r.message ?? 'Sent.'); } catch (e) { toast.error(errMsg(e, 'Could not send.')); } finally { setBusy(null); }
  };

  return (
    <>
      <SettingsCard title="Weekly business digest" icon={<Mail size={14} />}
        description="Every Monday morning (08:05 Pakistan time): MRR and its weekly change, new merchants, stores at risk, new merchants who are stuck, and open alerts. Critical and warning alerts are also sent as soon as they happen.">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2.5 text-[13px] text-charcoal">
            <Toggle checked={!!on} onChange={toggle} disabled={on === null} ariaLabel="Weekly business digest email" />
            {on === null ? 'Loading…' : on ? 'On: you get it every Monday' : 'Off'}
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={openPreview} loading={busy === 'preview'}><Eye size={13} /> Preview this week</Button>
            <Button size="sm" variant="outline" onClick={sendTest} loading={busy === 'send'}><Send size={13} /> Send me a test</Button>
          </div>
        </div>
      </SettingsCard>
      {preview && (
        <Modal title={preview.subject} onClose={() => setPreview(null)} width={720}>
          {/* Sandboxed: the email HTML is rendered, never run. */}
          <iframe title="Weekly digest preview" srcDoc={preview.html} sandbox="" className="w-full h-[70vh] border border-bone rounded-lg bg-white" />
        </Modal>
      )}
    </>
  );
}
