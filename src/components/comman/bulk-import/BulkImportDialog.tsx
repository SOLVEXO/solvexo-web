import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, FileSpreadsheet, MinusCircle, RefreshCw, Upload, XCircle } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import {
  apiGetImportTemplate,
  apiRunBulkImport,
  type BulkImportData,
  type BulkTemplate,
} from '@/api/services/bulkImport';
import { buildCsv, downloadTextFile } from '@/utils/csvFile';

export interface BulkImportDialogProps {
  /** e.g. "Import customers" */
  title: string;
  /** Plural noun used in the summary, e.g. "customers". */
  entityLabel: string;
  /** Base API path; the dialog calls `${basePath}/import-template` and `${basePath}/import`. */
  basePath: string;
  onClose: () => void;
  /** Called after an import that changed anything, so the page can reload its list. */
  onImported?: (data: BulkImportData) => void;
  /** Extra one-line rules for this module, shown above the file picker. */
  notes?: string[];
  /** When set, a required checkbox gates the Import button and `consentConfirmed=true` is sent as an extra form field. */
  consent?: { label: string };
}

const MAX_SHOWN_FAILURES = 100;

/**
 * Shared "download template → fill → upload" dialog (Shopify-style import).
 * Valid rows are saved, invalid rows are listed with the reason and can be
 * downloaded as a corrected-ready file (only the failed rows + an Error column)
 * so the seller fixes just those and uploads the same file again.
 */
export function BulkImportDialog({ title, entityLabel, basePath, onClose, onImported, notes, consent }: BulkImportDialogProps) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [template, setTemplate] = useState<BulkTemplate | null>(null);
  const [templateError, setTemplateError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkImportData | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [templateTry, setTemplateTry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    apiGetImportTemplate(basePath)
      .then(res => { if (!cancelled) { setTemplate(res.data); setTemplateError(''); } })
      .catch((err: unknown) => {
        if (!cancelled) setTemplateError(err instanceof Error ? err.message : 'Could not load the template.');
      });
    return () => { cancelled = true; };
  }, [basePath, templateTry]);
  const loadTemplate = () => setTemplateTry(n => n + 1);

  const downloadTemplate = () => {
    if (template) downloadTextFile(template.filename, template.csv);
  };

  const pickFile = (f: File | undefined | null) => {
    setError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setFile(null);
      setError('Please choose a .csv file. In Excel use "Save as → CSV UTF-8".');
      return;
    }
    setFile(f);
  };

  const runImport = async () => {
    if (!file || (consent && !consentChecked)) return;
    setUploading(true);
    setError('');
    try {
      const res = await apiRunBulkImport(basePath, file, consent ? { consentConfirmed: 'true' } : undefined);
      setResult(res.data);
      if (res.data.created + res.data.updated > 0) onImported?.(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFailedRows = () => {
    if (!result) return;
    const headers = [...result.columns, 'Error'];
    const rows = result.failed.map(f => [...result.columns.map(c => f.values[c] ?? ''), f.error]);
    const base = (template?.filename ?? 'import.csv').replace(/\.csv$/i, '');
    downloadTextFile(`${base}-failed-rows.csv`, buildCsv(headers, rows));
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setError('');
  };

  /* ── result view ─────────────────────────────────────────────────────────── */
  if (result) {
    const saved = result.created + result.updated;
    return (
      <Modal
        title={`${title} — results`}
        onClose={onClose}
        width={560}
        footer={
          <>
            {result.failedCount > 0 && (
              <Button variant="outline" icon={<Download size={14} />} onClick={downloadFailedRows}>
                Download failed rows
              </Button>
            )}
            <Button variant="outline" onClick={reset}>Import another file</Button>
            <Button variant="primary" onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <Stat label="Added" value={result.created} tone="success" />
            <Stat label="Updated" value={result.updated} tone="success" />
            <Stat label="Skipped" value={result.skipped} tone="muted" />
            <Stat label="Failed" value={result.failedCount} tone={result.failedCount ? 'error' : 'muted'} />
          </div>
          <p className="text-[13px] text-charcoal" role="status">
            {saved > 0
              ? `${saved} of ${result.total} ${entityLabel} saved.`
              : result.total === 0
                ? `No ${entityLabel} found in the file — the template's example row is ignored.`
                : `No ${entityLabel} were saved.`}
            {result.failedCount > 0 && ' Fix the failed rows and upload the same file again — rows already saved are not duplicated.'}
          </p>

          {result.failedCount > 0 && (
            <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto border border-bone rounded-[8px] p-3" aria-label="Failed rows">
              {result.failed.slice(0, MAX_SHOWN_FAILURES).map(f => (
                <div key={f.row} className="flex items-start gap-2 text-[12px]">
                  <XCircle size={13} className="text-error shrink-0 mt-[1px]" />
                  <span className="text-slate">Row {f.row} — {f.error}</span>
                </div>
              ))}
              {result.failedCount > MAX_SHOWN_FAILURES && (
                <p className="text-[12px] text-slate">
                  …and {result.failedCount - MAX_SHOWN_FAILURES} more. Download the failed rows to see them all.
                </p>
              )}
            </div>
          )}

          {result.skipped > 0 && (
            <details className="text-[12px] text-slate">
              <summary className="cursor-pointer flex items-center gap-1.5">
                <MinusCircle size={13} /> {result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped
              </summary>
              <div className="mt-1.5 max-h-[140px] overflow-y-auto flex flex-col gap-1">
                {result.skippedRows.slice(0, MAX_SHOWN_FAILURES).map(s => (
                  <span key={s.row}>Row {s.row} — {s.note}</span>
                ))}
              </div>
            </details>
          )}
        </div>
      </Modal>
    );
  }

  /* ── upload view ─────────────────────────────────────────────────────────── */
  return (
    <Modal
      title={title}
      onClose={uploading ? () => {} : onClose}
      width={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button variant="primary" icon={<Upload size={14} />} onClick={runImport} disabled={!file || uploading || (!!consent && !consentChecked)} loading={uploading}>
            {uploading ? 'Importing…' : 'Import'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ol className="text-[13px] text-charcoal flex flex-col gap-1.5 list-decimal pl-5">
          <li>Download the template and fill in your {entityLabel} (delete the example row).</li>
          <li>Upload the CSV file. Valid rows are saved; rows with problems are skipped and listed.</li>
          <li>Fix only the failed rows and upload again.</li>
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={downloadTemplate} disabled={!template}>
            {template ? 'Download template' : templateError ? 'Template unavailable' : 'Loading template…'}
          </Button>
          {template && (
            <button
              type="button"
              onClick={() => setShowColumns(s => !s)}
              aria-expanded={showColumns}
              className="text-[12px] text-brand-orange underline cursor-pointer bg-transparent border-0"
            >
              {showColumns ? 'Hide column guide' : 'Show column guide'}
            </button>
          )}
        </div>

        {templateError && (
          <div className="flex items-center gap-2 text-[12px] text-error" role="alert">
            <AlertCircle size={14} className="shrink-0" /> {templateError}
            <button type="button" onClick={loadTemplate} className="flex items-center gap-1 underline cursor-pointer bg-transparent border-0 text-error">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {notes && notes.length > 0 && (
          <ul className="text-[12px] text-slate list-disc pl-5 flex flex-col gap-0.5">
            {notes.map(n => <li key={n}>{n}</li>)}
          </ul>
        )}

        {showColumns && template && (
          <div className="border border-bone rounded-[8px] max-h-[200px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-cream text-left">
                <tr><th className="px-2 py-1.5 font-semibold">Column</th><th className="px-2 py-1.5 font-semibold">Rules</th></tr>
              </thead>
              <tbody>
                {template.columns.map(c => (
                  <tr key={c.key} className="border-t border-bone align-top">
                    <td className="px-2 py-1.5 whitespace-nowrap font-medium text-charcoal">
                      {c.key}{c.required && <span className="text-error" title="Required"> *</span>}
                    </td>
                    <td className="px-2 py-1.5 text-slate">{c.description}{c.example ? ` Example: ${c.example}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
          className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-bone rounded-[10px] px-4 py-6 cursor-pointer hover:bg-cream focus-within:ring-2 focus-within:ring-brand-orange/50 text-center"
        >
          <FileSpreadsheet size={22} className="text-slate" />
          <span className="text-[13px] text-charcoal font-medium">
            {file ? file.name : 'Choose a CSV file or drop it here'}
          </span>
          <span className="text-[11px] text-slate">.csv, up to 5 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
          />
        </label>

        {consent && (
          <label className="flex items-start gap-2 text-[12px] text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={e => setConsentChecked(e.target.checked)}
              className="mt-[2px]"
            />
            <span>{consent.label}</span>
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 text-[12px] text-error" role="alert">
            <AlertCircle size={14} className="shrink-0 mt-[1px]" /> {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'success' | 'error' | 'muted' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'error' ? 'text-error' : 'text-slate';
  return (
    <div className="border border-bone rounded-[8px] py-2">
      <p className={`text-[18px] font-semibold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate">{label}</p>
    </div>
  );
}

