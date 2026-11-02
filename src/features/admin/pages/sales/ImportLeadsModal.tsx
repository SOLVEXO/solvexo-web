import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileUp } from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/comman/ui';
import { buildCsv, downloadTextFile, parseCsv } from '@/utils/csvFile';
import { apiImportLeads, type ImportResult, type ImportRow, type SalesOwner } from '@/api/services/salesOps';
import { errMsg } from './sales.utils';
import { FIELDS, TEMPLATE_HEADERS, guessMapping, type Field } from './importMapping';

/** CSV → leads: pick a file, check the column matches, see what will be added, then import. */
export function ImportLeadsModal({ owners, canAssign, onClose, onImported }: {
  owners: SalesOwner[]; canAssign: boolean; onClose: () => void; onImported: (created: number) => void;
}) {
  const [fileName, setFileName] = useState('');
  const [table, setTable] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<Field, number>>>({});
  const [sourceDetail, setSourceDetail] = useState('');
  const [owner, setOwner] = useState('');
  const [check, setCheck] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const headers = table?.[0] ?? [];
  const body = useMemo(() => table?.slice(1) ?? [], [table]);
  const rows: ImportRow[] = useMemo(() => body.map(cells => {
    const r: ImportRow = {};
    for (const f of FIELDS) { const i = mapping[f.key]; if (i !== undefined && cells[i]?.trim()) r[f.key] = cells[i].trim(); }
    return r;
  }), [body, mapping]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(''); setCheck(null);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) { setError('That file has no rows under the header.'); return; }
      if (parsed.length - 1 > 2000) { setError(`That file has ${parsed.length - 1} rows. Import up to 2,000 at a time.`); return; }
      setFileName(file.name); setTable(parsed); setMapping(guessMapping(parsed[0]));
      if (!sourceDetail) setSourceDetail(file.name.replace(/\.csv$/i, ''));
    } catch { setError('Could not read that file. Save it as CSV and try again.'); }
  };

  const send = async (dryRun: boolean) => {
    setBusy(true); setError('');
    try {
      const r = await apiImportLeads({ rows, dryRun, sourceDetail: sourceDetail.trim() || null, ...(canAssign ? { ownerAdminId: owner || null } : {}) });
      if (dryRun) setCheck(r.data); else onImported(r.data.created);
    } catch (e) { setError(errMsg(e, 'Could not import.')); }
    setBusy(false);
  };

  const footer = !table ? <Button variant="ghost" onClick={onClose}>Cancel</Button> : (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      {check
        ? <Button loading={busy} disabled={!check.wouldCreate} onClick={() => send(false)}>Import {check.wouldCreate} lead{check.wouldCreate === 1 ? '' : 's'}</Button>
        : <Button loading={busy} disabled={mapping.name === undefined} onClick={() => send(true)}>Check {body.length} row{body.length === 1 ? '' : 's'}</Button>}
    </div>
  );

  return (
    <Modal title="Import leads" onClose={onClose} width={620} footer={footer}>
      <div className="flex flex-col gap-4 text-[13px]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-brand-orange/60 text-brand-deep-orange cursor-pointer hover:bg-brand-pale-orange/40">
            <FileUp size={15} />{fileName || 'Choose a CSV file'}
            <input type="file" accept=".csv,text/csv" className="sr-only" aria-label="CSV file" onChange={e => void onFile(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={() => downloadTextFile('solvexo-leads-template.csv', buildCsv(TEMPLATE_HEADERS, [['Sara Malik', 'Sara Boutique', 'sara@example.com', '0300 1112223', 'Lahore', 'Clothing', '60000', 'Met at the Lahore expo']]))}
            className="inline-flex items-center gap-1 text-[12px] text-slate hover:text-charcoal bg-transparent border-0 cursor-pointer"><Download size={13} /> Template</button>
        </div>
        <p className="text-[12px] text-slate -mt-2">From Excel or Google Sheets: File → Download → CSV. Each lead needs a name and an email or phone. People already in the pipeline are skipped.</p>

        {table && (
          <>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Match your columns</p>
              <div className="grid sm:grid-cols-2 gap-x-3 gap-y-2">
                {FIELDS.map(f => (
                  <label key={f.key} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-[12px] text-charcoal">{f.label}{f.key === 'name' && ' *'}</span>
                    <select aria-label={`Column for ${f.label}`} value={mapping[f.key] ?? ''} onChange={e => { setCheck(null); setMapping(m => ({ ...m, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) })); }}
                      className="flex-1 min-w-0 border border-bone rounded-md px-2 py-1.5 text-[12px] bg-white">
                      <option value="">Not in file</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              {body[0] && <p className="text-[11px] text-slate mt-2 truncate">First row: {[rows[0]?.name, rows[0]?.businessName, rows[0]?.phone ?? rows[0]?.email].filter(Boolean).join(' · ') || '—'}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Where is this list from?" value={sourceDetail} onChange={e => setSourceDetail(e.target.value)} placeholder="e.g. Lahore expo 2026" />
              {canAssign && (
                <Select label="Give the leads to" value={owner} onChange={e => { setOwner(e.target.value); setCheck(null); }}>
                  <option value="">Nobody yet (unassigned)</option>
                  {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                </Select>
              )}
            </div>
          </>
        )}

        {check && (
          <div className="rounded-lg border border-bone bg-cream/60 p-3 flex flex-col gap-2" role="status">
            <p className="font-semibold text-charcoal">{check.wouldCreate} of {check.total} will be added.</p>
            {check.duplicates.length > 0 && (
              <details><summary className="cursor-pointer text-slate">{check.duplicates.length} already in the pipeline or repeated in the file</summary>
                <ul className="mt-1 ml-4 list-disc text-[12px] text-slate max-h-32 overflow-y-auto">
                  {check.duplicates.slice(0, 50).map(d => <li key={d.row}>Row {d.row}: {d.name}{d.inFile ? ' (repeated in the file)' : d.existingLeadId ? <> (<Link className="underline" to={`/admin/sales/leads/${d.existingLeadId}`} onClick={onClose}>open lead</Link>)</> : ''}</li>)}
                </ul>
              </details>
            )}
            {check.invalid.length > 0 && (
              <details open={check.wouldCreate === 0}><summary className="cursor-pointer text-error">{check.invalid.length} row{check.invalid.length === 1 ? '' : 's'} can’t be added</summary>
                <ul className="mt-1 ml-4 list-disc text-[12px] text-slate max-h-32 overflow-y-auto">
                  {check.invalid.slice(0, 50).map(d => <li key={d.row}>Row {d.row}: {d.reason}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
