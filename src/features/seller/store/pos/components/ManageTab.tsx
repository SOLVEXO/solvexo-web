import { useState } from 'react';
import { clsx } from 'clsx';
import { EmployeesTab } from './manage/EmployeesTab';
import { LocationsTab } from './manage/LocationsTab';
import { RegistersTab } from './manage/RegistersTab';
import { ShiftsTab } from './manage/ShiftsTab';
import { SessionsTab } from './manage/SessionsTab';
import { SettingsTab } from './manage/SettingsTab';
import { ReportsTab } from './manage/ReportsTab';
import { AuditLogTab } from './manage/AuditLogTab';

type ManageSection = 'employees' | 'locations' | 'registers' | 'shifts' | 'sessions' | 'settings' | 'reports' | 'audit';

const SECTIONS: { id: ManageSection; label: string }[] = [
  { id: 'employees', label: 'Employees' },
  { id: 'locations', label: 'Locations' },
  { id: 'registers', label: 'Registers' },
  { id: 'shifts',    label: 'Shifts' },
  { id: 'sessions',  label: 'Sessions' },
  { id: 'settings',  label: 'Settings' },
  { id: 'reports',   label: 'Reports' },
  { id: 'audit',     label: 'Audit Log' },
];

interface ManageTabProps {
  storeId: string;
}

export function ManageTab({ storeId }: ManageTabProps) {
  const [section, setSection] = useState<ManageSection>('employees');

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-pos-bg">
      <div className="bg-pos-surface border border-carbon rounded-2xl overflow-hidden max-w-[1100px] mx-auto">

        {/* Sub-nav */}
        <div className="flex gap-1 px-3 sm:px-6 pt-4 border-b border-carbon overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={clsx(
                'shrink-0 px-4 py-[10px] text-[13px] font-medium cursor-pointer border-0 border-b-2 bg-transparent -mb-px whitespace-nowrap',
                section === s.id
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-pos-faint hover:text-white',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="px-3 sm:px-6 py-6">
          {section === 'employees' && <EmployeesTab storeId={storeId} />}
          {section === 'locations' && <LocationsTab storeId={storeId} />}
          {section === 'registers' && <RegistersTab storeId={storeId} />}
          {section === 'shifts'    && <ShiftsTab storeId={storeId} />}
          {section === 'sessions'  && <SessionsTab storeId={storeId} />}
          {section === 'settings'  && <SettingsTab storeId={storeId} />}
          {section === 'reports'   && <ReportsTab storeId={storeId} />}
          {section === 'audit'     && <AuditLogTab storeId={storeId} />}
        </div>
      </div>
    </div>
  );
}
