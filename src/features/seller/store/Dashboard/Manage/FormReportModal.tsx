import { useEffect, useState } from 'react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { apiContactFormReport, type FormReportRow } from '@/api/services/storeContact';

const DAYS = [7, 30, 90, 365];
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

/** Contact Messages -> Form report: how many saw each form, started it and sent it, and where the messages came from. */
export function FormReportModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<FormReportRow[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [daily, setDaily] = useState<{ day: string; views: number; sent: number }[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiContactFormReport(storeId, days)
      .then(res => { if (!cancelled) { setRows(res.data.forms); setDaily(res.data.daily ?? []); setError(''); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the report.'); });
    return () => { cancelled = true; };
  }, [storeId, days, attempt]);

  return (
    <Modal title="Form report" onClose={onClose} width={760} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-3 text-[13px] text-charcoal">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Period">
          {DAYS.map(d => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => { setRows(null); setDays(d); }}
              className={`rounded-full border px-3 py-1 text-[12px] cursor-pointer ${days === d ? 'border-charcoal bg-charcoal text-white' : 'border-bone bg-white text-charcoal'}`}>
              Last {d === 365 ? 'year' : `${d} days`}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="m-0 text-error">{error} <button type="button" onClick={() => { setRows(null); setAttempt(a => a + 1); }} className="cursor-pointer border-0 bg-transparent p-0 text-error underline">Retry</button></p>
        )}
        {!rows && !error && <p className="m-0 text-slate">Loading…</p>}
        {rows && rows.length === 0 && <p className="m-0 rounded-lg bg-cream px-3 py-4 text-center text-slate">No form activity in this period yet.</p>}
        {rows && daily.length > 0 && (
          <div aria-label="Per day" role="img">
            <p className="m-0 mb-1 text-[11px] font-semibold uppercase text-slate">Per day (bars: seen, dark: sent)</p>
            <div className="flex h-20 items-end gap-px">
              {(() => {
                const max = Math.max(1, ...daily.map(d => Math.max(d.views, d.sent)));
                return daily.slice(-90).map(d => (
                  <div key={d.day} title={`${d.day}: ${d.views} seen, ${d.sent} sent`} className="relative flex-1 min-w-[2px] bg-bone" style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-charcoal" style={{ height: `${d.views ? Math.min(100, (d.sent / d.views) * 100) : (d.sent ? 100 : 0)}%` }} />
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-[11px] uppercase text-slate">
                  <th className="py-1.5 pr-3 font-semibold">Form</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Seen</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Started</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Sent</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Sent / seen</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Spam</th>
                  <th className="py-1.5 pl-3 font-semibold">Where they came from</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.sectionId || 'old'} className="border-t border-bone align-top">
                    <td className="py-2 pr-3 font-medium">{r.name || 'Unnamed form'}{(r.fields?.length ?? 0) > 0 && <button type="button" onClick={() => setOpen(open === r.sectionId ? null : r.sectionId)} aria-expanded={open === r.sectionId} className="ms-2 cursor-pointer border-0 bg-transparent p-0 text-[11px] font-normal text-slate underline">Where people stop</button>}{open === r.sectionId && <ul className="m-0 mt-1.5 list-none p-0 text-[12px] font-normal text-slate">{(r.fields ?? []).map(f => <li key={f.id} className="flex justify-between gap-3"><span className="truncate">{f.label}</span><span>{f.touched}</span></li>)}</ul>}</td>
                    <td className="px-2 py-2 text-right">{r.views}</td>
                    <td className="px-2 py-2 text-right">{r.starts}</td>
                    <td className="px-2 py-2 text-right font-semibold">{r.sent}</td>
                    <td className="px-2 py-2 text-right">{pct(r.sent, r.views)}</td>
                    <td className="px-2 py-2 text-right">{r.spam}</td>
                    <td className="py-2 pl-3 text-[12px] text-slate">
                      {Object.entries(r.sources).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k === 'unknown' ? 'not tracked' : k}: ${n}`).join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="m-0 text-[11px] text-slate">“Seen” and “Started” count visitors who accepted analytics cookies, so they can be lower than the real number. “Not tracked” = the visitor did not accept analytics.</p>
      </div>
    </Modal>
  );
}
