import { useEffect, useState } from 'react';
import { Plus, Users, KeyRound } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import { useForm } from '@/hooks/useForm';
import { required, email as emailValidator, exactLength, numeric } from '@/utils/validation/validators';
import type { Schema } from '@/utils/validation/schemas';
import {
  apiAddEmployee, apiGetEmployees, apiUpdateEmployee, apiRemoveEmployee, apiResetEmployeePin,
  type PosEmployee, type EmployeeRole,
} from '@/api/services/pos/posEmployees';
import { apiListShifts, type PosShift } from '@/api/services/pos/posShifts';
import {
  DarkModal, DarkField, DarkInput, DarkSelect, DarkButton, DarkEmptyState, DarkSkeleton, DarkTable,
} from './darkUi';

interface EmployeesTabProps { storeId: string }

interface EmployeeFormData {
  name:  string;
  email: string;
  pin:   string;
  role:  EmployeeRole;
}

export function EmployeesTab({ storeId }: EmployeesTabProps) {
  const [employees, setEmployees] = useState<PosEmployee[]>([]);
  const [shifts, setShifts]       = useState<PosShift[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing]         = useState<PosEmployee | 'new' | null>(null);
  const [resettingPin, setResettingPin] = useState<PosEmployee | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([apiGetEmployees(storeId), apiListShifts(storeId)])
      .then(([empRes, shiftRes]) => { if (!cancelled) { setEmployees(empRes.data); setShifts(shiftRes.data); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load employees.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  function reload() { setRefreshKey(k => k + 1); }

  async function handleDeactivate(emp: PosEmployee) {
    if (!window.confirm(`Deactivate ${emp.name}? They will no longer be able to log in.`)) return;
    try {
      await apiRemoveEmployee(storeId, emp._id);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate employee.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Employees</p>
        <DarkButton icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add Employee</DarkButton>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <DarkSkeleton key={i} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : employees.length === 0 ? (
        <DarkEmptyState
          icon={<Users size={24} className="text-brand-orange" />}
          title="No employees yet"
          description="Add employees so they can log into the POS terminal with their own PIN."
          action={{ label: 'Add Employee', onClick: () => setEditing('new') }}
        />
      ) : (
        <DarkTable headers={['Name', 'Email', 'Role', 'Status', '']}>
          {employees.map(e => (
            <tr key={e._id} className="border-b border-carbon last:border-0">
              <td className="px-4 py-[10px] text-[12px] font-medium text-white">{e.name}</td>
              <td className="px-4 py-[10px] text-[12px] text-pos-faint">{e.email}</td>
              <td className="px-4 py-[10px]"><Badge color={e.role === 'manager' ? 'blue' : 'gray'}>{e.role}</Badge></td>
              <td className="px-4 py-[10px]"><Badge color={e.status === 'active' ? 'green' : 'red'}>{e.status}</Badge></td>
              <td className="px-4 py-[10px]">
                <div className="flex justify-end gap-[6px]">
                  <button onClick={() => setEditing(e)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                    Edit
                  </button>
                  <button onClick={() => setResettingPin(e)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint flex items-center gap-1">
                    <KeyRound size={11} /> PIN
                  </button>
                  <button onClick={() => handleDeactivate(e)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error">
                    Deactivate
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DarkTable>
      )}

      {editing && (
        <EmployeeFormModal
          storeId={storeId}
          shifts={shifts}
          employee={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}

      {resettingPin && (
        <ResetPinModal
          storeId={storeId}
          employee={resettingPin}
          onClose={() => setResettingPin(null)}
          onDone={() => setResettingPin(null)}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  storeId, shifts, employee, onClose, onSaved,
}: {
  storeId: string;
  shifts: PosShift[];
  employee: PosEmployee | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!employee;
  const [shiftIds, setShiftIds] = useState<string[]>(employee?.shiftIds ?? []);
  const [submitError, setSubmitError] = useState('');

  const schema: Schema<EmployeeFormData> = {
    name:  [required('Name')],
    email: [required('Email'), emailValidator()],
    pin:   isEdit ? [] : [required('PIN'), numeric('PIN must be numeric'), exactLength(4, 'PIN')],
    role:  [],
  };

  const { values, errors, set, setValue, blur, handleSubmit } = useForm<EmployeeFormData>(
    schema,
    { name: employee?.name ?? '', email: employee?.email ?? '', pin: '', role: employee?.role ?? 'cashier' },
    {
      onSubmit: async data => {
        setSubmitError('');
        try {
          if (isEdit) {
            await apiUpdateEmployee(storeId, employee._id, {
              name: data.name, role: data.role, shiftIds,
              ...(data.pin ? { pin: data.pin } : {}),
            });
          } else {
            await apiAddEmployee({ storeId, name: data.name, email: data.email, pin: data.pin, role: data.role, shiftIds });
          }
          onSaved();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Failed to save employee.');
        }
      },
    },
  );

  return (
    <DarkModal title={isEdit ? 'Edit Employee' : 'Add Employee'} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Employee'}</DarkButton>
      </>
    }>
      <form onSubmit={handleSubmit}>
        <DarkField label="Name" required error={errors.name}>
          <DarkInput value={values.name} onChange={set('name')} onBlur={blur('name')} placeholder="John Doe" />
        </DarkField>
        <DarkField label="Email" required error={errors.email}>
          <DarkInput type="email" value={values.email} onChange={set('email')} onBlur={blur('email')} placeholder="john@store.com" disabled={isEdit} />
        </DarkField>
        <DarkField label={isEdit ? 'New PIN (leave blank to keep current)' : 'PIN'} required={!isEdit} error={errors.pin}>
          <DarkInput type="password" inputMode="numeric" maxLength={4} value={values.pin} onChange={set('pin')} onBlur={blur('pin')} placeholder="4-digit PIN" />
        </DarkField>
        <DarkField label="Role">
          <DarkSelect value={values.role} onChange={e => setValue('role', e.target.value as EmployeeRole)}>
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
          </DarkSelect>
        </DarkField>
        {shifts.length > 0 && (
          <DarkField label="Assigned Shifts">
            <div className="flex flex-col gap-1">
              {shifts.map(s => (
                <label key={s._id} className="flex items-center gap-2 text-[13px] text-white">
                  <input
                    type="checkbox"
                    checked={shiftIds.includes(s._id)}
                    onChange={e => setShiftIds(prev => e.target.checked ? [...prev, s._id] : prev.filter(id => id !== s._id))}
                  />
                  {s.name} ({s.startTime}–{s.endTime})
                </label>
              ))}
            </div>
          </DarkField>
        )}
        {submitError && <p className="text-[12px] text-error">{submitError}</p>}
      </form>
    </DarkModal>
  );
}

function ResetPinModal({
  storeId, employee, onClose, onDone,
}: {
  storeId: string;
  employee: PosEmployee;
  onClose: () => void;
  onDone: () => void;
}) {
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    if (!/^\d{4,6}$/.test(newPin)) { setError('PIN must be 4-6 digits.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiResetEmployeePin(storeId, employee._id, newPin);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset PIN.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DarkModal title={`Reset PIN for ${employee.name}`} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton onClick={submit} loading={saving}>Reset PIN</DarkButton>
      </>
    }>
      <DarkField label="New PIN" required error={error}>
        <DarkInput type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="4-6 digit PIN" />
      </DarkField>
    </DarkModal>
  );
}
