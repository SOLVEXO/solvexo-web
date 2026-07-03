import { useEffect, useState } from 'react';
import { X, Mail, Shield, Clock, Monitor, KeyRound } from 'lucide-react';
import { Avatar } from '@/components/comman/ui/Avatar';
import { Badge } from '@/components/comman/ui/Badge';
import { apiGetEmployeeById, apiResetEmployeePin, type PosEmployee } from '@/api/services/pos/posEmployees';
import { apiGetShiftById, type PosShift } from '@/api/services/pos/posShifts';

interface ProfileOverlayProps {
  storeId:      string;
  employeeId:   string;
  registerName: string;
  openedAt:     Date | null;
  onClose:      () => void;
}

export function ProfileOverlay({ storeId, employeeId, registerName, openedAt, onClose }: ProfileOverlayProps) {
  const [profile, setProfile] = useState<PosEmployee | null>(null);
  const [shifts, setShifts]   = useState<PosShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetEmployeeById(storeId, employeeId)
      .then(async res => {
        if (cancelled) return;
        setProfile(res.data);
        if (res.data.shiftIds.length > 0) {
          const results = await Promise.all(
            res.data.shiftIds.map(id => apiGetShiftById(storeId, id).then(r => r.data).catch(() => null)),
          );
          if (!cancelled) setShifts(results.filter((s): s is PosShift => !!s));
        }
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, employeeId]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-[380px] bg-pos-surface border border-carbon rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-carbon">
          <p className="text-[14px] font-semibold text-white">My Profile</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-pos-muted hover:bg-carbon">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <p className="text-[12px] text-pos-muted text-center py-6">Loading…</p>
          ) : error || !profile ? (
            <p className="text-[12px] text-error text-center py-6">{error}</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <Avatar name={profile.name} size={44} variant="pos" />
                <div>
                  <p className="text-[15px] font-semibold text-white">{profile.name}</p>
                  <Badge color={profile.role === 'manager' ? 'blue' : 'gray'}>{profile.role}</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <div className="flex items-center gap-[10px]">
                  <Mail size={13} className="text-pos-muted shrink-0" />
                  <span className="text-[12px] text-pos-faint">{profile.email}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Shield size={13} className="text-pos-muted shrink-0" />
                  <span className="text-[12px] text-pos-faint capitalize">{profile.status} employee</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Monitor size={13} className="text-pos-muted shrink-0" />
                  <span className="text-[12px] text-pos-faint">
                    {registerName || 'No register'}
                    {openedAt && ` · Shift opened ${openedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
                {shifts.length > 0 && (
                  <div className="flex items-start gap-[10px]">
                    <Clock size={13} className="text-pos-muted shrink-0 mt-[2px]" />
                    <div className="flex flex-col gap-1">
                      {shifts.map(s => (
                        <span key={s._id} className="text-[12px] text-pos-faint">
                          {s.name} · {s.startTime}–{s.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <ChangePinForm storeId={storeId} employeeId={employeeId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangePinForm({ storeId, employeeId }: { storeId: string; employeeId: string }) {
  const [open, setOpen]     = useState(false);
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  async function submit() {
    if (!/^\d{4,6}$/.test(newPin)) { setError('PIN must be 4-6 digits.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiResetEmployeePin(storeId, employeeId, newPin);
      setDone(true);
      setNewPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-[6px] py-[9px] bg-carbon border-0 rounded-lg text-[12px] text-pos-faint cursor-pointer"
      >
        <KeyRound size={12} /> Change My PIN
      </button>
    );
  }

  return (
    <div className="border-t border-carbon pt-4">
      <p className="text-[11px] text-pos-faint mb-2">New PIN</p>
      <div className="flex gap-2">
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={newPin}
          onChange={e => { setNewPin(e.target.value); setDone(false); }}
          placeholder="4-6 digit PIN"
          className="flex-1 bg-carbon border border-carbon rounded-lg px-3 py-[8px] text-[13px] text-white outline-none box-border"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-[8px] bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-[11px] text-error mt-2">{error}</p>}
      {done && <p className="text-[11px] text-success mt-2">PIN updated.</p>}
    </div>
  );
}
