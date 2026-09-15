import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Check, X, ShieldCheck } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Modal, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import {
  apiListStaff, apiCreateStaff, apiUpdateStaff, apiDeactivateStaff,
  apiListApprovals, apiApproveRequest, apiRejectRequest,
  STAFF_PERMISSIONS, PERMISSION_LABELS,
  type StaffMember, type StaffPermission, type ApprovalRequestItem,
} from '@/api/services/staff';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff' as 'staff' | 'manager', permissions: [] as StaffPermission[] };

/** "Staff" tab of the Inventory hub — real Staff RBAC management (invite/
 *  edit/deactivate a store-scoped staff login, set which
 *  Inventory/Purchase-Order/Stock-Count permissions they hold) plus the
 *  Approvals queue (a staff member's large/damage adjustments awaiting
 *  sign-off — see ApprovalRequest schema). This is the SELLER-side
 *  management surface, reachable from the seller's own existing dashboard
 *  session — a staff member's own separate login/dashboard experience is a
 *  larger, disclosed follow-up (not built this pass; the backend login
 *  endpoint and every permission gate are real and working, the frontend
 *  just has no dedicated staff-session entry point yet). */
export default function StaffTab() {
  const { storeId } = useStoreWorkspace();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState<StaffMember | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [approvalBusy, setApprovalBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiListStaff(storeId), apiListApprovals(storeId, 'pending')])
      .then(([s, a]) => { setStaff(s.data); setApprovals(a.data); })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(EMPTY_FORM); setError(''); setFormOpen('new'); };
  const openEdit = (member: StaffMember) => {
    setForm({ name: member.name, email: member.email, password: '', role: member.role, permissions: member.permissions });
    setError('');
    setFormOpen(member);
  };

  const togglePermission = (p: StaffPermission) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p] }));
  };

  const handleSave = async () => {
    if (!formOpen) return;
    setError('');
    if (formOpen === 'new' && (!form.name.trim() || !form.email.trim() || form.password.length < 8)) {
      setError('Name, email, and an 8+ character password are required.');
      return;
    }
    setSaving(true);
    try {
      if (formOpen === 'new') {
        await apiCreateStaff(storeId, { name: form.name, email: form.email, password: form.password, role: form.role, permissions: form.permissions });
      } else {
        await apiUpdateStaff(storeId, formOpen._id, { name: form.name, role: form.role, permissions: form.permissions });
      }
      setFormOpen(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member: StaffMember) => {
    await apiDeactivateStaff(storeId, member._id);
    load();
  };

  const handleApprove = async (id: string) => {
    setApprovalBusy(id);
    try { await apiApproveRequest(storeId, id); load(); } finally { setApprovalBusy(null); }
  };
  const handleReject = async (id: string) => {
    setApprovalBusy(id);
    try { await apiRejectRequest(storeId, id); load(); } finally { setApprovalBusy(null); }
  };

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-6">
      {/* ── Pending approvals ────────────────────────────────────────── */}
      {approvals.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-orange/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-bone bg-brand-pale-orange flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-deep-orange" />
            <p className="text-[13px] font-bold text-charcoal">Pending Approvals ({approvals.length})</p>
          </div>
          <div className="divide-y divide-bone">
            {approvals.map(a => (
              <div key={a._id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-charcoal truncate">{a.summary}</p>
                  <p className="text-[11px] text-slate">Requested by {a.requestedByName ?? 'a staff member'} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="xs" variant="outline" icon={<X size={12} />} onClick={() => handleReject(a._id)} loading={approvalBusy === a._id}>Reject</Button>
                  <Button size="xs" variant="primary" icon={<Check size={12} />} onClick={() => handleApprove(a._id)} loading={approvalBusy === a._id}>Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Staff list ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-slate max-w-[520px]">
          Give staff their own store-scoped login with only the Inventory/Purchase-Order/Stock-Count permissions they need. You always have full access regardless of what's set here.
        </p>
        <Button size="sm" icon={<Plus size={13} />} onClick={openNew}>Add Staff</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="10px" />)}</div>
      ) : staff.length === 0 ? (
        <EmptyState icon={<Users size={28} className="text-brand-orange opacity-55" />} title="No staff accounts yet" description="Add one to give a warehouse worker or manager their own scoped login." action={{ label: 'Add Staff', onClick: openNew, icon: <Plus size={14} /> }} />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {staff.map(member => (
            <div key={member._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button type="button" onClick={() => openEdit(member)} className="min-w-0 text-left bg-transparent border-none cursor-pointer flex-1">
                <p className="text-[13px] font-semibold text-charcoal truncate">{member.name} <span className="text-slate font-normal">· {member.email}</span></p>
                <p className="text-[11px] text-slate">{member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''} · {member.role === 'manager' ? 'Manager' : 'Staff'}</p>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <Badge color={member.status === 'active' ? 'green' : 'gray'} size="sm">{member.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                {member.status === 'active' && (
                  <Button size="xs" variant="ghost" onClick={() => handleDeactivate(member)}>Deactivate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit modal ───────────────────────────────────────────── */}
      {formOpen && (
        <Modal title={formOpen === 'new' ? 'Add Staff' : 'Edit Staff'} onClose={() => setFormOpen(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Email</label>
              <input type="email" value={form.email} disabled={formOpen !== 'new'} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40 disabled:bg-cream disabled:text-slate" />
            </div>
            {formOpen === 'new' && (
              <div>
                <label className="text-[12px] font-medium text-graphite mb-1 block">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
              </div>
            )}
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Role</label>
              <div className="flex gap-2">
                {(['staff', 'manager'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${form.role === r ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
                    {r === 'manager' ? 'Manager' : 'Staff'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1.5 block">Permissions</label>
              <div className="flex flex-col gap-2 border border-bone rounded-lg p-3">
                {STAFF_PERMISSIONS.map(p => (
                  <div key={p} className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-charcoal">{PERMISSION_LABELS[p]}</span>
                    <Toggle checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} size="sm" ariaLabel={PERMISSION_LABELS[p]} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate mt-1">Without "Approve staff adjustments", a large or damage/write-off adjustment this staff member makes is queued above instead of applied immediately.</p>
            </div>
            {error && <p className="text-[12px] text-error">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
