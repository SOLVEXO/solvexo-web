import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { clsx } from 'clsx';
import {
  apiGetDailyReport, apiGetDateRangeReport, apiExportDailyReportCsv,
  apiGetRegisterReport, apiGetEmployeeReport,
  type DailyReport, type DateRangeReport, type RegisterReport, type EmployeeReport,
} from '@/api/services/pos/posReports';
import { apiListRegisters, type PosRegister } from '@/api/services/pos/posRegisters';
import { apiGetEmployees, type PosEmployee } from '@/api/services/pos/posEmployees';
import { DarkField, DarkInput, DarkSelect, DarkButton, DarkMetricCard } from './darkUi';

type Section = 'daily' | 'range' | 'register' | 'employee';

interface ReportsTabProps { storeId: string }

const today = () => new Date().toISOString().split('T')[0];

export function ReportsTab({ storeId }: ReportsTabProps) {
  const [section, setSection] = useState<Section>('daily');

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['daily', 'range', 'register', 'employee'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={clsx(
              'px-4 py-[7px] rounded-lg text-[12px] font-medium cursor-pointer border',
              section === s ? 'bg-brand-orange border-brand-orange text-white' : 'bg-carbon border-transparent text-pos-faint',
            )}
          >
            {s === 'daily' ? 'Daily' : s === 'range' ? 'Date Range' : s === 'register' ? 'By Register' : 'By Employee'}
          </button>
        ))}
      </div>

      {section === 'daily'    && <DailySection storeId={storeId} />}
      {section === 'range'    && <RangeSection storeId={storeId} />}
      {section === 'register' && <RegisterSection storeId={storeId} />}
      {section === 'employee' && <EmployeeSection storeId={storeId} />}
    </div>
  );
}

function DailySection({ storeId }: { storeId: string }) {
  const [date, setDate]       = useState(today());
  const [report, setReport]   = useState<DailyReport | null>(null);
  const [error, setError]     = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetDailyReport(storeId, { date })
      .then(res => { if (!cancelled) setReport(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load report.'); });
    return () => { cancelled = true; };
  }, [storeId, date]);

  async function handleExport() {
    setExporting(true);
    setError('');
    try { await apiExportDailyReportCsv(storeId, { date }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to export CSV.'); }
    finally { setExporting(false); }
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-4 flex-wrap">
        <DarkField label="Date" className="mb-0!">
          <DarkInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        </DarkField>
        <DarkButton variant="outline" icon={<Download size={13} />} onClick={handleExport} loading={exporting}>Export CSV</DarkButton>
      </div>

      {error && <p className="text-[13px] text-error">{error}</p>}

      {report && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap">
            <DarkMetricCard label="Revenue" value={`$${report.summary.totalRevenue.toFixed(2)}`} sub={`${report.summary.totalTransactions} transactions`} />
            <DarkMetricCard label="Net Revenue" value={`$${report.summary.netRevenue.toFixed(2)}`} sub={`After $${report.summary.totalDiscount.toFixed(2)} discounts`} />
            <DarkMetricCard label="Avg Ticket" value={`$${report.summary.avgTransactionValue.toFixed(2)}`} />
            <DarkMetricCard label="Refunds" value={`$${report.summary.refundsTotal.toFixed(2)}`} sub={`${report.summary.refundsCount} refunds`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-carbon border border-charcoal rounded-xl p-4">
              <p className="text-[13px] font-semibold text-white mb-3">Top Products</p>
              {(report.topProducts ?? []).length === 0 ? (
                <p className="text-[12px] text-pos-muted">No sales yet for this day.</p>
              ) : (report.topProducts ?? []).map(p => (
                <div key={p.productId} className="flex justify-between py-1 border-b border-charcoal last:border-0">
                  <span className="text-[12px] text-white">{p.name}</span>
                  <span className="text-[12px] text-pos-faint">{p.qty} sold · ${p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="bg-carbon border border-charcoal rounded-xl p-4">
              <p className="text-[13px] font-semibold text-white mb-3">By Payment Method</p>
              {(['cash', 'card', 'other'] as const).map(pm => (
                <div key={pm} className="flex justify-between py-1 border-b border-charcoal last:border-0">
                  <span className="text-[12px] text-white capitalize">{pm}</span>
                  <span className="text-[12px] text-pos-faint">{report.byPaymentMethod[pm].count} · ${report.byPaymentMethod[pm].total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RangeSection({ storeId }: { storeId: string }) {
  const [from, setFrom]       = useState(today());
  const [to, setTo]           = useState(today());
  const [report, setReport]   = useState<DateRangeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetDateRangeReport(storeId, { from, to });
      setReport(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-4 flex-wrap">
        <DarkField label="From" className="mb-0!"><DarkInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></DarkField>
        <DarkField label="To" className="mb-0!"><DarkInput type="date" value={to} onChange={e => setTo(e.target.value)} /></DarkField>
        <DarkButton onClick={load} loading={loading}>Run Report</DarkButton>
      </div>

      {error && <p className="text-[13px] text-error">{error}</p>}

      {report && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap">
            <DarkMetricCard label="Revenue" value={`$${report.summary.totalRevenue.toFixed(2)}`} sub={`${report.summary.totalTransactions} transactions`} />
            <DarkMetricCard label="Net Revenue" value={`$${report.summary.netRevenue.toFixed(2)}`} />
            <DarkMetricCard label="Avg Ticket" value={`$${report.summary.avgTransactionValue.toFixed(2)}`} />
            <DarkMetricCard label="Refunds" value={`$${report.summary.refundsTotal.toFixed(2)}`} sub={`${report.summary.refundsCount} refunds`} />
          </div>
          <div className="bg-carbon border border-charcoal rounded-xl p-4">
            <p className="text-[13px] font-semibold text-white mb-3">Daily Breakdown</p>
            {(report.dailyBreakdown ?? []).map(d => (
              <div key={d.date} className="flex justify-between py-1 border-b border-charcoal last:border-0">
                <span className="text-[12px] text-white">{d.date}</span>
                <span className="text-[12px] text-pos-faint">${d.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RegisterSection({ storeId }: { storeId: string }) {
  const [registers, setRegisters] = useState<PosRegister[]>([]);
  const [registerId, setRegisterId] = useState('');
  const [report, setReport]     = useState<RegisterReport | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { apiListRegisters(storeId).then(res => setRegisters(res.data)).catch(() => {}); }, [storeId]);

  useEffect(() => {
    if (!registerId) { setReport(null); return; }
    let cancelled = false;
    setLoading(true);
    apiGetRegisterReport(registerId)
      .then(res => { if (!cancelled) setReport(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load report.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [registerId]);

  return (
    <div>
      <DarkField label="Register" className="max-w-[280px]">
        <DarkSelect value={registerId} onChange={e => setRegisterId(e.target.value)}>
          <option value="">Select a register…</option>
          {registers.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </DarkSelect>
      </DarkField>

      {loading && <p className="text-[13px] text-pos-muted">Loading…</p>}
      {error && <p className="text-[13px] text-error">{error}</p>}

      {report && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap mt-3">
            <DarkMetricCard label="Total Revenue" value={`$${report.summary.totalRevenue.toFixed(2)}`} />
            <DarkMetricCard label="Sessions" value={report.summary.totalSessions} />
            <DarkMetricCard label="Transactions" value={report.summary.totalTransactions} />
            <DarkMetricCard label="Avg per Session" value={`$${report.summary.avgPerSession.toFixed(2)}`} />
          </div>
          <div className="bg-carbon border border-charcoal rounded-xl p-4">
            <p className="text-[13px] font-semibold text-white mb-3">Sessions</p>
            {(report.sessions ?? []).slice(0, 20).map(s => (
              <div key={s.sessionId} className="flex justify-between py-1 border-b border-charcoal last:border-0">
                <span className="text-[12px] text-white">{new Date(s.openedAt).toLocaleString()}</span>
                <span className="text-[12px] text-pos-faint">${s.totalSales.toFixed(2)} · {s.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmployeeSection({ storeId }: { storeId: string }) {
  const [employees, setEmployees] = useState<PosEmployee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [report, setReport]       = useState<EmployeeReport | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { apiGetEmployees(storeId).then(res => setEmployees(res.data)).catch(() => {}); }, [storeId]);

  useEffect(() => {
    if (!employeeId) { setReport(null); return; }
    let cancelled = false;
    setLoading(true);
    apiGetEmployeeReport(employeeId, storeId)
      .then(res => { if (!cancelled) setReport(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load report.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId, storeId]);

  return (
    <div>
      <DarkField label="Employee" className="max-w-[280px]">
        <DarkSelect value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
          <option value="">Select an employee…</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </DarkSelect>
      </DarkField>

      {loading && <p className="text-[13px] text-pos-muted">Loading…</p>}
      {error && <p className="text-[13px] text-error">{error}</p>}

      {report && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap mt-3">
            <DarkMetricCard label="Total Revenue" value={`$${report.summary.totalRevenue.toFixed(2)}`} />
            <DarkMetricCard label="Transactions" value={report.summary.totalTransactions} />
            <DarkMetricCard label="Avg Ticket" value={`$${report.summary.avgTransactionValue.toFixed(2)}`} />
            <DarkMetricCard label="Sessions" value={report.summary.totalSessions} />
          </div>
          <div className="bg-carbon border border-charcoal rounded-xl p-4">
            <p className="text-[13px] font-semibold text-white mb-3">Recent Sales</p>
            {(report.recentSales ?? []).map(s => (
              <div key={s.saleId} className="flex justify-between py-1 border-b border-charcoal last:border-0">
                <span className="text-[12px] text-white">{s.saleNumber}</span>
                <span className="text-[12px] text-pos-faint">${s.total.toFixed(2)} · {s.paymentMethod}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
